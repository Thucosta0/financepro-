-- Script completo para corrigir a função is_admin_user()
-- Execute este script no painel do Supabase

-- ===========================================
-- 1. VERIFICAR USUÁRIO ATUAL ANTES DA CORREÇÃO
-- ===========================================

SELECT 
    'Dados do usuário atual:' as info,
    auth.uid() as user_id,
    auth.email() as user_email;

-- Verificar se o email arthurcos33@gmail.com existe
SELECT 
    'Verificando email admin na tabela auth.users:' as info,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'arthurcos33@gmail.com';

-- ===========================================
-- 2. REMOVER TODAS AS POLÍTICAS ADMINISTRATIVAS
-- ===========================================

-- Remover políticas que dependem da função
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all categories" ON categories;
DROP POLICY IF EXISTS "Admin can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can view all cards" ON cards;
DROP POLICY IF EXISTS "Admin can view all budgets" ON budgets;

DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admin can update any category" ON categories;
DROP POLICY IF EXISTS "Admin can update any transaction" ON transactions;
DROP POLICY IF EXISTS "Admin can update any card" ON cards;
DROP POLICY IF EXISTS "Admin can update any budget" ON budgets;

DROP POLICY IF EXISTS "Admin can delete any category" ON categories;
DROP POLICY IF EXISTS "Admin can delete any transaction" ON transactions;
DROP POLICY IF EXISTS "Admin can delete any card" ON cards;
DROP POLICY IF EXISTS "Admin can delete any budget" ON budgets;

DROP POLICY IF EXISTS "Admin can insert any category" ON categories;
DROP POLICY IF EXISTS "Admin can insert any transaction" ON transactions;
DROP POLICY IF EXISTS "Admin can insert any card" ON cards;
DROP POLICY IF EXISTS "Admin can insert any budget" ON budgets;

-- ===========================================
-- 3. REMOVER E RECRIAR A FUNÇÃO is_admin_user()
-- ===========================================

-- Agora pode remover a função sem problemas
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;

-- Criar função corrigida
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é o admin
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
          AND email = 'arthurcos33@gmail.com'
    );
END;
$$;

-- ===========================================
-- 4. TESTAR A FUNÇÃO CORRIGIDA
-- ===========================================

SELECT 
    'Teste da função corrigida:' as info,
    is_admin_user() as resultado,
    auth.email() as email_atual;

-- ===========================================
-- 5. RECRIAR TODAS AS POLÍTICAS ADMINISTRATIVAS
-- ===========================================

-- Políticas SELECT (VIEW) para admin
CREATE POLICY "Admin can view all profiles" ON profiles
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin can view all categories" ON categories
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin can view all transactions" ON transactions
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin can view all cards" ON cards
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin can view all budgets" ON budgets
FOR SELECT
TO authenticated
USING (is_admin_user());

-- Políticas UPDATE para admin
CREATE POLICY "Admin can update any profile" ON profiles
FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update any category" ON categories
FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update any transaction" ON transactions
FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update any card" ON cards
FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update any budget" ON budgets
FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Políticas DELETE para admin
CREATE POLICY "Admin can delete any category" ON categories
FOR DELETE
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin can delete any transaction" ON transactions
FOR DELETE
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin can delete any card" ON cards
FOR DELETE
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin can delete any budget" ON budgets
FOR DELETE
TO authenticated
USING (is_admin_user());

-- Políticas INSERT para admin
CREATE POLICY "Admin can insert any category" ON categories
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user());

CREATE POLICY "Admin can insert any transaction" ON transactions
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user());

CREATE POLICY "Admin can insert any card" ON cards
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user());

CREATE POLICY "Admin can insert any budget" ON budgets
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user());

-- ===========================================
-- 6. VERIFICAÇÃO FINAL COMPLETA
-- ===========================================

-- Testar a função após tudo
SELECT 
    'Teste final da função:' as info,
    is_admin_user() as resultado,
    auth.email() as email_atual;

-- Contar políticas recriadas
SELECT 
    'Políticas administrativas recriadas:' as info,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%Admin%';

-- Testar acesso aos dados
SELECT 
    'Teste de acesso aos dados:' as info,
    COUNT(*) as total_perfis_visiveis
FROM profiles;

-- Resultado final
SELECT 
    '=== RESULTADO FINAL ===' as status,
    CASE 
        WHEN is_admin_user() = true THEN '✅ Admin FUNCIONANDO'
        ELSE '❌ Admin AINDA FALHOU'
    END as admin_status,
    auth.email() as email_logado,
    (SELECT COUNT(*) FROM profiles) as perfis_visiveis,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE '%Admin%') as politicas_criadas;

-- Mensagem final
SELECT 
    'Função is_admin_user() e políticas recriadas com sucesso!' as status,
    'Agora teste o painel administrativo!' as instrucao; 