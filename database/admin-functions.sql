-- =====================================================
-- FUNÇÕES ADMINISTRATIVAS PARA RESET DE TRANSAÇÕES
-- =====================================================

-- Criar tabela de logs administrativos
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    target_user_id UUID NOT NULL REFERENCES auth.users(id),
    operation_type VARCHAR(50) NOT NULL, -- 'reset', 'restore', 'backup'
    transactions_affected INTEGER DEFAULT 0,
    backup_created BOOLEAN DEFAULT false,
    operation_data JSONB,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de backup de transações
CREATE TABLE IF NOT EXISTS transactions_backup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_transaction_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Dados originais da transação
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID,
    card_id UUID,
    transaction_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    installments INTEGER DEFAULT 1,
    current_installment INTEGER DEFAULT 1,
    parent_transaction_id UUID,
    created_at_original TIMESTAMP WITH TIME ZONE,
    updated_at_original TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user ON admin_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_backup_user ON transactions_backup(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_backup_admin ON transactions_backup(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_backup_date ON transactions_backup(backup_date);

-- =====================================================
-- FUNÇÃO: Reset de transações de usuário
-- =====================================================
CREATE OR REPLACE FUNCTION admin_reset_user_transactions(
    target_user_id UUID,
    admin_user_id UUID,
    create_backup BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transactions_count INTEGER := 0;
    backup_success BOOLEAN := false;
    operation_success BOOLEAN := false;
    error_msg TEXT;
    result JSONB;
BEGIN
    -- Verificar se o usuário alvo existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário não encontrado',
            'user_id', target_user_id
        );
    END IF;

    -- Contar transações existentes
    SELECT COUNT(*) INTO transactions_count
    FROM transactions
    WHERE user_id = target_user_id;

    -- Se não há transações, retornar sucesso
    IF transactions_count = 0 THEN
        -- Registrar log
        INSERT INTO admin_logs (
            admin_user_id, target_user_id, operation_type,
            transactions_affected, success, operation_data
        ) VALUES (
            admin_user_id, target_user_id, 'reset',
            0, true, jsonb_build_object('message', 'Nenhuma transação encontrada')
        );

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Nenhuma transação encontrada para deletar',
            'transactions_deleted', 0,
            'backup_created', false,
            'user_id', target_user_id
        );
    END IF;

    BEGIN
        -- Criar backup se solicitado
        IF create_backup THEN
            INSERT INTO transactions_backup (
                original_transaction_id, user_id, admin_user_id,
                type, amount, description, category_id, card_id,
                transaction_date, is_completed, notes, installments,
                current_installment, parent_transaction_id,
                created_at_original, updated_at_original
            )
            SELECT 
                id, user_id, admin_user_id,
                type, amount, description, category_id, card_id,
                transaction_date, is_completed, notes, installments,
                current_installment, parent_transaction_id,
                created_at, updated_at
            FROM transactions
            WHERE user_id = target_user_id;
            
            backup_success := true;
        END IF;

        -- Deletar todas as transações do usuário
        DELETE FROM transactions WHERE user_id = target_user_id;
        
        operation_success := true;

        -- Registrar log de sucesso
        INSERT INTO admin_logs (
            admin_user_id, target_user_id, operation_type,
            transactions_affected, backup_created, success,
            operation_data
        ) VALUES (
            admin_user_id, target_user_id, 'reset',
            transactions_count, backup_success, true,
            jsonb_build_object(
                'backup_requested', create_backup,
                'backup_created', backup_success
            )
        );

        -- Retornar resultado de sucesso
        result := jsonb_build_object(
            'success', true,
            'message', format('Reset realizado com sucesso. %s transações deletadas.', transactions_count),
            'transactions_deleted', transactions_count,
            'backup_created', backup_success,
            'user_id', target_user_id
        );

    EXCEPTION WHEN OTHERS THEN
        error_msg := SQLERRM;
        
        -- Registrar log de erro
        INSERT INTO admin_logs (
            admin_user_id, target_user_id, operation_type,
            transactions_affected, backup_created, success,
            error_message, operation_data
        ) VALUES (
            admin_user_id, target_user_id, 'reset',
            transactions_count, backup_success, false,
            error_msg, jsonb_build_object(
                'backup_requested', create_backup,
                'error_during', CASE 
                    WHEN backup_success THEN 'delete'
                    WHEN create_backup THEN 'backup'
                    ELSE 'unknown'
                END
            )
        );

        -- Retornar erro
        result := jsonb_build_object(
            'success', false,
            'error', error_msg,
            'user_id', target_user_id,
            'transactions_affected', transactions_count,
            'backup_created', backup_success
        );
    END;

    RETURN result;
END;
$$;

-- =====================================================
-- FUNÇÃO: Restaurar transações do backup
-- =====================================================
CREATE OR REPLACE FUNCTION admin_restore_user_transactions(
    target_user_id UUID,
    admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_count INTEGER := 0;
    restored_count INTEGER := 0;
    error_msg TEXT;
    result JSONB;
BEGIN
    -- Verificar se existe backup para o usuário
    SELECT COUNT(*) INTO backup_count
    FROM transactions_backup
    WHERE user_id = target_user_id;

    IF backup_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Nenhum backup encontrado para este usuário',
            'user_id', target_user_id
        );
    END IF;

    BEGIN
        -- Restaurar transações do backup
        INSERT INTO transactions (
            id, user_id, type, amount, description,
            category_id, card_id, transaction_date, is_completed,
            notes, installments, current_installment,
            parent_transaction_id, created_at, updated_at
        )
        SELECT 
            original_transaction_id, user_id, type, amount, description,
            category_id, card_id, transaction_date, is_completed,
            notes, installments, current_installment,
            parent_transaction_id, created_at_original, updated_at_original
        FROM transactions_backup
        WHERE user_id = target_user_id
        ON CONFLICT (id) DO NOTHING;

        GET DIAGNOSTICS restored_count = ROW_COUNT;

        -- Limpar backup após restauração bem-sucedida
        DELETE FROM transactions_backup WHERE user_id = target_user_id;

        -- Registrar log de sucesso
        INSERT INTO admin_logs (
            admin_user_id, target_user_id, operation_type,
            transactions_affected, success, operation_data
        ) VALUES (
            admin_user_id, target_user_id, 'restore',
            restored_count, true,
            jsonb_build_object(
                'backup_transactions', backup_count,
                'restored_transactions', restored_count
            )
        );

        result := jsonb_build_object(
            'success', true,
            'message', format('Restauração realizada com sucesso. %s transações restauradas.', restored_count),
            'transactions_restored', restored_count,
            'user_id', target_user_id
        );

    EXCEPTION WHEN OTHERS THEN
        error_msg := SQLERRM;
        
        -- Registrar log de erro
        INSERT INTO admin_logs (
            admin_user_id, target_user_id, operation_type,
            transactions_affected, success, error_message
        ) VALUES (
            admin_user_id, target_user_id, 'restore',
            0, false, error_msg
        );

        result := jsonb_build_object(
            'success', false,
            'error', error_msg,
            'user_id', target_user_id
        );
    END;

    RETURN result;
END;
$$;

-- =====================================================
-- FUNÇÃO: Limpar backups antigos (executar periodicamente)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_transaction_backups(
    days_to_keep INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM transactions_backup
    WHERE backup_date < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Limpeza concluída. %s backups antigos removidos.', deleted_count),
        'deleted_backups', deleted_count,
        'days_kept', days_to_keep
    );
END;
$$;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_backup ENABLE ROW LEVEL SECURITY;

-- Política para admin_logs (apenas admins podem ver)
CREATE POLICY "Admin logs access" ON admin_logs
    FOR ALL USING (
        auth.uid() IN (
            -- Adicione aqui os UUIDs dos usuários admin
            -- Ou crie uma tabela de admins e faça JOIN
            SELECT id FROM auth.users WHERE email IN (
                'admin@financepro.com',
                'suporte@financepro.com'
            )
        )
    );

-- Política para transactions_backup (apenas admins podem ver)
CREATE POLICY "Transaction backup access" ON transactions_backup
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@financepro.com',
                'suporte@financepro.com'
            )
        )
    );

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE admin_logs IS 'Log de todas as operações administrativas realizadas';
COMMENT ON TABLE transactions_backup IS 'Backup temporário de transações antes do reset';
COMMENT ON FUNCTION admin_reset_user_transactions IS 'Reseta todas as transações de um usuário com opção de backup';
COMMENT ON FUNCTION admin_restore_user_transactions IS 'Restaura transações de um usuário a partir do backup';
COMMENT ON FUNCTION cleanup_old_transaction_backups IS 'Remove backups antigos para economizar espaço';

-- =====================================================
-- EXEMPLO DE USO
-- =====================================================
/*
-- Reset com backup
SELECT admin_reset_user_transactions(
    'uuid-do-usuario'::UUID,
    'uuid-do-admin'::UUID,
    true
);

-- Restaurar do backup
SELECT admin_restore_user_transactions(
    'uuid-do-usuario'::UUID,
    'uuid-do-admin'::UUID
);

-- Limpar backups antigos (manter apenas 30 dias)
SELECT cleanup_old_transaction_backups(30);

-- Ver logs administrativos
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 10;
*/