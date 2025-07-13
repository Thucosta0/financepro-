-- Corrigir políticas RLS para permitir acesso administrativo completo
-- Execute este script no painel do Supabase para resolver problemas de acesso

-- Email do administrador
-- arthurcos33@gmail.com

-- ===========================================
-- REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ===========================================

-- Remover todas as políticas da tabela profiles
DROP POLICY IF EXISTS "Allow authenticated users to read profiles for login" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Remover todas as políticas da tabela categories
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Admin can view all categories" ON categories;

-- Remover todas as políticas da tabela transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON transactions;

-- Remover todas as políticas da tabela cards
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
DROP POLICY IF EXISTS "Admin can view all cards" ON cards;

-- Remover todas as políticas da tabela budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Admin can view all budgets" ON budgets;

-- ===========================================
-- CRIAR POLÍTICAS ADMINISTRATIVAS PARA PROFILES
-- ===========================================

-- Política para admin ver todos os perfis
CREATE POLICY "Admin can view all profiles" ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'arthurcos33@gmail.com'
  )
);

-- Política para usuários verem apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política para usuários atualizarem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para inserir novo perfil
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ===========================================
-- CRIAR POLÍTICAS ADMINISTRATIVAS PARA CATEGORIES
-- ===========================================

-- Política para admin ver todas as categorias
CREATE POLICY "Admin can view all categories" ON categories
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'arthurcos33@gmail.com'
  )
);

-- Política para usuários verem apenas suas próprias categorias
CREATE POLICY "Users can view own categories" ON categories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para inserir, atualizar e deletar (apenas próprios dados)
CREATE POLICY "Users can insert own categories" ON categories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===========================================
-- CRIAR POLÍTICAS ADMINISTRATIVAS PARA TRANSACTIONS
-- ===========================================

-- Política para admin ver todas as transações
CREATE POLICY "Admin can view all transactions" ON transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'arthurcos33@gmail.com'
  )
);

-- Política para usuários verem apenas suas próprias transações
CREATE POLICY "Users can view own transactions" ON transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para inserir, atualizar e deletar (apenas próprios dados)
CREATE POLICY "Users can insert own transactions" ON transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===========================================
-- CRIAR POLÍTICAS ADMINISTRATIVAS PARA CARDS
-- ===========================================

-- Política para admin ver todos os cartões
CREATE POLICY "Admin can view all cards" ON cards
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'arthurcos33@gmail.com'
  )
);

-- Política para usuários verem apenas seus próprios cartões
CREATE POLICY "Users can view own cards" ON cards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para inserir, atualizar e deletar (apenas próprios dados)
CREATE POLICY "Users can insert own cards" ON cards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON cards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===========================================
-- CRIAR POLÍTICAS ADMINISTRATIVAS PARA BUDGETS
-- ===========================================

-- Política para admin ver todos os orçamentos
CREATE POLICY "Admin can view all budgets" ON budgets
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'arthurcos33@gmail.com'
  )
);

-- Política para usuários verem apenas seus próprios orçamentos
CREATE POLICY "Users can view own budgets" ON budgets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para inserir, atualizar e deletar (apenas próprios dados)
CREATE POLICY "Users can insert own budgets" ON budgets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===========================================
-- VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- ===========================================

-- Verificar se as políticas foram criadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'categories', 'transactions', 'cards', 'budgets')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'categories', 'transactions', 'cards', 'budgets')
ORDER BY tablename;

-- Listar todas as tabelas existentes para confirmação
SELECT 
    tablename,
    'Tabela existe' as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Mensagem de sucesso
SELECT 'Políticas RLS criadas com sucesso! ✅' as status; 