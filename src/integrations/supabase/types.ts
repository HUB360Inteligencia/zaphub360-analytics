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
      campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          horario_disparo_fim: string | null
          horario_disparo_inicio: string | null
          id: string
          intervalo_maximo: number | null
          intervalo_minimo: number | null
          mensagens_enviadas: number | null
          mensagens_lidas: number | null
          mensagens_respondidas: number | null
          metrics: Json | null
          name: string
          organization_id: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          target_contacts: Json | null
          template_id: string | null
          tipo_conteudo: string[] | null
          total_mensagens: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          horario_disparo_fim?: string | null
          horario_disparo_inicio?: string | null
          id?: string
          intervalo_maximo?: number | null
          intervalo_minimo?: number | null
          mensagens_enviadas?: number | null
          mensagens_lidas?: number | null
          mensagens_respondidas?: number | null
          metrics?: Json | null
          name: string
          organization_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_contacts?: Json | null
          template_id?: string | null
          tipo_conteudo?: string[] | null
          total_mensagens?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          horario_disparo_fim?: string | null
          horario_disparo_inicio?: string | null
          id?: string
          intervalo_maximo?: number | null
          intervalo_minimo?: number | null
          mensagens_enviadas?: number | null
          mensagens_lidas?: number | null
          mensagens_respondidas?: number | null
          metrics?: Json | null
          name?: string
          organization_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_contacts?: Json | null
          template_id?: string | null
          tipo_conteudo?: string[] | null
          total_mensagens?: number | null
          updated_at?: string
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
      contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          origin: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          origin?: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          origin?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
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
          image_filename: string | null
          instance_id: string | null
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
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_id: string
          id?: string
          image_filename?: string | null
          instance_id?: string | null
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
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_id?: string
          id?: string
          image_filename?: string | null
          instance_id?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "events_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances_safe"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
          "tempo delay": number | null
          tipo_fluxo: string
          tipo_mensagem: number | null
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
          status: string
          "tempo delay"?: number | null
          tipo_fluxo: string
          tipo_mensagem?: number | null
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
          status?: string
          "tempo delay"?: number | null
          tipo_fluxo?: string
          tipo_mensagem?: number | null
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
          celular: string | null
          created_at: string
          event_id: number | null
          evento: string | null
          id_contact_event: number
          name: string | null
          organization_id: string | null
          responsavel_cadastro: string | null
          sentimento: string | null
          status_envio: string | null
          updated_at: string | null
        }
        Insert: {
          celular?: string | null
          created_at?: string
          event_id?: number | null
          evento?: string | null
          id_contact_event?: number
          name?: string | null
          organization_id?: string | null
          responsavel_cadastro?: string | null
          sentimento?: string | null
          status_envio?: string | null
          updated_at?: string | null
        }
        Update: {
          celular?: string | null
          created_at?: string
          event_id?: number | null
          evento?: string | null
          id_contact_event?: number
          name?: string | null
          organization_id?: string | null
          responsavel_cadastro?: string | null
          sentimento?: string | null
          status_envio?: string | null
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
      expire_old_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invite_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_instance_api_key: {
        Args: { instance_id: string }
        Returns: string
      }
      get_user_organization_id: {
        Args: { user_id?: string }
        Returns: string
      }
      is_saas_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      map_existing_sentiments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_event_contacts_to_main: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
