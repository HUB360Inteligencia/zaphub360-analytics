-- Fix search path for the functions created in the previous migration
ALTER FUNCTION public.update_contact_ultima_instancia() SET search_path = public;
ALTER FUNCTION public.trigger_update_ultima_instancia() SET search_path = public;  
ALTER FUNCTION public.sync_ultima_instancia_manual() SET search_path = public;