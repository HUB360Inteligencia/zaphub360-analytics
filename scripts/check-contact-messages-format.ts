/**
 * Script one-off: verifica se contact_messages.mensagem contém
 * o padrão "dd/MM/yyyy HH:mm - " no início (mensagem com data/hora no texto).
 * Rode: npx tsx scripts/check-contact-messages-format.ts
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

const url = process.env.VITE_SUPABASE_URL || 'https://getjlrpfsssuztcbfsbu.supabase.co';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdldGpscnBmc3NzdXp0Y2Jmc2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTQxNzAsImV4cCI6MjA2NjM5MDE3MH0._h-4Yk2Rvn2eZDGQtgS70bhJwWpZ1aG7edq2QBRhxfg';

const supabase = createClient<Database>(url, key);

// Padrão: começa com dd/MM/yyyy HH:mm ou H:mm seguido de " - "
const DATE_PREFIX_REGEX = /^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}\s+-\s+/;

async function main() {
  console.log('Buscando amostra de contact_messages (até 500 linhas)...\n');

  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, celular, data_mensagem, mensagem')
    .limit(500);

  if (error) {
    console.error('Erro ao buscar contact_messages:', error.message);
    process.exit(1);
  }

  const rows = data || [];
  const withDatePrefix = rows.filter((r) => r.mensagem && DATE_PREFIX_REGEX.test(r.mensagem));
  const withoutDatePrefix = rows.filter((r) => r.mensagem && !DATE_PREFIX_REGEX.test(r.mensagem));

  console.log(`Total de linhas buscadas: ${rows.length}`);
  console.log(`Com prefixo "dd/MM/yyyy HH:mm - " no texto: ${withDatePrefix.length}`);
  console.log(`Sem esse prefixo: ${withoutDatePrefix.length}`);
  console.log('');

  if (withDatePrefix.length > 0) {
    console.log('--- Amostra de mensagens COM data/hora no início do texto (contact_messages) ---');
    withDatePrefix.slice(0, 5).forEach((r, i) => {
      const inicio = (r.mensagem || '').substring(0, 80);
      console.log(`${i + 1}. id=${r.id} celular=${r.celular} data_mensagem=${r.data_mensagem}`);
      console.log(`   inicio_mensagem: ${inicio}${(r.mensagem?.length || 0) > 80 ? '...' : ''}`);
      console.log('');
    });
    console.log('Conclusão: a mensagem que aparece COM data e horário antes do texto vem da tabela contact_messages (coluna mensagem).');
  } else {
    console.log('Nenhuma linha encontrada com esse padrão na amostra. O formato pode estar em outra tabela ou a amostra pode ser pequena.');
  }
}

main();
