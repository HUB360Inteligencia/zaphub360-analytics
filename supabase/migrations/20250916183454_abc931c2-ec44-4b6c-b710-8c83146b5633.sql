-- Corrigir status_envio de 'fila' para 'pendente' nos registros existentes
UPDATE new_contact_event 
SET status_envio = 'pendente' 
WHERE status_envio = 'fila' OR status_envio = 'fila::text';