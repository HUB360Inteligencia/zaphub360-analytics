-- Update user role to saas_admin for the main user
UPDATE profiles 
SET role = 'saas_admin' 
WHERE email = 'contato.grodrigo@gmail.com';