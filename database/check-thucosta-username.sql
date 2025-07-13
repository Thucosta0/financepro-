-- VERIFICAR SE THUCOSTA EXISTE
SELECT 
    'Username thucosta:' as teste,
    p.id,
    p.username,
    u.email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.username ILIKE 'thucosta'; 