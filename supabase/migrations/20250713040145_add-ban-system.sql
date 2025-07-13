-- Adicionar sistema de banimento
-- Adicionar campo banned_until na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE;

-- Criar tabela de logs de banimentos
CREATE TABLE IF NOT EXISTS ban_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('ban', 'unban')),
    reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ban_logs_user_id ON ban_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_logs_admin_id ON ban_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_ban_logs_created_at ON ban_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_banned_until ON profiles(banned_until);

-- Criar função para verificar se usuário está banido
CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND banned_until IS NOT NULL 
        AND banned_until > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Criar função para banir usuário
CREATE OR REPLACE FUNCTION ban_user(
    p_user_id UUID,
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_duration_days INTEGER DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
    ban_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calcular data de fim do banimento
    ban_until := NOW() + INTERVAL '1 day' * p_duration_days;
    
    -- Atualizar perfil do usuário
    UPDATE profiles 
    SET 
        banned_until = ban_until,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Registrar log de banimento
    INSERT INTO ban_logs (user_id, admin_id, action, reason, banned_until)
    VALUES (p_user_id, p_admin_id, 'ban', p_reason, ban_until);
END;
$$ LANGUAGE plpgsql;

-- Criar função para desbanir usuário
CREATE OR REPLACE FUNCTION unban_user(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Atualizar perfil do usuário
    UPDATE profiles 
    SET 
        banned_until = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Registrar log de desblanimento
    INSERT INTO ban_logs (user_id, admin_id, action, reason)
    VALUES (p_user_id, p_admin_id, 'unban', 'Usuário desbanido pelo administrador');
END;
$$ LANGUAGE plpgsql;

-- Criar política RLS para ban_logs (apenas admin pode ver)
ALTER TABLE ban_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view ban logs" ON ban_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND email = 'arthurcos33@gmail.com'
        )
    );

CREATE POLICY "Admin can insert ban logs" ON ban_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND email = 'arthurcos33@gmail.com'
        )
    );

-- Atualizar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ban_logs_updated_at 
    BEFORE UPDATE ON ban_logs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE ban_logs IS 'Log de ações de banimento realizadas pelos administradores';
COMMENT ON COLUMN profiles.banned_until IS 'Data até quando o usuário está banido (NULL = não banido)';
COMMENT ON FUNCTION is_user_banned(UUID) IS 'Verifica se um usuário está atualmente banido';
COMMENT ON FUNCTION ban_user(UUID, UUID, TEXT, INTEGER) IS 'Função para banir um usuário por X dias';
COMMENT ON FUNCTION unban_user(UUID, UUID) IS 'Função para desbanir um usuário';
