export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          id: string
          metrics: Json | null
          name: string
          organization_id: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          target_contacts: Json | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metrics?: Json | null
          name: string
          organization_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_contacts?: Json | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          organization_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_contacts?: Json | null
          template_id?: string | null
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
          message_image: string | null
          message_text: string
          name: string
          organization_id: string
          status: string
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
          message_image?: string | null
          message_text: string
          name: string
          organization_id: string
          status?: string
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
          message_image?: string | null
          message_text?: string
          name?: string
          organization_id?: string
          status?: string
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
          campanha: string | null
          contato: string | null
          content: string | null
          created_at: string
          evento: string | null
          id: number
          instancia: string | null
          nome: string | null
          status_mensagem: Database["public"]["Enums"]["status_message"] | null
        }
        Insert: {
          campanha?: string | null
          contato?: string | null
          content?: string | null
          created_at?: string
          evento?: string | null
          id?: number
          instancia?: string | null
          nome?: string | null
          status_mensagem?: Database["public"]["Enums"]["status_message"] | null
        }
        Update: {
          campanha?: string | null
          contato?: string | null
          content?: string | null
          created_at?: string
          evento?: string | null
          id?: number
          instancia?: string | null
          nome?: string | null
          status_mensagem?: Database["public"]["Enums"]["status_message"] | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          name: string
          organization_id: string
          time_delay: number | null
          updated_at: string
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          name: string
          organization_id: string
          time_delay?: number | null
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          time_delay?: number | null
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
      messages: {
        Row: {
          campaign_id: string | null
          contact_id: string | null
          content: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          evento_nome: string | null
          id: string
          instância: string | null
          organization_id: string
          read_at: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          template_id: string | null
          whatsapp: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          contact_id?: string | null
          content: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          evento_nome?: string | null
          id?: string
          instância?: string | null
          organization_id: string
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          whatsapp?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string | null
          content?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          evento_nome?: string | null
          id?: string
          instância?: string | null
          organization_id?: string
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          whatsapp?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
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
    }
    Enums: {
      status_message: "enviado" | "pendente" | "lido" | "inexistente"
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
      status_message: ["enviado", "pendente", "lido", "inexistente"],
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
