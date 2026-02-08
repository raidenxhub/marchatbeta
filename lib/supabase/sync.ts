/**
 * Supabase sync layer -- fire-and-forget helpers that mirror local state to the DB.
 * Uses the browser (client-side) Supabase client.
 *
 * We use `as any` for Supabase operations because the typed client's
 * generics sometimes resolve to `never` in strict mode. These are
 * fire-and-forget background calls so runtime safety is sufficient.
 */
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types/chat";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = (): any => createClient();

/* ------------------------------------------------------------------ */
/*  Conversations                                                      */
/* ------------------------------------------------------------------ */

export async function syncConversationToSupabase(conversation: Conversation, userId: string) {
    try {
        await sb().from("conversations").upsert(
            {
                id: conversation.id,
                user_id: userId,
                title: conversation.title,
                model: conversation.model,
                created_at: new Date(conversation.createdAt).toISOString(),
                updated_at: new Date(conversation.updatedAt).toISOString(),
                is_archived: conversation.isArchived,
                metadata: conversation.metadata ?? {},
            },
            { onConflict: "id" }
        );
    } catch (e) {
        console.warn("[sync] conversation upsert failed", e);
    }
}

export async function deleteConversationFromSupabase(conversationId: string) {
    try {
        await sb().from("conversations").delete().eq("id", conversationId);
    } catch (e) {
        console.warn("[sync] conversation delete failed", e);
    }
}

export async function fetchConversationsFromSupabase(userId: string): Promise<Conversation[]> {
    try {
        const { data, error } = await sb()
            .from("conversations")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });
        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data ?? []).map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            title: row.title || "New Chat",
            model: row.model || "mar-beta",
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            isArchived: row.is_archived ?? false,
            isPinned: false,
            metadata: row.metadata ?? {},
        })) as Conversation[];
    } catch (e) {
        console.warn("[sync] fetch conversations failed", e);
        return [];
    }
}

/* ------------------------------------------------------------------ */
/*  Messages                                                           */
/* ------------------------------------------------------------------ */

export async function syncMessageToSupabase(message: Message) {
    try {
        await sb().from("messages").upsert(
            {
                id: message.id,
                conversation_id: message.conversationId,
                role: message.role,
                content: message.content,
                created_at: new Date(message.createdAt).toISOString(),
                metadata: message.metadata ?? {},
                tokens_used: message.tokensUsed ?? null,
                model: message.model ?? null,
            },
            { onConflict: "id" }
        );
    } catch (e) {
        console.warn("[sync] message upsert failed", e);
    }
}

export async function fetchMessagesFromSupabase(
    conversationId: string
): Promise<Message[]> {
    try {
        const { data, error } = await sb()
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });
        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data ?? []).map((row: any) => ({
            id: row.id,
            conversationId: row.conversation_id,
            role: row.role,
            content: row.content,
            createdAt: new Date(row.created_at),
            metadata: row.metadata ?? {},
            tokensUsed: row.tokens_used ?? undefined,
            model: row.model ?? undefined,
        })) as Message[];
    } catch (e) {
        console.warn("[sync] fetch messages failed", e);
        return [];
    }
}

/* ------------------------------------------------------------------ */
/*  Settings / Profile                                                 */
/* ------------------------------------------------------------------ */

export async function syncSettingsToProfile(userId: string, preferences: Record<string, unknown>) {
    try {
        await sb()
            .from("profiles")
            .update({ preferences })
            .eq("id", userId);
    } catch (e) {
        console.warn("[sync] settings sync failed", e);
    }
}

export async function fetchSettingsFromProfile(userId: string): Promise<Record<string, unknown> | null> {
    try {
        const { data, error } = await sb()
            .from("profiles")
            .select("preferences")
            .eq("id", userId)
            .single();
        if (error) throw error;
        return (data?.preferences as Record<string, unknown>) ?? null;
    } catch (e) {
        console.warn("[sync] fetch settings failed", e);
        return null;
    }
}
