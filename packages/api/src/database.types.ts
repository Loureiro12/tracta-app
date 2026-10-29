export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          avg_heart_rate: number | null;
          created_at: string;
          distance_m: number | null;
          duration_seconds: number;
          gps: boolean;
          id: string;
          intervals: Json | null;
          kind: Database['public']['Enums']['activity_kind'];
          notes: string;
          owner_id: string;
          splits: NonNullable<Json>;
          started_at: string;
        };
        ComputedFields: never;
        Insert: {
          avg_heart_rate?: number | null;
          created_at?: string;
          distance_m?: number | null;
          duration_seconds: number;
          gps?: boolean;
          id?: string;
          intervals?: Json | null;
          kind: Database['public']['Enums']['activity_kind'];
          notes?: string;
          owner_id?: string;
          splits?: NonNullable<Json>;
          started_at: string;
        };
        Update: {
          avg_heart_rate?: number | null;
          created_at?: string;
          distance_m?: number | null;
          duration_seconds?: number;
          gps?: boolean;
          id?: string;
          intervals?: Json | null;
          kind?: Database['public']['Enums']['activity_kind'];
          notes?: string;
          owner_id?: string;
          splits?: NonNullable<Json>;
          started_at?: string;
        };
        Relationships: [];
      };
      body_measurements: {
        Row: {
          arm_cm: number | null;
          created_at: string;
          hip_cm: number | null;
          id: string;
          measured_on: string;
          owner_id: string;
          source: Database['public']['Enums']['data_source'];
          waist_cm: number | null;
          weight_kg: number | null;
        };
        ComputedFields: never;
        Insert: {
          arm_cm?: number | null;
          created_at?: string;
          hip_cm?: number | null;
          id?: string;
          measured_on?: string;
          owner_id?: string;
          source?: Database['public']['Enums']['data_source'];
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          arm_cm?: number | null;
          created_at?: string;
          hip_cm?: number | null;
          id?: string;
          measured_on?: string;
          owner_id?: string;
          source?: Database['public']['Enums']['data_source'];
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      challenge_members: {
        Row: {
          challenge_id: string;
          joined_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          challenge_id: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'challenge_members_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          },
        ];
      };
      challenges: {
        Row: {
          created_at: string;
          days: number;
          id: string;
          kind: Database['public']['Enums']['challenge_kind'];
          min_value: number;
          name: string;
          owner_id: string;
          starts_on: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          days: number;
          id?: string;
          kind: Database['public']['Enums']['challenge_kind'];
          min_value?: number;
          name: string;
          owner_id?: string;
          starts_on?: string;
        };
        Update: {
          created_at?: string;
          days?: number;
          id?: string;
          kind?: Database['public']['Enums']['challenge_kind'];
          min_value?: number;
          name?: string;
          owner_id?: string;
          starts_on?: string;
        };
        Relationships: [];
      };
      cheers: {
        Row: {
          created_at: string;
          day: string;
          from_id: string;
          to_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          day?: string;
          from_id?: string;
          to_id: string;
        };
        Update: {
          created_at?: string;
          day?: string;
          from_id?: string;
          to_id?: string;
        };
        Relationships: [];
      };
      daily_summaries: {
        Row: {
          active_minutes: number;
          day: string;
          steps: number;
          updated_at: string;
          user_id: string;
          what: string | null;
          workouts: number;
        };
        ComputedFields: never;
        Insert: {
          active_minutes?: number;
          day: string;
          steps?: number;
          updated_at?: string;
          user_id?: string;
          what?: string | null;
          workouts?: number;
        };
        Update: {
          active_minutes?: number;
          day?: string;
          steps?: number;
          updated_at?: string;
          user_id?: string;
          what?: string | null;
          workouts?: number;
        };
        Relationships: [];
      };
      exercise_prefs: {
        Row: {
          exercise_id: string;
          favorite: boolean;
          notes: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          exercise_id: string;
          favorite?: boolean;
          notes?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          exercise_id?: string;
          favorite?: boolean;
          notes?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_prefs_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      exercises: {
        Row: {
          created_at: string;
          default_kg: number | null;
          default_reps: number;
          default_rest_seconds: number;
          equipment: string;
          id: string;
          instructions: string;
          kind: Database['public']['Enums']['exercise_kind'];
          muscle_group: string;
          name: string;
          owner_id: string | null;
          position: number;
          secondary_groups: string[];
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          default_kg?: number | null;
          default_reps?: number;
          default_rest_seconds?: number;
          equipment: string;
          id?: string;
          instructions?: string;
          kind?: Database['public']['Enums']['exercise_kind'];
          muscle_group: string;
          name: string;
          owner_id?: string | null;
          position?: number;
          secondary_groups?: string[];
          slug: string;
        };
        Update: {
          created_at?: string;
          default_kg?: number | null;
          default_reps?: number;
          default_rest_seconds?: number;
          equipment?: string;
          id?: string;
          instructions?: string;
          kind?: Database['public']['Enums']['exercise_kind'];
          muscle_group?: string;
          name?: string;
          owner_id?: string | null;
          position?: number;
          secondary_groups?: string[];
          slug?: string;
        };
        Relationships: [];
      };
      friend_requests: {
        Row: {
          created_at: string;
          from_id: string;
          id: string;
          responded_at: string | null;
          status: Database['public']['Enums']['friend_status'];
          to_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_id?: string;
          id?: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friend_status'];
          to_id: string;
        };
        Update: {
          created_at?: string;
          from_id?: string;
          id?: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friend_status'];
          to_id?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          run_km: number;
          sleep_minutes: number;
          steps: number;
          updated_at: string;
          user_id: string;
          workouts_per_week: number;
        };
        ComputedFields: never;
        Insert: {
          run_km?: number;
          sleep_minutes?: number;
          steps?: number;
          updated_at?: string;
          user_id: string;
          workouts_per_week?: number;
        };
        Update: {
          run_km?: number;
          sleep_minutes?: number;
          steps?: number;
          updated_at?: string;
          user_id?: string;
          workouts_per_week?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          href: string | null;
          id: string;
          kind: Database['public']['Enums']['notification_kind'];
          owner_id: string;
          read_at: string | null;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string;
          created_at?: string;
          href?: string | null;
          id?: string;
          kind: Database['public']['Enums']['notification_kind'];
          owner_id: string;
          read_at?: string | null;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          href?: string | null;
          id?: string;
          kind?: Database['public']['Enums']['notification_kind'];
          owner_id?: string;
          read_at?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          handle: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          handle?: string | null;
          id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          handle?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_enrollments: {
        Row: {
          created_at: string;
          program_id: string;
          started_on: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          program_id: string;
          started_on?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          program_id?: string;
          started_on?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_enrollments_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['id'];
          },
        ];
      };
      programs: {
        Row: {
          description: string;
          frequency: string;
          id: string;
          legend: string;
          light_weeks: number[];
          name: string;
          pattern: string[];
          position: number;
          tag: string;
          week_titles: string[];
          weeks: number;
        };
        ComputedFields: never;
        Insert: {
          description: string;
          frequency: string;
          id: string;
          legend: string;
          light_weeks?: number[];
          name: string;
          pattern: string[];
          position?: number;
          tag: string;
          week_titles: string[];
          weeks: number;
        };
        Update: {
          description?: string;
          frequency?: string;
          id?: string;
          legend?: string;
          light_weeks?: number[];
          name?: string;
          pattern?: string[];
          position?: number;
          tag?: string;
          week_titles?: string[];
          weeks?: number;
        };
        Relationships: [];
      };
      races: {
        Row: {
          distance_m: number;
          race_date: string;
          target_seconds: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          distance_m: number;
          race_date: string;
          target_seconds: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          distance_m?: number;
          race_date?: string;
          target_seconds?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      routine_exercises: {
        Row: {
          exercise_id: string;
          id: string;
          kg: number | null;
          position: number;
          reps: number;
          rest_seconds: number;
          routine_id: string;
          sets: number;
          superset: string | null;
        };
        ComputedFields: never;
        Insert: {
          exercise_id: string;
          id?: string;
          kg?: number | null;
          position: number;
          reps: number;
          rest_seconds?: number;
          routine_id: string;
          sets: number;
          superset?: string | null;
        };
        Update: {
          exercise_id?: string;
          id?: string;
          kg?: number | null;
          position?: number;
          reps?: number;
          rest_seconds?: number;
          routine_id?: string;
          sets?: number;
          superset?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'routine_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'routine_exercises_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
        ];
      };
      routines: {
        Row: {
          created_at: string;
          focus: string;
          id: string;
          label: string;
          name: string;
          owner_id: string;
          position: number;
          updated_at: string;
          weekday: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          focus?: string;
          id?: string;
          label: string;
          name: string;
          owner_id?: string;
          position?: number;
          updated_at?: string;
          weekday?: number | null;
        };
        Update: {
          created_at?: string;
          focus?: string;
          id?: string;
          label?: string;
          name?: string;
          owner_id?: string;
          position?: number;
          updated_at?: string;
          weekday?: number | null;
        };
        Relationships: [];
      };
      session_sets: {
        Row: {
          exercise_id: string;
          exercise_position: number;
          id: string;
          is_warmup: boolean;
          kg: number | null;
          reps: number;
          session_id: string;
          set_index: number;
          superset: string | null;
        };
        ComputedFields: never;
        Insert: {
          exercise_id: string;
          exercise_position: number;
          id?: string;
          is_warmup?: boolean;
          kg?: number | null;
          reps: number;
          session_id: string;
          set_index: number;
          superset?: string | null;
        };
        Update: {
          exercise_id?: string;
          exercise_position?: number;
          id?: string;
          is_warmup?: boolean;
          kg?: number | null;
          reps?: number;
          session_id?: string;
          set_index?: number;
          superset?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'session_sets_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_sets_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'personal_records';
            referencedColumns: ['session_id'];
          },
          {
            foreignKeyName: 'session_sets_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'session_totals';
            referencedColumns: ['session_id'];
          },
          {
            foreignKeyName: 'session_sets_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'workout_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          current_period_end: string | null;
          plan: Database['public']['Enums']['subscription_plan'];
          status: Database['public']['Enums']['subscription_status'];
          trial_ends_at: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cancel_at_period_end?: boolean;
          current_period_end?: string | null;
          plan: Database['public']['Enums']['subscription_plan'];
          status: Database['public']['Enums']['subscription_status'];
          trial_ends_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          current_period_end?: string | null;
          plan?: Database['public']['Enums']['subscription_plan'];
          status?: Database['public']['Enums']['subscription_status'];
          trial_ends_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          auto_rest: boolean;
          notify_daily: boolean;
          notify_goals: boolean;
          notify_remind: boolean;
          notify_rest: boolean;
          notify_sound: boolean;
          notify_sync: boolean;
          notify_weekly: boolean;
          reminder_minutes: number;
          share_done: boolean;
          share_kind: boolean;
          share_loads: boolean;
          share_prs: boolean;
          share_streak: boolean;
          units: Database['public']['Enums']['units'];
          updated_at: string;
          user_id: string;
          visibility: Database['public']['Enums']['visibility'];
        };
        ComputedFields: never;
        Insert: {
          auto_rest?: boolean;
          notify_daily?: boolean;
          notify_goals?: boolean;
          notify_remind?: boolean;
          notify_rest?: boolean;
          notify_sound?: boolean;
          notify_sync?: boolean;
          notify_weekly?: boolean;
          reminder_minutes?: number;
          share_done?: boolean;
          share_kind?: boolean;
          share_loads?: boolean;
          share_prs?: boolean;
          share_streak?: boolean;
          units?: Database['public']['Enums']['units'];
          updated_at?: string;
          user_id: string;
          visibility?: Database['public']['Enums']['visibility'];
        };
        Update: {
          auto_rest?: boolean;
          notify_daily?: boolean;
          notify_goals?: boolean;
          notify_remind?: boolean;
          notify_rest?: boolean;
          notify_sound?: boolean;
          notify_sync?: boolean;
          notify_weekly?: boolean;
          reminder_minutes?: number;
          share_done?: boolean;
          share_kind?: boolean;
          share_loads?: boolean;
          share_prs?: boolean;
          share_streak?: boolean;
          units?: Database['public']['Enums']['units'];
          updated_at?: string;
          user_id?: string;
          visibility?: Database['public']['Enums']['visibility'];
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          created_at: string;
          ended_at: string;
          focus: string;
          id: string;
          notes: string;
          owner_id: string;
          paused_seconds: number;
          routine_id: string | null;
          started_at: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          ended_at: string;
          focus?: string;
          id?: string;
          notes?: string;
          owner_id?: string;
          paused_seconds?: number;
          routine_id?: string | null;
          started_at: string;
          title: string;
        };
        Update: {
          created_at?: string;
          ended_at?: string;
          focus?: string;
          id?: string;
          notes?: string;
          owner_id?: string;
          paused_seconds?: number;
          routine_id?: string | null;
          started_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_sessions_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      history_entries: {
        Row: {
          avg_heart_rate: number | null;
          distance_m: number | null;
          duration_seconds: number | null;
          focus: string | null;
          id: string | null;
          kind: string | null;
          owner_id: string | null;
          routine_id: string | null;
          sets: number | null;
          started_at: string | null;
          title: string | null;
          volume_kg: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      personal_records: {
        Row: {
          achieved_at: string | null;
          exercise_id: string | null;
          kg: number | null;
          owner_id: string | null;
          reps: number | null;
          session_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: 'session_sets_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      session_totals: {
        Row: {
          duration_seconds: number | null;
          owner_id: string | null;
          reps: number | null;
          session_id: string | null;
          sets: number | null;
          started_at: string | null;
          volume_kg: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      activity_label: {
        Args: { p_kind: Database['public']['Enums']['activity_kind'] };
        Returns: string;
      };
      app_time_zone: { Args: Record<PropertyKey, never>; Returns: string };
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
      challenge_board: {
        Args: { p_challenge: string; p_today: string };
        Returns: {
          active_minutes: number;
          at: string;
          day: string;
          done: boolean;
          handle: string;
          name: string;
          points: number;
          user_id: string;
          what: string;
        }[];
      };
      create_challenge: {
        Args: {
          p_days: number;
          p_kind: Database['public']['Enums']['challenge_kind'];
          p_members: string[];
          p_min_value: number;
          p_name: string;
          p_starts_on: string;
        };
        Returns: string;
      };
      delete_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      e2e_reset_demo: { Args: Record<PropertyKey, never>; Returns: undefined };
      find_profile: {
        Args: { p_handle: string };
        Returns: {
          handle: string;
          id: string;
          name: string;
        }[];
      };
      friend_days: {
        Args: { p_from: string; p_to: string };
        Returns: {
          active_minutes: number;
          day: string;
          done: boolean;
          name: string;
          steps: number;
          user_id: string;
          what: string;
        }[];
      };
      friends_today: {
        Args: { p_day: string };
        Returns: {
          active_minutes: number;
          at: string;
          done: boolean;
          handle: string;
          name: string;
          steps: number;
          streak: number;
          user_id: string;
          what: string;
        }[];
      };
      is_challenge_member: { Args: { p_challenge: string; p_user: string }; Returns: boolean };
      last_sets: {
        Args: { exercise_ids: string[] };
        Returns: {
          exercise_id: string;
          kg: number;
          performed_at: string;
          reps: number;
          set_index: number;
        }[];
      };
      local_day: { Args: { p_at: string }; Returns: string };
      refresh_daily_summary: { Args: { p_day: string; p_user: string }; Returns: undefined };
      save_routine: { Args: { payload: Json }; Returns: string };
      save_workout_session: { Args: { payload: Json }; Returns: string };
      send_friend_request: {
        Args: { p_handle: string };
        Returns: {
          created_at: string;
          from_id: string;
          id: string;
          responded_at: string | null;
          status: Database['public']['Enums']['friend_status'];
          to_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'friend_requests';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      suggested_friends: {
        Args: Record<PropertyKey, never>;
        Returns: {
          handle: string;
          invited: boolean;
          name: string;
          user_id: string;
        }[];
      };
    };
    Enums: {
      activity_kind:
        | 'run'
        | 'walk'
        | 'bike'
        | 'swim'
        | 'soccer'
        | 'basket'
        | 'tennis'
        | 'functional'
        | 'stretch'
        | 'yoga';
      challenge_kind: 'day' | 'minutes' | 'steps';
      data_source: 'manual' | 'health';
      exercise_kind: 'load_reps' | 'reps' | 'time';
      friend_status: 'pending' | 'accepted';
      notification_kind: 'workout' | 'social' | 'sync' | 'weekly' | 'record' | 'goal';
      subscription_plan: 'year' | 'month';
      subscription_status: 'trialing' | 'active' | 'canceled' | 'expired';
      units: 'kg' | 'lb';
      visibility: 'friends' | 'me' | 'all';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_kind: [
        'run',
        'walk',
        'bike',
        'swim',
        'soccer',
        'basket',
        'tennis',
        'functional',
        'stretch',
        'yoga',
      ],
      challenge_kind: ['day', 'minutes', 'steps'],
      data_source: ['manual', 'health'],
      exercise_kind: ['load_reps', 'reps', 'time'],
      friend_status: ['pending', 'accepted'],
      notification_kind: ['workout', 'social', 'sync', 'weekly', 'record', 'goal'],
      subscription_plan: ['year', 'month'],
      subscription_status: ['trialing', 'active', 'canceled', 'expired'],
      units: ['kg', 'lb'],
      visibility: ['friends', 'me', 'all'],
    },
  },
} as const;
