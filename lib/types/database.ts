export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string | null;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                    preferences: Json | null;
                };
                Insert: {
                    id: string;
                    email?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    preferences?: Json | null;
                };
                Update: {
                    id?: string;
                    email?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    preferences?: Json | null;
                };
                Relationships: [];
            };
            conversations: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    model: string;
                    created_at: string;
                    updated_at: string;
                    is_archived: boolean;
                    metadata: Json | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title?: string;
                    model?: string;
                    created_at?: string;
                    updated_at?: string;
                    is_archived?: boolean;
                    metadata?: Json | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    model?: string;
                    created_at?: string;
                    updated_at?: string;
                    is_archived?: boolean;
                    metadata?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "conversations_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
            messages: {
                Row: {
                    id: string;
                    conversation_id: string;
                    role: "user" | "assistant" | "system";
                    content: string;
                    created_at: string;
                    metadata: Json | null;
                    tokens_used: number | null;
                    model: string | null;
                };
                Insert: {
                    id?: string;
                    conversation_id: string;
                    role: "user" | "assistant" | "system";
                    content: string;
                    created_at?: string;
                    metadata?: Json | null;
                    tokens_used?: number | null;
                    model?: string | null;
                };
                Update: {
                    id?: string;
                    conversation_id?: string;
                    role?: "user" | "assistant" | "system";
                    content?: string;
                    created_at?: string;
                    metadata?: Json | null;
                    tokens_used?: number | null;
                    model?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "messages_conversation_id_fkey";
                        columns: ["conversation_id"];
                        referencedRelation: "conversations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            artifacts: {
                Row: {
                    id: string;
                    user_id: string;
                    conversation_id: string | null;
                    message_id: string | null;
                    type: string;
                    title: string;
                    content: string;
                    file_url: string | null;
                    created_at: string;
                    updated_at: string;
                    metadata: Json | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    conversation_id?: string | null;
                    message_id?: string | null;
                    type: string;
                    title: string;
                    content: string;
                    file_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    metadata?: Json | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    conversation_id?: string | null;
                    message_id?: string | null;
                    type?: string;
                    title?: string;
                    content?: string;
                    file_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    metadata?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "artifacts_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "artifacts_conversation_id_fkey";
                        columns: ["conversation_id"];
                        referencedRelation: "conversations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "artifacts_message_id_fkey";
                        columns: ["message_id"];
                        referencedRelation: "messages";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {};
        Functions: {};
        Enums: {};
        CompositeTypes: {};
    };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];
