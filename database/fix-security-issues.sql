-- Script para corrigir problemas de segurança identificados pelo Supabase Linter
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- 1. CORRIGIR VIEWS COM SECURITY DEFINER
-- ========================================

-- Recriar view financial_summary sem SECURITY DEFINER
DROP VIEW IF EXISTS public.financial_summary;
CREATE VIEW public.financial_summary AS
SELECT 
    t.user_id,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as balance,
    COUNT(*) as transaction_count
FROM transactions t
WHERE t.user_id = auth.uid()
GROUP BY t.user_id;

-- Recriar view budget_tracking sem SECURITY DEFINER
DROP VIEW IF EXISTS public.budget_tracking;
CREATE VIEW public.budget_tracking AS
SELECT 
    b.id,
    b.user_id,
    b.category_id,
    b.budget_limit as budget_amount,
    c.name as category_name,
    COALESCE(SUM(t.amount), 0) as spent_amount,
    (b.budget_limit - COALESCE(SUM(t.amount), 0)) as remaining_amount,
    CASE 
        WHEN COALESCE(SUM(t.amount), 0) > b.budget_limit THEN 'over_budget'
        WHEN COALESCE(SUM(t.amount), 0) > (b.budget_limit * 0.8) THEN 'warning'
        ELSE 'on_track'
    END as status
FROM budgets b
LEFT JOIN categories c ON b.category_id = c.id
LEFT JOIN transactions t ON t.category_id = b.category_id 
    AND t.user_id = b.user_id 
    AND t.type = 'expense'
    AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
WHERE b.user_id = auth.uid()
GROUP BY b.id, b.user_id, b.category_id, b.budget_limit, c.name;

-- Recriar view expenses_by_category sem SECURITY DEFINER
DROP VIEW IF EXISTS public.expenses_by_category;
CREATE VIEW public.expenses_by_category AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.color as category_color,
    SUM(t.amount) as total_amount,
    COUNT(t.id) as transaction_count,
    AVG(t.amount) as average_amount
FROM categories c
LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'expense'
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.name, c.color
ORDER BY total_amount DESC;

-- Recriar view user_subscription_status sem SECURITY DEFINER
DROP VIEW IF EXISTS public.user_subscription_status;
CREATE VIEW public.user_subscription_status AS
SELECT 
    p.id as user_id,
    p.is_premium,
    p.premium_until,
    CASE 
        WHEN p.is_premium AND (p.premium_until IS NULL OR p.premium_until > NOW()) THEN 'active'
        WHEN p.is_premium AND p.premium_until <= NOW() THEN 'expired'
        ELSE 'free'
    END as status,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.plan_id,
    s.status as subscription_status
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.id = auth.uid();

-- ========================================
-- 2. CORRIGIR FUNÇÕES COM SEARCH_PATH MUTABLE
-- ========================================

-- Função check_user_limits
CREATE OR REPLACE FUNCTION public.check_user_limits()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_premium boolean;
    transaction_count integer;
BEGIN
    -- Verificar se o usuário é premium
    SELECT is_premium INTO user_premium
    FROM profiles
    WHERE id = auth.uid();
    
    -- Se for premium, não há limites
    IF user_premium THEN
        RETURN true;
    END IF;
    
    -- Contar transações do mês atual
    SELECT COUNT(*) INTO transaction_count
    FROM transactions
    WHERE user_id = auth.uid()
    AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE);
    
    -- Limite de 50 transações para usuários gratuitos
    RETURN transaction_count < 50;
END;
$$;

