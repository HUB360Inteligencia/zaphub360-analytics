import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EventAnalytics {
  totalMessages: number;
  deliveredMessages: number;
  readMessages: number;
  responseMessages: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  hourlyActivity: Array<{
    hour: string;
    messages: number;
    delivered: number;
    read: number;
    responded: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
}

export const useEventAnalytics = (eventId?: string) => {
  const { organization } = useAuth();

  const eventAnalyticsQuery = useQuery({
    queryKey: ['event-analytics', organization?.id, eventId],
    queryFn: async (): Promise<EventAnalytics> => {
      if (!organization?.id) {
        return {
          totalMessages: 0,
          deliveredMessages: 0,
          readMessages: 0,
          responseMessages: 0,
          deliveryRate: 0,
          readRate: 0,
          responseRate: 0,
          hourlyActivity: [],
          statusDistribution: []
        };
      }

      let query = supabase
        .from('event_messages')
        .select('*')
        .eq('organization_id', organization.id);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error fetching event analytics:', error);
        throw error;
      }

      const totalMessages = messages?.length || 0;
      const deliveredMessages = messages?.filter(m => m.delivered_at).length || 0;
      const readMessages = messages?.filter(m => m.read_at).length || 0;
      const responseMessages = messages?.filter(m => m.responded_at).length || 0;

      const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
      const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
      const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 0;

      // Agrupar por hora para atividade horária
      const hourlyData = new Map();
      messages?.forEach(message => {
        if (!message.sent_at) return;
        
        const hour = new Date(message.sent_at).getHours();
        const key = `${hour.toString().padStart(2, '0')}:00`;
        
        if (!hourlyData.has(key)) {
          hourlyData.set(key, { messages: 0, delivered: 0, read: 0, responded: 0 });
        }
        
        const data = hourlyData.get(key);
        data.messages++;
        if (message.delivered_at) data.delivered++;
        if (message.read_at) data.read++;
        if (message.responded_at) data.responded++;
      });

      const hourlyActivity = Array.from(hourlyData.entries()).map(([hour, data]) => ({
        hour,
        ...data
      })).sort((a, b) => a.hour.localeCompare(b.hour));

      // Distribuição por status
      const statusCounts = new Map();
      messages?.forEach(message => {
        const status = message.status || 'unknown';
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });

      const statusColors = {
        queued: '#6B7280',
        sent: '#3B82F6',
        delivered: '#10B981',
        read: '#8B5CF6',
        failed: '#EF4444',
        unknown: '#9CA3AF'
      };

      const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
        color: statusColors[status as keyof typeof statusColors] || '#9CA3AF'
      }));

      return {
        totalMessages,
        deliveredMessages,
        readMessages,
        responseMessages,
        deliveryRate,
        readRate,
        responseRate,
        hourlyActivity,
        statusDistribution
      };
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    analytics: eventAnalyticsQuery.data,
    isLoading: eventAnalyticsQuery.isLoading,
    error: eventAnalyticsQuery.error,
    refetch: eventAnalyticsQuery.refetch,
  };
};