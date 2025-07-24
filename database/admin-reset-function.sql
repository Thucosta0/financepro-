-- FUNÇÃO ADMINISTRATIVA PARA RESET DE TRANSAÇÕES
-- Esta função pode ser chamada pela aplicação para resetar transações de usuários

-- ===========================================
-- CRIAR FUNÇÃO DE RESET DE TRANSAÇÕES
-- ===========================================

CREATE OR REPLACE FUNCTION admin_reset_user_transactions(
  target_user_id UUID,
  admin_user_id UUID DEFAULT NULL,
  create_backup BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_count INTEGER;
  backup_count INTEGER := 0;
  result JSON;
BEGIN
  -- Verificar se o usuário alvo existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado',
      'user_id', target_user_id
    );
  END IF;

  -- Contar transações existentes (incluindo parceladas)
  SELECT COUNT(*) INTO transaction_count
  FROM public.transactions
  WHERE user_id = target_user_id;

  -- Se não há transações, retornar
  IF transaction_count = 0 THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Usuário não possui transações para resetar',
      'transactions_deleted', 0,
      'installment_transactions_deleted', 0,
      'backup_created', false
    );
  END IF;

  -- Criar backup se solicitado
  IF create_backup THEN
    -- Criar tabela de backup se não existir
    CREATE TABLE IF NOT EXISTS public.transactions_admin_backup (
      LIKE public.transactions INCLUDING ALL,
      backup_date TIMESTAMP DEFAULT NOW(),
      admin_user_id UUID,
      original_user_id UUID
    );

    -- Inserir backup
    INSERT INTO public.transactions_admin_backup (
      id, user_id, description, amount, type, category_id, card_id,
      transaction_date, due_date, notes, is_completed, installment_number,
      total_installments, installment_group_id, created_at, updated_at,
      admin_user_id, original_user_id
    )
    SELECT 
      id, user_id, description, amount, type, category_id, card_id,
      transaction_date, due_date, notes, is_completed, installment_number,
      total_installments, installment_group_id, created_at, updated_at,
      admin_user_id, target_user_id
    FROM public.transactions
    WHERE user_id = target_user_id;

    GET DIAGNOSTICS backup_count = ROW_COUNT;
  END IF;

  -- Deletar TODAS as transações (incluindo parceladas e recorrentes)
  -- Isso inclui:
  -- 1. Transações normais
  -- 2. Transações parceladas (com installment_number, total_installments, installment_group_id)
  -- 3. Qualquer transação recorrente que ainda possa existir
  DELETE FROM public.transactions
  WHERE user_id = target_user_id;

  -- Construir resultado
  result := json_build_object(
    'success', true,
    'message', 'Todas as transações resetadas com sucesso (incluindo parceladas)',
    'user_id', target_user_id,
    'transactions_deleted', transaction_count,
    'details', 'Reset incluiu transações normais, parceladas e recorrentes',
    'backup_created', create_backup,
    'backup_count', backup_count,
    'admin_user_id', admin_user_id,
    'reset_date', NOW()
  );

  -- Log da operação
  INSERT INTO public.admin_logs (admin_user_id, action, target_user_id, details)
  VALUES (
    admin_user_id,
    'RESET_TRANSACTIONS',
    target_user_id,
    result::text
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', target_user_id
    );
END;
$$;

-- ===========================================
-- CRIAR TABELA DE LOGS ADMINISTRATIVOS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- FUNÇÃO PARA RESTAURAR TRANSAÇÕES DO BACKUP
-- ===========================================

CREATE OR REPLACE FUNCTION admin_restore_user_transactions(
  target_user_id UUID,
  admin_user_id UUID DEFAULT NULL,
  backup_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restored_count INTEGER := 0;
  result JSON;
BEGIN
  -- Verificar se existe backup
  IF NOT EXISTS (
    SELECT 1 FROM public.transactions_admin_backup 
    WHERE original_user_id = target_user_id
    AND (backup_date IS NULL OR DATE(backup_date) = DATE(backup_date))
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Backup não encontrado para este usuário',
      'user_id', target_user_id
    );
  END IF;

  -- Restaurar transações do backup mais recente
  INSERT INTO public.transactions (
    id, user_id, description, amount, type, category_id, card_id,
    transaction_date, due_date, notes, is_completed, installment_number,
    total_installments, installment_group_id, created_at, updated_at
  )
  SELECT 
    gen_random_uuid(), -- Novo ID para evitar conflitos
    user_id, description, amount, type, category_id, card_id,
    transaction_date, due_date, notes, is_completed, installment_number,
    total_installments, installment_group_id, created_at, updated_at
  FROM public.transactions_admin_backup
  WHERE original_user_id = target_user_id
  AND (backup_date IS NULL OR DATE(backup_date) = DATE(backup_date))
  ORDER BY backup_date DESC;

  GET DIAGNOSTICS restored_count = ROW_COUNT;

  result := json_build_object(
    'success', true,
    'message', 'Transações restauradas com sucesso',
    'user_id', target_user_id,
    'transactions_restored', restored_count,
    'admin_user_id', admin_user_id,
    'restore_date', NOW()
  );

  -- Log da operação
  INSERT INTO public.admin_logs (admin_user_id, action, target_user_id, details)
  VALUES (
    admin_user_id,
    'RESTORE_TRANSACTIONS',
    target_user_id,
    result::text
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', target_user_id
    );
END;
$$;

-- ===========================================
-- EXEMPLOS DE USO DAS FUNÇÕES
-- ===========================================

-- Reset com backup (recomendado)
-- SELECT admin_reset_user_transactions(
--   'user-id-aqui'::UUID,
--   'admin-id-aqui'::UUID,
--   true
-- );

-- Reset sem backup (cuidado!)
-- SELECT admin_reset_user_transactions(
--   'user-id-aqui'::UUID,
--   'admin-id-aqui'::UUID,
--   false
-- );

-- Restaurar do backup
-- SELECT admin_restore_user_transactions(
--   'user-id-aqui'::UUID,
--   'admin-id-aqui'::UUID
-- );

-- Ver logs administrativos
-- SELECT * FROM public.admin_logs 
-- WHERE action IN ('RESET_TRANSACTIONS', 'RESTORE_TRANSACTIONS')
-- ORDER BY created_at DESC;

-- Ver backups disponíveis
-- SELECT 
--   original_user_id,
--   COUNT(*) as transaction_count,
--   MIN(backup_date) as first_backup,
--   MAX(backup_date) as last_backup
-- FROM public.transactions_admin_backup
-- GROUP BY original_user_id
-- ORDER BY last_backup DESC;

-- ===========================================
-- POLÍTICAS DE SEGURANÇA
-- ===========================================

-- Apenas administradores podem executar essas funções
-- Adicione verificações de permissão conforme necessário

-- Exemplo de verificação de admin:
-- CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
-- RETURNS BOOLEAN
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM public.profiles 
--     WHERE id = user_id AND is_admin = true
--   );
-- END;
-- $$;