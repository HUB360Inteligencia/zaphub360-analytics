export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      _csv_upload: {
        Row: {
          celular: string | null
          cidade: string | null
          name: string | null
          organization_id: string | null
          perfil_contato: string | null
          sobrenome: string | null
        }
        Insert: {
          celular?: string | null
          cidade?: string | null
          name?: string | null
          organization_id?: string | null
          perfil_contato?: string | null
          sobrenome?: string | null
        }
        Update: {
          celular?: string | null
          cidade?: string | null
          name?: string | null
          organization_id?: string | null
          perfil_contato?: string | null
          sobrenome?: string | null
        }
        Relationships: []
      }
      campaign_message_audits: {
        Row: {
          batch_id: string
          campaign_id: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          new_status: string | null
          operation: string
          organization_id: string
          performed_at: string
          performed_by: string | null
          previous_status: string | null
        }
        Insert: {
          batch_id: string
          campaign_id?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          new_status?: string | null
          operation: string
          organization_id: string
          performed_at?: string
          performed_by?: string | null
          previous_status?: string | null
        }
        Update: {
          batch_id?: string
          campaign_id?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          new_status?: string | null
          operation?: string
          organization_id?: string
          performed_at?: string
          performed_by?: string | null
          previous_status?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          horario_disparo_fim: string | null
          horario_disparo_inicio: string | null
          id: string
          id_tipo_mensagem: number | null
          intervalo_maximo: number | null
          intervalo_minimo: number | null
          media_type: string | null
          mensagens_enviadas: number | null
          mensagens_lidas: number | null
          mensagens_respondidas: number | null
          message_text: string | null
          metrics: Json | null
          mime_type: string | null
          name: string
          name_media: string | null
          organization_id: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          target_contacts: Json | null
          template_id: string | null
          tipo_conteudo: string[] | null
          total_mensagens: number | null
          updated_at: string
          url_media: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          horario_disparo_fim?: string | null
          horario_disparo_inicio?: string | null
          id?: string
          id_tipo_mensagem?: number | null
          intervalo_maximo?: number | null
          intervalo_minimo?: number | null
          media_type?: string | null
          mensagens_enviadas?: number | null
          mensagens_lidas?: number | null
          mensagens_respondidas?: number | null
          message_text?: string | null
          metrics?: Json | null
          mime_type?: string | null
          name: string
          name_media?: string | null
          organization_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_contacts?: Json | null
          template_id?: string | null
          tipo_conteudo?: string[] | null
          total_mensagens?: number | null
          updated_at?: string
          url_media?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          horario_disparo_fim?: string | null
          horario_disparo_inicio?: string | null
          id?: string
          id_tipo_mensagem?: number | null
          intervalo_maximo?: number | null
          intervalo_minimo?: number | null
          media_type?: string | null
          mensagens_enviadas?: number | null
          mensagens_lidas?: number | null
          mensagens_respondidas?: number | null
          message_text?: string | null
          metrics?: Json | null
          mime_type?: string | null
          name?: string
          name_media?: string | null
          organization_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_contacts?: Json | null
          template_id?: string | null
          tipo_conteudo?: string[] | null
          total_mensagens?: number | null
          updated_at?: string
          url_media?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_instancia: {
        Row: {
          created_at: string | null
          id: string
          id_campanha: string | null
          id_evento: string | null
          id_instancia: string
          prioridade: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_campanha?: string | null
          id_evento?: string | null
          id_instancia: string
          prioridade?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_campanha?: string | null
          id_evento?: string | null
          id_instancia?: string
          prioridade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campanha_instancia_id_evento_fkey"
            columns: ["id_evento"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins_evento: {
        Row: {
          bairro: string | null
          cargo: string | null
          celular: string
          checked_in_by: string | null
          cidade: string | null
          contact_id: string
          created_at: string
          data_aniversario_text: string | null
          event_id: string
          id: string
          nome: string
          organization_id: string
        }
        Insert: {
          bairro?: string | null
          cargo?: string | null
          celular: string
          checked_in_by?: string | null
          cidade?: string | null
          contact_id: string
          created_at?: string
          data_aniversario_text?: string | null
          event_id: string
          id?: string
          nome: string
          organization_id: string
        }
        Update: {
          bairro?: string | null
          cargo?: string | null
          celular?: string
          checked_in_by?: string | null
          cidade?: string | null
          contact_id?: string
          created_at?: string
          data_aniversario_text?: string | null
          event_id?: string
          id?: string
          nome?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_evento_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_evento_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_evento_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_import_audits: {
        Row: {
          created_at: string
          filename: string
          id: number
          ignored_rows: number
          inserted_rows: number
          organization_id: string
          total_rows: number
          valid_rows: number
        }
        Insert: {
          created_at?: string
          filename: string
          id?: number
          ignored_rows?: number
          inserted_rows?: number
          organization_id: string
          total_rows?: number
          valid_rows?: number
        }
        Update: {
          created_at?: string
          filename?: string
          id?: number
          ignored_rows?: number
          inserted_rows?: number
          organization_id?: string
          total_rows?: number
          valid_rows?: number
        }
        Relationships: []
      }
      contact_import_ignored: {
        Row: {
          audit_id: number
          celular: string
          created_at: string
          id: number
          original_row: Json | null
          reason: string
        }
        Insert: {
          audit_id: number
          celular: string
          created_at?: string
          id?: number
          original_row?: Json | null
          reason: string
        }
        Update: {
          audit_id?: number
          celular?: string
          created_at?: string
          id?: number
          original_row?: Json | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_import_ignored_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "contact_import_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          caption_media: string | null
          celular: string
          created_at: string
          data_mensagem: string
          data_mensagem_brt: string | null
          direction: string
          id: string
          instancia_id: string
          intent: string | null
          media_type: string | null
          mensagem: string | null
          name_media: string | null
          organization_id: string
          sentiment: string | null
          url_media: string | null
        }
        Insert: {
          caption_media?: string | null
          celular: string
          created_at?: string
          data_mensagem: string
          data_mensagem_brt?: string | null
          direction: string
          id?: string
          instancia_id: string
          intent?: string | null
          media_type?: string | null
          mensagem?: string | null
          name_media?: string | null
          organization_id: string
          sentiment?: string | null
          url_media?: string | null
        }
        Update: {
          caption_media?: string | null
          celular?: string
          created_at?: string
          data_mensagem?: string
          data_mensagem_brt?: string | null
          direction?: string
          id?: string
          instancia_id?: string
          intent?: string | null
          media_type?: string | null
          mensagem?: string | null
          name_media?: string | null
          organization_id?: string
          sentiment?: string | null
          url_media?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_inst_fk"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_inst_fk"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "instances_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          notes: string | null
          organization_id: string | null
          origin: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          origin?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          origin?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_checkin_permissions: {
        Row: {
          created_at: string
          event_id: string
          granted_by: string | null
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          granted_by?: string | null
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checkin_permissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checkin_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          contact_name: string | null
          contact_phone: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          event_id: string
          id: string
          id_wpp_msg: string | null
          message_content: string
          organization_id: string
          read_at: string | null
          responded_at: string | null
          retry_count: number | null
          sent_at: string | null
          sentiment: string | null
          status: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_id: string
          id?: string
          id_wpp_msg?: string | null
          message_content: string
          organization_id: string
          read_at?: string | null
          responded_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          sentiment?: string | null
          status?: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_id?: string
          id?: string
          id_wpp_msg?: string | null
          message_content?: string
          organization_id?: string
          read_at?: string | null
          responded_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          sentiment?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string | null
          event_id: string
          id: string
          id_tipo_mensagem: number | null
          image_filename: string | null
          instance_ids: string[]
          location: string | null
          media_type: string | null
          message_image: string | null
          message_text: string
          mime_type: string | null
          name: string
          organization_id: string
          status: string
          tempo_max: number | null
          tempo_min: number | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_id: string
          id?: string
          id_tipo_mensagem?: number | null
          image_filename?: string | null
          instance_ids?: string[]
          location?: string | null
          media_type?: string | null
          message_image?: string | null
          message_text: string
          mime_type?: string | null
          name: string
          organization_id: string
          status?: string
          tempo_max?: number | null
          tempo_min?: number | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_id?: string
          id?: string
          id_tipo_mensagem?: number | null
          image_filename?: string | null
          instance_ids?: string[]
          location?: string | null
          media_type?: string | null
          message_image?: string | null
          message_text?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          status?: string
          tempo_max?: number | null
          tempo_min?: number | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      instances: {
        Row: {
          api_key: string | null
          api_url: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          phone_number: string
          status: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          phone_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          phone_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_checkin_eventos: {
        Row: {
          caption: string | null
          celular: string
          checkin_id: string
          contact_id: string
          created_at: string
          data_envio: string | null
          delay_mensagem: number | null
          error_message: string | null
          event_id: string
          id: string
          instancia_id: string | null
          mensagem: string | null
          nome_midia: string | null
          organization_id: string
          status: string
          template_id: string | null
          tipo_fluxo: string
          tipo_midia: string | null
          updated_at: string
          url_midia: string | null
        }
        Insert: {
          caption?: string | null
          celular: string
          checkin_id: string
          contact_id: string
          created_at?: string
          data_envio?: string | null
          delay_mensagem?: number | null
          error_message?: string | null
          event_id: string
          id?: string
          instancia_id?: string | null
          mensagem?: string | null
          nome_midia?: string | null
          organization_id: string
          status?: string
          template_id?: string | null
          tipo_fluxo?: string
          tipo_midia?: string | null
          updated_at?: string
          url_midia?: string | null
        }
        Update: {
          caption?: string | null
          celular?: string
          checkin_id?: string
          contact_id?: string
          created_at?: string
          data_envio?: string | null
          delay_mensagem?: number | null
          error_message?: string | null
          event_id?: string
          id?: string
          instancia_id?: string | null
          mensagem?: string | null
          nome_midia?: string | null
          organization_id?: string
          status?: string
          template_id?: string | null
          tipo_fluxo?: string
          tipo_midia?: string | null
          updated_at?: string
          url_midia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_checkin_eventos_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins_evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_checkin_eventos_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_checkin_eventos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_checkin_eventos_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_checkin_eventos_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "instances_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_checkin_eventos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_checkin_eventos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_enviadas: {
        Row: {
          caption_media: string | null
          celular: string
          data_envio: string | null
          data_leitura: string | null
          data_resposta: string | null
          id: string
          id_campanha: string | null
          id_mensagem_wpp: string | null
          id_tipo_mensagem: number | null
          instancia_id: string | null
          limite_inicio: string | null
          limite_termino: string | null
          media_type: string | null
          mensagem: string | null
          mime_type: string | null
          name_media: string | null
          nome_contato: string | null
          organization_id: string | null
          perfil_contato: string | null
          resposta_usuario: string | null
          sentimento: string | null
          sobrenome_contato: string | null
          status: string
          "tempo delay": number | null
          tipo_fluxo: string
          url_media: string | null
        }
        Insert: {
          caption_media?: string | null
          celular: string
          data_envio?: string | null
          data_leitura?: string | null
          data_resposta?: string | null
          id?: string
          id_campanha?: string | null
          id_mensagem_wpp?: string | null
          id_tipo_mensagem?: number | null
          instancia_id?: string | null
          limite_inicio?: string | null
          limite_termino?: string | null
          media_type?: string | null
          mensagem?: string | null
          mime_type?: string | null
          name_media?: string | null
          nome_contato?: string | null
          organization_id?: string | null
          perfil_contato?: string | null
          resposta_usuario?: string | null
          sentimento?: string | null
          sobrenome_contato?: string | null
          status: string
          "tempo delay"?: number | null
          tipo_fluxo: string
          url_media?: string | null
        }
        Update: {
          caption_media?: string | null
          celular?: string
          data_envio?: string | null
          data_leitura?: string | null
          data_resposta?: string | null
          id?: string
          id_campanha?: string | null
          id_mensagem_wpp?: string | null
          id_tipo_mensagem?: number | null
          instancia_id?: string | null
          limite_inicio?: string | null
          limite_termino?: string | null
          media_type?: string | null
          mensagem?: string | null
          mime_type?: string | null
          name_media?: string | null
          nome_contato?: string | null
          organization_id?: string | null
          perfil_contato?: string | null
          resposta_usuario?: string | null
          sentimento?: string | null
          sobrenome_contato?: string | null
          status?: string
          "tempo delay"?: number | null
          tipo_fluxo?: string
          url_media?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          botoes: Json | null
          caption: string | null
          category: string | null
          contato_nome: string | null
          contato_numero: string | null
          content: string
          created_at: string
          created_by: string | null
          event_id: string | null
          formato_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          media_name: string | null
          media_type: string | null
          media_url: string | null
          mensagem_extra: string | null
          name: string
          organization_id: string
          time_delay: number | null
          tipo_conteudo: string[] | null
          updated_at: string
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          botoes?: Json | null
          caption?: string | null
          category?: string | null
          contato_nome?: string | null
          contato_numero?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          formato_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          media_name?: string | null
          media_type?: string | null
          media_url?: string | null
          mensagem_extra?: string | null
          name: string
          organization_id: string
          time_delay?: number | null
          tipo_conteudo?: string[] | null
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          botoes?: Json | null
          caption?: string | null
          category?: string | null
          contato_nome?: string | null
          contato_numero?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          formato_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          media_name?: string | null
          media_type?: string | null
          media_url?: string | null
          mensagem_extra?: string | null
          name?: string
          organization_id?: string
          time_delay?: number | null
          tipo_conteudo?: string[] | null
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      new_contact_event: {
        Row: {
          bairro: string | null
          celular: string | null
          cidade: string | null
          created_at: string
          event_id: number | null
          evento: string | null
          id_contact_event: number
          id_tipo_mensagem: number | null
          media_name: string | null
          media_type: string | null
          media_url: string | null
          mime_type: string | null
          name: string | null
          organization_id: string | null
          perfil: string | null
          perfil_contato: string | null
          responsavel_cadastro: string | null
          sentimento: string | null
          sentimento_rp: string | null
          sobrenome: string | null
          status_envio: string | null
          tag: string | null
          ultima_instancia: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          cidade?: string | null
          created_at?: string
          event_id?: number | null
          evento?: string | null
          id_contact_event?: number
          id_tipo_mensagem?: number | null
          media_name?: string | null
          media_type?: string | null
          media_url?: string | null
          mime_type?: string | null
          name?: string | null
          organization_id?: string | null
          perfil?: string | null
          perfil_contato?: string | null
          responsavel_cadastro?: string | null
          sentimento?: string | null
          sentimento_rp?: string | null
          sobrenome?: string | null
          status_envio?: string | null
          tag?: string | null
          ultima_instancia?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          cidade?: string | null
          created_at?: string
          event_id?: number | null
          evento?: string | null
          id_contact_event?: number
          id_tipo_mensagem?: number | null
          media_name?: string | null
          media_type?: string | null
          media_url?: string | null
          mime_type?: string | null
          name?: string | null
          organization_id?: string | null
          perfil?: string | null
          perfil_contato?: string | null
          responsavel_cadastro?: string | null
          sentimento?: string | null
          sentimento_rp?: string | null
          sobrenome?: string | null
          status_envio?: string | null
          tag?: string | null
          ultima_instancia?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      private_settings: {
        Row: {
          inserted_at: string | null
          key: string
          value: string
        }
        Insert: {
          inserted_at?: string | null
          key: string
          value: string
        }
        Update: {
          inserted_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      template_tags: {
        Row: {
          created_at: string
          id: string
          tag: string
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_tags_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      instances_safe: {
        Row: {
          api_key_status: string | null
          api_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
          organization_id: string | null
          phone_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_status?: never
          api_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_status?: never
          api_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      new_contact_event_logs: {
        Row: {
          bairro: string | null
          celular: string | null
          cidade: string | null
          created_at: string | null
          event_id: number | null
          evento: string | null
          id_contact_event: number | null
          id_tipo_mensagem: number | null
          media_name: string | null
          media_type: string | null
          media_url: string | null
          mensagem_enviada: string | null
          mensagem_recebida: string | null
          mime_type: string | null
          name: string | null
          organization_id: string | null
          perfil: string | null
          perfil_contato: string | null
          responsavel_cadastro: string | null
          sentimento: string | null
          sentimento_rp: string | null
          sobrenome: string | null
          status_envio: string | null
          tag: string | null
          ultima_instancia: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      public_event_analytics: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          event_id: string | null
          read_at: string | null
          responded_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          event_id?: string | null
          read_at?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          event_id?: string | null
          read_at?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      choose_best_value: {
        Args: { val1: string; val2: string }
        Returns: string
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      generate_invite_token: { Args: never; Returns: string }
      get_campaign_contacts_ordered: {
        Args: {
          p_campaign_id: string
          p_offset?: number
          p_organization_id: string
          p_page_size?: number
          p_search?: string
          p_sort_by?: string
          p_sort_direction?: string
          p_statuses?: string[]
        }
        Returns: {
          celular: string
          id: string
          nome_contato: string
          perfil_contato: string
          sentimento: string
          status: string
          total_count: number
        }[]
      }
      get_grouped_events: {
        Args: { contact_phone: string; org_id: string }
        Returns: string
      }
      get_grouped_tags: {
        Args: { contact_phone: string; org_id: string }
        Returns: string
      }
      get_hourly_activity: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          hour: number
          messages: number
          responses: number
        }[]
      }
      get_instance_api_key: { Args: { instance_id: string }; Returns: string }
      get_secret: { Args: { secret_name: string }; Returns: string }
      get_user_organization_id: { Args: { user_id?: string }; Returns: string }
      is_saas_admin: { Args: { user_id?: string }; Returns: boolean }
      map_existing_sentiments: { Args: never; Returns: undefined }
      refresh_event_instance_ids: {
        Args: { target_event_id: string }
        Returns: undefined
      }
      rpc_pause_campaign_messages: {
        Args: { campaign_id: string; org_id: string; performed_by?: string }
        Returns: {
          batch_id: string
          message_id: string
        }[]
      }
      rpc_resume_campaign_messages: {
        Args: {
          campaign_id: string
          org_id: string
          performed_by?: string
          target_batch_id: string
        }
        Returns: {
          message_id: string
        }[]
      }
      sync_event_contacts_to_main: { Args: never; Returns: undefined }
      sync_ultima_instancia_manual: {
        Args: never
        Returns: {
          updated_contacts: number
        }[]
      }
      update_contact_ultima_instancia: { Args: never; Returns: undefined }
      update_new_contact_event_if_empty_batch: {
        Args: { p_org_id: string; records: Json }
        Returns: number
      }
      upsert_new_contact_event_min: {
        Args: {
          _celular: string
          _evento: string
          _name: string
          _organization_id: string
          _perfil_contato: string
          _sobrenome: string
        }
        Returns: number
      }
    }
    Enums: {
      status_message: "enviado" | "pendente" | "lido" | "inexistente" | "fila"
      user_role:
        | "saas_admin"
        | "client"
        | "viewer"
        | "guest"
        | "manager"
        | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      status_message: ["enviado", "pendente", "lido", "inexistente", "fila"],
      user_role: [
        "saas_admin",
        "client",
        "viewer",
        "guest",
        "manager",
        "agent",
      ],
    },
  },
} as const
