-- Adicionar sistema de premium
-- Adicionar campos de premium na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until ON profiles(premium_until);

-- Criar função para verificar se usuário tem premium ativo
CREATE OR REPLACE FUNCTION is_user_premium(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_premium = true
        AND (premium_until IS NULL OR premium_until > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Criar função para conceder premium
CREATE OR REPLACE FUNCTION grant_premium(
    p_user_id UUID,
    p_admin_id UUID,
    p_duration_days INTEGER DEFAULT 365
)
RETURNS VOID AS $$
DECLARE
    premium_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calcular data de fim do premium
    premium_until := NOW() + INTERVAL '1 day' * p_duration_days;
    
    -- Atualizar perfil do usuário
    UPDATE profiles 
    SET 
        is_premium = true,
        premium_until = premium_until,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Criar função para remover premium
CREATE OR REPLACE FUNCTION revoke_premium(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Atualizar perfil do usuário
    UPDATE profiles 
    SET 
        is_premium = false,
        premium_until = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON COLUMN profiles.is_premium IS 'Indica se o usuário tem acesso premium';
COMMENT ON COLUMN profiles.premium_until IS 'Data até quando o premium é válido (NULL = permanente)';
COMMENT ON FUNCTION is_user_premium(UUID) IS 'Verifica se um usuário tem premium ativo';
COMMENT ON FUNCTION grant_premium(UUID, UUID, INTEGER) IS 'Função para conceder premium por X dias';
COMMENT ON FUNCTION revoke_premium(UUID, UUID) IS 'Função para remover premium'; 