-- Função create_free_subscription
DROP FUNCTION IF EXISTS public.create_free_subscription(uuid);
CREATE OR REPLACE FUNCTION public.create_free_subscription(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO subscriptions (user_id, plan_id, status, created_at, updated_at)
    VALUES (user_id_param, 'free', 'active', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Função is_user_premium
CREATE OR REPLACE FUNCTION public.is_user_premium()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    premium_status boolean;
BEGIN
    SELECT is_premium INTO premium_status
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(premium_status, false);
END;
$$;

-- Função grant_premium
CREATE OR REPLACE FUNCTION public.grant_premium(target_user_id uuid, expires_at timestamp with time zone DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem conceder premium';
    END IF;
    
    UPDATE profiles
    SET is_premium = true,
        premium_until = expires_at,
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;

-- Função revoke_premium
CREATE OR REPLACE FUNCTION public.revoke_premium(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem revogar premium';
    END IF;
    
    UPDATE profiles
    SET is_premium = false,
        premium_until = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;

-- Função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    
    -- Criar categorias padrão
    PERFORM create_default_categories(NEW.id);
    
    -- Criar assinatura gratuita
    PERFORM create_free_subscription(NEW.id);
    
    RETURN NEW;
END;
$$;

-- Função increment_usage
CREATE OR REPLACE FUNCTION public.increment_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar limites antes de inserir
    IF NOT check_user_limits() THEN
        RAISE EXCEPTION 'Limite de transações atingido. Faça upgrade para premium.';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Função handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Função create_default_categories
DROP FUNCTION IF EXISTS public.create_default_categories(uuid);
CREATE OR REPLACE FUNCTION public.create_default_categories(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO categories (user_id, name, color, type, created_at, updated_at) VALUES
    (user_id_param, 'Alimentação', '#FF6B6B', 'expense', NOW(), NOW()),
    (user_id_param, 'Transporte', '#4ECDC4', 'expense', NOW(), NOW()),
    (user_id_param, 'Moradia', '#45B7D1', 'expense', NOW(), NOW()),
    (user_id_param, 'Saúde', '#96CEB4', 'expense', NOW(), NOW()),
    (user_id_param, 'Educação', '#FFEAA7', 'expense', NOW(), NOW()),
    (user_id_param, 'Lazer', '#DDA0DD', 'expense', NOW(), NOW()),
    (user_id_param, 'Salário', '#98D8C8', 'income', NOW(), NOW()),
    (user_id_param, 'Freelance', '#F7DC6F', 'income', NOW(), NOW()),
    (user_id_param, 'Investimentos', '#BB8FCE', 'income', NOW(), NOW())
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;

-- Função create_sample_data removida (usuário não quer transações de exemplo)

-- Função recreate_user_categories
DROP FUNCTION IF EXISTS public.recreate_user_categories(uuid);
CREATE OR REPLACE FUNCTION public.recreate_user_categories(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem recriar categorias';
    END IF;
    
    -- Deletar categorias existentes
    DELETE FROM categories WHERE user_id = target_user_id;
    
    -- Recriar categorias padrão
    PERFORM create_default_categories(target_user_id);
END;
$$;

-- Função fix_user_categories
DROP FUNCTION IF EXISTS public.fix_user_categories(uuid);
CREATE OR REPLACE FUNCTION public.fix_user_categories(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem corrigir categorias';
    END IF;
    
    -- Criar categorias que não existem
    PERFORM create_default_categories(target_user_id);
END;
$$;

-- Função diagnose_categories
DROP FUNCTION IF EXISTS public.diagnose_categories(uuid);
CREATE OR REPLACE FUNCTION public.diagnose_categories(target_user_id uuid)
RETURNS TABLE(category_name text, category_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem diagnosticar categorias';
    END IF;
    
    RETURN QUERY
    SELECT c.name, COUNT(*) as count
    FROM categories c
    WHERE c.user_id = target_user_id
    GROUP BY c.name
    ORDER BY c.name;
END;
$$;

-- Função test_category_edit
CREATE OR REPLACE FUNCTION public.test_category_edit(category_id_param uuid, new_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem testar edição de categorias';
    END IF;
    
    UPDATE categories
    SET name = new_name,
        updated_at = NOW()
    WHERE id = category_id_param;
    
    RETURN FOUND;
END;
$$;

-- Função is_admin_user
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email text;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Lista de emails de administradores
    RETURN user_email IN ('admin@financepro.com', 'thucosta@gmail.com');
END;
$$;

-- Função get_user_by_username_or_email
DROP FUNCTION IF EXISTS public.get_user_by_username_or_email(text);
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(search_term text)
RETURNS TABLE(
    user_id uuid,
    email text,
    username text,
    is_premium boolean,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem buscar usuários';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id as user_id,
        au.email,
        p.username,
        p.is_premium,
        p.created_at
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE p.username ILIKE '%' || search_term || '%'
       OR au.email ILIKE '%' || search_term || '%'
    LIMIT 10;
END;
$$;

-- ========================================
-- 3. HABILITAR RLS NAS VIEWS
-- ========================================

-- Habilitar RLS nas views (se aplicável)
ALTER VIEW public.financial_summary OWNER TO postgres;
ALTER VIEW public.budget_tracking OWNER TO postgres;
ALTER VIEW public.expenses_by_category OWNER TO postgres;
ALTER VIEW public.user_subscription_status OWNER TO postgres;

-- ========================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON VIEW public.financial_summary IS 'Resumo financeiro do usuário autenticado';
COMMENT ON VIEW public.budget_tracking IS 'Acompanhamento de orçamentos do usuário autenticado';
COMMENT ON VIEW public.expenses_by_category IS 'Gastos por categoria do usuário autenticado';
COMMENT ON VIEW public.user_subscription_status IS 'Status de assinatura do usuário autenticado';

-- ========================================
-- INSTRUÇÕES PARA CONFIGURAÇÕES DE AUTH
-- ========================================

/*
Para corrigir os warnings de autenticação, acesse o painel do Supabase:

1. AUTH OTP LONG EXPIRY:
   - Vá para Authentication > Settings
   - Em "Email" settings, defina "OTP expiry" para 3600 segundos (1 hora) ou menos

2. LEAKED PASSWORD PROTECTION:
   - Vá para Authentication > Settings
   - Em "Password Protection", habilite "Enable leaked password protection"

Estas configurações devem ser feitas através da interface do Supabase, não via SQL.
*/

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se todas as funções foram criadas corretamente
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'check_user_limits',
    'create_free_subscription',
    'is_user_premium',
    'grant_premium',
    'revoke_premium',
    'handle_new_user',
    'increment_usage',
    'handle_updated_at',
    'create_default_categories',

    'recreate_user_categories',
    'fix_user_categories',
    'diagnose_categories',
    'test_category_edit',
    'is_admin_user',
    'get_user_by_username_or_email'
)
ORDER BY routine_name;

-- Verificar se todas as views foram criadas corretamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'financial_summary',
    'budget_tracking',
    'expenses_by_category',
    'user_subscription_status'
)
ORDER BY table_name;

SELECT 'Script de correção de segurança executado com sucesso!' as status;