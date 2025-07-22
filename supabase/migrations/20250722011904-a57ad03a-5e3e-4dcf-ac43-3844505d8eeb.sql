
-- Adicionar campos necessários na tabela campaigns para integração com N8n
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS intervalo_minimo INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS intervalo_maximo INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS horario_disparo_inicio TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS horario_disparo_fim TIME DEFAULT '20:00:00',
ADD COLUMN IF NOT EXISTS tipo_conteudo TEXT[] DEFAULT ARRAY['texto'];

-- Criar índices para otimizar consultas do N8n
CREATE INDEX IF NOT EXISTS idx_mensagens_campanhas_status ON mensagens_campanhas(status_mensagem);
CREATE INDEX IF NOT EXISTS idx_mensagens_campanhas_campanha ON mensagens_campanhas(id_campanha);
CREATE INDEX IF NOT EXISTS idx_campanha_instancia_campanha ON campanha_instancia(id_campanha);

-- Adicionar trigger para atualizar métricas automaticamente
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar métricas da campanha quando mensagens mudam de status
  UPDATE campaigns 
  SET 
    total_mensagens = (
      SELECT COUNT(*) FROM mensagens_campanhas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha)
    ),
    mensagens_enviadas = (
      SELECT COUNT(*) FROM mensagens_campanhas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha) 
      AND status_mensagem = 'enviada'
    ),
    mensagens_lidas = (
      SELECT COUNT(*) FROM mensagens_campanhas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha) 
      AND horario_leitura IS NOT NULL
    ),
    mensagens_respondidas = (
      SELECT COUNT(*) FROM mensagens_campanhas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha) 
      AND horario_resposta IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.id_campanha, OLD.id_campanha);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que atualiza métricas automaticamente
DROP TRIGGER IF EXISTS trigger_update_campaign_metrics ON mensagens_campanhas;
CREATE TRIGGER trigger_update_campaign_metrics
  AFTER INSERT OR UPDATE OR DELETE ON mensagens_campanhas
  FOR EACH ROW EXECUTE FUNCTION update_campaign_metrics();
