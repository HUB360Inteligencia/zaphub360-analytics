import { useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorDetails {
  code?: string;
  message: string;
  details?: any;
}

export const useErrorHandler = () => {
  const handleError = useCallback((error: any, context: string = 'Erro inesperado') => {
    console.error(`Error in ${context}:`, error);

    let userMessage = 'Ocorreu um erro inesperado. Tente novamente.';
    
    // Handle Supabase specific errors
    if (error?.code) {
      switch (error.code) {
        case 'PGRST116':
          userMessage = 'Dados não encontrados.';
          break;
        case '23505':
          userMessage = 'Este item já existe.';
          break;
        case '23503':
          userMessage = 'Não é possível excluir este item pois está sendo usado.';
          break;
        case '42501':
          userMessage = 'Você não tem permissão para esta ação.';
          break;
        default:
          if (error.message) {
            userMessage = error.message;
          }
      }
    } else if (error?.message) {
      // Handle other error types
      if (error.message.includes('network')) {
        userMessage = 'Erro de conexão. Verifique sua internet.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Operação demorou muito. Tente novamente.';
      } else {
        userMessage = error.message;
      }
    }

    toast.error(userMessage);
    
    return {
      code: error?.code,
      message: userMessage,
      originalError: error
    };
  }, []);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>, 
    context: string = 'Operação',
    successMessage?: string
  ) => {
    try {
      const result = await asyncFn();
      if (successMessage) {
        toast.success(successMessage);
      }
      return { success: true, data: result };
    } catch (error) {
      const errorDetails = handleError(error, context);
      return { success: false, error: errorDetails };
    }
  }, [handleError]);

  const validateRequired = useCallback((data: Record<string, any>, fields: string[]) => {
    const missing = fields.filter(field => !data[field] || data[field] === '');
    
    if (missing.length > 0) {
      const fieldNames = missing.join(', ');
      toast.error(`Campos obrigatórios: ${fieldNames}`);
      return false;
    }
    
    return true;
  }, []);

  return {
    handleError,
    handleAsyncError,
    validateRequired
  };
};