// Common job positions for autocomplete (Brazilian Portuguese)

export const COMMON_POSITIONS = [
  'Diretor',
  'Diretor Executivo',
  'Diretor Comercial',
  'Diretor Financeiro',
  'Diretor de Operações',
  'Diretor de Marketing',
  'Diretor de RH',
  'Diretor de TI',
  'Gerente',
  'Gerente Geral',
  'Gerente Comercial',
  'Gerente de Vendas',
  'Gerente de Marketing',
  'Gerente Financeiro',
  'Gerente de RH',
  'Gerente de Projetos',
  'Gerente de TI',
  'Gerente de Operações',
  'Coordenador',
  'Coordenador de Vendas',
  'Coordenador de Marketing',
  'Coordenador Financeiro',
  'Coordenador de RH',
  'Coordenador de TI',
  'Supervisor',
  'Supervisor de Vendas',
  'Supervisor de Produção',
  'Analista',
  'Analista de Sistemas',
  'Analista de Marketing',
  'Analista Financeiro',
  'Analista de RH',
  'Analista de Dados',
  'Analista de Negócios',
  'Assistente',
  'Assistente Administrativo',
  'Assistente Comercial',
  'Assistente Financeiro',
  'Assistente de Marketing',
  'Auxiliar',
  'Auxiliar Administrativo',
  'Auxiliar de Produção',
  'Consultor',
  'Consultor de Vendas',
  'Consultor de Negócios',
  'Consultor Técnico',
  'Engenheiro',
  'Engenheiro de Software',
  'Engenheiro de Produção',
  'Engenheiro Civil',
  'Engenheiro Mecânico',
  'Engenheiro Elétrico',
  'Desenvolvedor',
  'Desenvolvedor Full Stack',
  'Desenvolvedor Front-end',
  'Desenvolvedor Back-end',
  'Desenvolvedor Mobile',
  'Designer',
  'Designer Gráfico',
  'Designer de UI/UX',
  'Designer de Produto',
  'Advogado',
  'Contador',
  'Médico',
  'Enfermeiro',
  'Professor',
  'Empresário',
  'Empreendedor',
  'Autônomo',
  'Estagiário',
  'Trainee',
  'Outros',
];

/**
 * Filter positions based on search query
 */
export const filterPositions = (query: string): string[] => {
  if (!query || query.trim() === '') {
    return COMMON_POSITIONS;
  }
  
  const lowerQuery = query.toLowerCase();
  return COMMON_POSITIONS.filter(position => 
    position.toLowerCase().includes(lowerQuery)
  );
};
