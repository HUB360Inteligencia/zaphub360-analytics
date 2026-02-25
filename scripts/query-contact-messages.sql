-- Mensagens que têm formato "dd/MM/yyyy HH:mm - ..." no início do texto
SELECT id, celular, data_mensagem, LEFT(mensagem, 80) AS inicio_mensagem
FROM contact_messages
WHERE mensagem ~ '^\d{2}/\d{2}/\d{4}\s+\d{1,2}:\d{2}\s+-'
LIMIT 5;
