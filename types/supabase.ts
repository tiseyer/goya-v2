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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_secrets: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          encrypted_value: string
          id: string
          iv: string
          key_name: string
          model: string | null
          provider: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          encrypted_value: string
          id?: string
          iv: string
          key_name: string
          model?: string | null
          provider?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          encrypted_value?: string
          id?: string
          iv?: string
          key_name?: string
          model?: string | null
          provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_secrets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[]
          request_count: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[]
          request_count?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          request_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          severity: string
          target_id: string | null
          target_label: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          anonymous_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_escalated: boolean
          last_message_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_escalated?: boolean
          last_message_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_escalated?: boolean
          last_message_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_config: {
        Row: {
          avatar_url: string | null
          created_at: string
          guest_retention_days: number
          id: string
          is_active: boolean
          name: string
          selected_key_id: string | null
          system_prompt: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          guest_retention_days?: number
          id?: string
          is_active?: boolean
          name?: string
          selected_key_id?: string | null
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          guest_retention_days?: number
          id?: string
          is_active?: boolean
          name?: string
          selected_key_id?: string | null
          system_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_config_selected_key_id_fkey"
            columns: ["selected_key_id"]
            isOneToOne: false
            referencedRelation: "admin_secrets"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string | null
          id: string
          recipient_id: string
          requester_id: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consents: {
        Row: {
          consented_at: string
          id: string
          marketing: boolean
          preferences: boolean
          statistics: boolean
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          consented_at?: string
          id?: string
          marketing?: boolean
          preferences?: boolean
          statistics?: boolean
          updated_at?: string
          user_id: string
          version: string
        }
        Update: {
          consented_at?: string
          id?: string
          marketing?: boolean
          preferences?: boolean
          statistics?: boolean
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      course_audit_log: {
        Row: {
          action: string
          changes: Json | null
          course_id: string
          created_at: string
          id: string
          performed_by: string | null
          performed_by_role: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          course_id: string
          created_at?: string
          id?: string
          performed_by?: string | null
          performed_by_role?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          course_id?: string
          created_at?: string
          id?: string
          performed_by?: string | null
          performed_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_audit_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access: string | null
          category: string
          course_type: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration: string | null
          gradient_from: string | null
          gradient_to: string | null
          id: string
          instructor: string | null
          level: string | null
          rejection_reason: string | null
          short_description: string | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          vimeo_url: string | null
        }
        Insert: {
          access?: string | null
          category: string
          course_type?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          id?: string
          instructor?: string | null
          level?: string | null
          rejection_reason?: string | null
          short_description?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          vimeo_url?: string | null
        }
        Update: {
          access?: string | null
          category?: string
          course_type?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          id?: string
          instructor?: string | null
          level?: string | null
          rejection_reason?: string | null
          short_description?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          vimeo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_entries: {
        Row: {
          activity_date: string
          amount: number
          created_at: string | null
          credit_type: string
          description: string | null
          expires_at: string | null
          id: string
          rejection_reason: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_date: string
          amount: number
          created_at?: string | null
          credit_type: string
          description?: string | null
          expires_at?: string | null
          id?: string
          rejection_reason?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          amount?: number
          created_at?: string | null
          credit_type?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          rejection_reason?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_requirements: {
        Row: {
          credit_type: string
          id: string
          period_months: number
          required_amount: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          credit_type: string
          id?: string
          period_months?: number
          required_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          credit_type?: string
          id?: string
          period_months?: number
          required_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      email_log: {
        Row: {
          error_message: string | null
          id: string
          recipient: string
          sent_at: string
          status: string
          subject: string
          template_name: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          recipient: string
          sent_at?: string
          status?: string
          subject: string
          template_name: string
        }
        Update: {
          error_message?: string | null
          id?: string
          recipient?: string
          sent_at?: string
          status?: string
          subject?: string
          template_name?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          last_edited_by: string | null
          name: string
          subject: string
          template_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          last_edited_by?: string | null
          name: string
          subject: string
          template_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          last_edited_by?: string | null
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          event_id: string
          id: string
          performed_by: string | null
          performed_by_role: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          event_id: string
          id?: string
          performed_by?: string | null
          performed_by_role?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          event_id?: string
          id?: string
          performed_by?: string | null
          performed_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          registered_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          registered_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          registered_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          deleted_at: string | null
          description: string | null
          event_type: string
          featured_image_url: string | null
          format: string
          id: string
          instructor: string | null
          is_free: boolean | null
          location: string | null
          price: number | null
          rejection_reason: string | null
          spots_remaining: number | null
          spots_total: number | null
          status: string | null
          time_end: string
          time_start: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          event_type?: string
          featured_image_url?: string | null
          format: string
          id?: string
          instructor?: string | null
          is_free?: boolean | null
          location?: string | null
          price?: number | null
          rejection_reason?: string | null
          spots_remaining?: number | null
          spots_total?: number | null
          status?: string | null
          time_end: string
          time_start: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          event_type?: string
          featured_image_url?: string | null
          format?: string
          id?: string
          instructor?: string | null
          is_free?: boolean | null
          location?: string | null
          price?: number | null
          rejection_reason?: string | null
          spots_remaining?: number | null
          spots_total?: number | null
          status?: string | null
          time_end?: string
          time_start?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          question: string
          status: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          question: string
          status?: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          question?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_action_executions: {
        Row: {
          action_type: string
          executed_at: string
          flow_id: string
          id: string
          step_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          executed_at?: string
          flow_id: string
          id?: string
          step_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          executed_at?: string
          flow_id?: string
          id?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_action_executions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_action_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_analytics: {
        Row: {
          created_at: string
          event: string
          flow_id: string
          id: string
          step_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          flow_id: string
          id?: string
          step_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          flow_id?: string
          id?: string
          step_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_analytics_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_analytics_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_branches: {
        Row: {
          answer_value: string
          element_key: string
          id: string
          step_id: string
          target_step_id: string
        }
        Insert: {
          answer_value: string
          element_key: string
          id?: string
          step_id: string
          target_step_id: string
        }
        Update: {
          answer_value?: string
          element_key?: string
          id?: string
          step_id?: string
          target_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_branches_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_branches_target_step_id_fkey"
            columns: ["target_step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          flow_id: string
          id: string
          last_step_id: string | null
          responses: Json
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          flow_id: string
          id?: string
          last_step_id?: string | null
          responses?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          flow_id?: string
          id?: string
          last_step_id?: string | null
          responses?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_responses_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_responses_last_step_id_fkey"
            columns: ["last_step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_steps: {
        Row: {
          actions: Json
          created_at: string
          elements: Json
          flow_id: string
          id: string
          position: number
          schema_version: number
          title: string | null
        }
        Insert: {
          actions?: Json
          created_at?: string
          elements?: Json
          flow_id: string
          id?: string
          position?: number
          schema_version?: number
          title?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string
          elements?: Json
          flow_id?: string
          id?: string
          position?: number
          schema_version?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flows: {
        Row: {
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          display_type: string
          frequency: string
          id: string
          is_template: boolean
          modal_backdrop: string | null
          modal_dismissible: boolean
          name: string
          priority: number
          schema_version: number
          status: string
          template_name: string | null
          trigger_delay_seconds: number | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_type?: string
          frequency?: string
          id?: string
          is_template?: boolean
          modal_backdrop?: string | null
          modal_dismissible?: boolean
          name: string
          priority?: number
          schema_version?: number
          status?: string
          template_name?: string | null
          trigger_delay_seconds?: number | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_type?: string
          frequency?: string
          id?: string
          is_template?: boolean
          modal_backdrop?: string | null
          modal_dismissible?: boolean
          name?: string
          priority?: number
          schema_version?: number
          status?: string
          template_name?: string | null
          trigger_delay_seconds?: number | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      health_monitor_log: {
        Row: {
          alert_sent: boolean | null
          alert_type: string | null
          checked_at: string | null
          checks: Json
          id: string
          overall_status: string
        }
        Insert: {
          alert_sent?: boolean | null
          alert_type?: string | null
          checked_at?: string | null
          checks: Json
          id?: string
          overall_status: string
        }
        Update: {
          alert_sent?: boolean | null
          alert_type?: string | null
          checked_at?: string | null
          checks?: Json
          id?: string
          overall_status?: string
        }
        Relationships: []
      }
      impersonation_log: {
        Row: {
          actions_taken: Json | null
          admin_id: string
          ended_at: string | null
          id: string
          impersonated_user_id: string
          started_at: string | null
        }
        Insert: {
          actions_taken?: Json | null
          admin_id: string
          ended_at?: string | null
          id?: string
          impersonated_user_id: string
          started_at?: string | null
        }
        Update: {
          actions_taken?: Json | null
          admin_id?: string
          ended_at?: string | null
          id?: string
          impersonated_user_id?: string
          started_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          source: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          source?: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          source?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          answers: Json | null
          current_step_key: string | null
          id: string
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          current_step_key?: string | null
          id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          current_step_key?: string | null
          id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          option_text: string
          position: number
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text: string
          position?: number
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_text?: string
          position?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          gif_url: string | null
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          media_urls: string[] | null
          pinned_at: string | null
          pinned_by: string | null
          post_type: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gif_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          media_urls?: string[] | null
          pinned_at?: string | null
          pinned_by?: string | null
          post_type?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gif_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          media_urls?: string[] | null
          pinned_at?: string | null
          pinned_by?: string | null
          post_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          features: Json | null
          full_name: string
          has_variants: boolean | null
          hidden_if_has_any: string[] | null
          id: string
          image_path: string | null
          is_active: boolean | null
          name: string
          price_cents: number | null
          price_display: string
          priority: number | null
          requires_any_of: string[] | null
          slug: string
          stripe_product_id: string | null
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          full_name: string
          has_variants?: boolean | null
          hidden_if_has_any?: string[] | null
          id?: string
          image_path?: string | null
          is_active?: boolean | null
          name: string
          price_cents?: number | null
          price_display: string
          priority?: number | null
          requires_any_of?: string[] | null
          slug: string
          stripe_product_id?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          full_name?: string
          has_variants?: boolean | null
          hidden_if_has_any?: string[] | null
          id?: string
          image_path?: string | null
          is_active?: boolean | null
          name?: string
          price_cents?: number | null
          price_display?: string
          priority?: number | null
          requires_any_of?: string[] | null
          slug?: string
          stripe_product_id?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          certificate_is_official: boolean | null
          certificate_url: string | null
          city: string | null
          country: string | null
          created_at: string
          designations: string[] | null
          email: string | null
          facebook: string | null
          first_name: string | null
          full_name: string | null
          id: string
          influences_arr: string[] | null
          instagram: string | null
          is_verified: boolean
          languages: string[] | null
          last_name: string | null
          location: string | null
          member_type: string | null
          mrn: string | null
          onboarding_completed: boolean
          onboarding_step: number
          other_org_designations: string | null
          other_org_member: boolean | null
          other_org_name_other: string | null
          other_org_names: string[] | null
          other_org_registration: string | null
          phone: string | null
          practice_format: string | null
          requires_password_reset: boolean
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          subscription_status: string
          teacher_status: string | null
          teaching_focus_arr: string[] | null
          teaching_styles: string[] | null
          theme_preference: string
          tiktok: string | null
          updated_at: string | null
          username: string | null
          verification_status: string
          website: string | null
          wellness_designation_other: string | null
          wellness_designations: string[] | null
          wellness_focus: string[] | null
          wellness_org_name: string | null
          wellness_regulatory_body: boolean | null
          wellness_regulatory_designations: string | null
          wp_registered_at: string | null
          wp_roles: Json | null
          wp_user_id: number | null
          youtube: string | null
          youtube_intro_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          certificate_is_official?: boolean | null
          certificate_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          designations?: string[] | null
          email?: string | null
          facebook?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          influences_arr?: string[] | null
          instagram?: string | null
          is_verified?: boolean
          languages?: string[] | null
          last_name?: string | null
          location?: string | null
          member_type?: string | null
          mrn?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          other_org_designations?: string | null
          other_org_member?: boolean | null
          other_org_name_other?: string | null
          other_org_names?: string[] | null
          other_org_registration?: string | null
          phone?: string | null
          practice_format?: string | null
          requires_password_reset?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          subscription_status?: string
          teacher_status?: string | null
          teaching_focus_arr?: string[] | null
          teaching_styles?: string[] | null
          theme_preference?: string
          tiktok?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string
          website?: string | null
          wellness_designation_other?: string | null
          wellness_designations?: string[] | null
          wellness_focus?: string[] | null
          wellness_org_name?: string | null
          wellness_regulatory_body?: boolean | null
          wellness_regulatory_designations?: string | null
          wp_registered_at?: string | null
          wp_roles?: Json | null
          wp_user_id?: number | null
          youtube?: string | null
          youtube_intro_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          certificate_is_official?: boolean | null
          certificate_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          designations?: string[] | null
          email?: string | null
          facebook?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          influences_arr?: string[] | null
          instagram?: string | null
          is_verified?: boolean
          languages?: string[] | null
          last_name?: string | null
          location?: string | null
          member_type?: string | null
          mrn?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          other_org_designations?: string | null
          other_org_member?: boolean | null
          other_org_name_other?: string | null
          other_org_names?: string[] | null
          other_org_registration?: string | null
          phone?: string | null
          practice_format?: string | null
          requires_password_reset?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          subscription_status?: string
          teacher_status?: string | null
          teaching_focus_arr?: string[] | null
          teaching_styles?: string[] | null
          theme_preference?: string
          tiktok?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string
          website?: string | null
          wellness_designation_other?: string | null
          wellness_designations?: string[] | null
          wellness_focus?: string[] | null
          wellness_org_name?: string | null
          wellness_regulatory_body?: boolean | null
          wellness_regulatory_designations?: string | null
          wp_registered_at?: string | null
          wp_roles?: Json | null
          wp_user_id?: number | null
          youtube?: string | null
          youtube_intro_url?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          facebook: string | null
          id: string
          instagram: string | null
          is_featured: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          rejection_reason: string | null
          slug: string | null
          state: string | null
          status: string | null
          street_address: string | null
          tiktok: string | null
          updated_at: string | null
          website: string | null
          youtube: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          rejection_reason?: string | null
          slug?: string | null
          state?: string | null
          status?: string | null
          street_address?: string | null
          tiktok?: string | null
          updated_at?: string | null
          website?: string | null
          youtube?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          rejection_reason?: string | null
          slug?: string | null
          state?: string | null
          status?: string | null
          street_address?: string | null
          tiktok?: string | null
          updated_at?: string | null
          website?: string | null
          youtube?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      stripe_coupon_redemptions: {
        Row: {
          id: string
          redeemed_at: string | null
          stripe_coupon_id: string
          stripe_order_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          redeemed_at?: string | null
          stripe_coupon_id: string
          stripe_order_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          redeemed_at?: string | null
          stripe_coupon_id?: string
          stripe_order_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_coupons: {
        Row: {
          amount_off: number | null
          code: string | null
          created_at: string | null
          currency: string | null
          discount_type: string
          duration: string | null
          duration_in_months: number | null
          id: string
          max_redemptions: number | null
          metadata: Json | null
          name: string
          percent_off: number | null
          redeem_by: string | null
          stripe_coupon_id: string
          stripe_promotion_code_id: string | null
          times_redeemed: number | null
          updated_at: string | null
          valid: boolean | null
        }
        Insert: {
          amount_off?: number | null
          code?: string | null
          created_at?: string | null
          currency?: string | null
          discount_type: string
          duration?: string | null
          duration_in_months?: number | null
          id?: string
          max_redemptions?: number | null
          metadata?: Json | null
          name: string
          percent_off?: number | null
          redeem_by?: string | null
          stripe_coupon_id: string
          stripe_promotion_code_id?: string | null
          times_redeemed?: number | null
          updated_at?: string | null
          valid?: boolean | null
        }
        Update: {
          amount_off?: number | null
          code?: string | null
          created_at?: string | null
          currency?: string | null
          discount_type?: string
          duration?: string | null
          duration_in_months?: number | null
          id?: string
          max_redemptions?: number | null
          metadata?: Json | null
          name?: string
          percent_off?: number | null
          redeem_by?: string | null
          stripe_coupon_id?: string
          stripe_promotion_code_id?: string | null
          times_redeemed?: number | null
          updated_at?: string | null
          valid?: boolean | null
        }
        Relationships: []
      }
      stripe_orders: {
        Row: {
          amount_total: number | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_customer_id: string | null
          stripe_event_id: string | null
          stripe_id: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          subscription_status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          status: string
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_id: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscription_status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_id?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscription_status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          stripe_id: string
          stripe_product_id: string
          type: string
          unit_amount: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency?: string
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          stripe_id: string
          stripe_product_id: string
          type?: string
          unit_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          stripe_id?: string
          stripe_product_id?: string
          type?: string
          unit_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          metadata: Json | null
          name: string
          stripe_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          name: string
          stripe_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          name?: string
          stripe_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          anonymous_id: string | null
          created_at: string
          id: string
          question_summary: string
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          question_summary: string
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          question_summary?: string
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_requests: {
        Row: {
          certificate_urls: string[]
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_urls?: string[]
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_urls?: string[]
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      used_mrns: {
        Row: {
          created_at: string
          mrn: string
          status: string
        }
        Insert: {
          created_at?: string
          mrn: string
          status?: string
        }
        Update: {
          created_at?: string
          mrn?: string
          status?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_designations: {
        Row: {
          deleted_at: string | null
          deleted_by: string | null
          id: string
          purchase_date: string
          stripe_price_id: string
          stripe_product_id: string
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          purchase_date?: string
          stripe_price_id: string
          stripe_product_id: string
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          purchase_date?: string
          stripe_price_id?: string
          stripe_product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          status: string
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_distinct_countries: { Args: never; Returns: number }
      generate_mrn: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_event_submitter: { Args: never; Returns: boolean }
      sum_approved_hours: { Args: never; Returns: number }
    }
    Enums: {
      user_role:
        | "student"
        | "teacher"
        | "wellness_practitioner"
        | "moderator"
        | "admin"
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
      user_role: [
        "student",
        "teacher",
        "wellness_practitioner",
        "moderator",
        "admin",
      ],
    },
  },
} as const
