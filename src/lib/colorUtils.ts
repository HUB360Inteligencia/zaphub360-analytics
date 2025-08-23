// Deterministic color generation for charts
export const generateDeterministicColor = (index: number, total: number): string => {
  // Generate HSL colors with good distribution
  const hue = (index * 360) / total;
  const saturation = 65 + (index % 3) * 10; // 65%, 75%, 85%
  const lightness = 50 + (index % 2) * 10; // 50%, 60%
  
  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
};

// Generate colors for profile analysis ensuring uniqueness
export const generateProfileColors = (profiles: string[]): Record<string, string> => {
  const colorMap: Record<string, string> = {};
  
  profiles.forEach((profile, index) => {
    colorMap[profile] = generateDeterministicColor(index, profiles.length);
  });
  
  return colorMap;
};

// Predefined colors for common statuses to maintain consistency
export const statusColors: Record<string, string> = {
  'fila': '#6B7280',
  'enviado': '#3B82F6',
  'lido': '#8B5CF6',
  'respondido': '#10B981',
  'erro': '#EF4444',
  'pendente': '#F59E0B', // Different from 'fila'
  // Legacy mappings
  'enviada': '#3B82F6',
  'entregue': '#10B981', 
  'respondida': '#10B981',
  'failed': '#EF4444',
  'pending': '#F59E0B',
  'delivered': '#10B981',
  'read': '#8B5CF6',
  'responded': '#10B981',
  'error': '#EF4444',
  'queued': '#6B7280',
};