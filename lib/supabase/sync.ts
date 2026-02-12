/**
 * Supabase sync layer -- fire-and-forget helpers that mirror local state to the DB.
 * Uses the browser (client-side) Supabase client.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";
import type { Conversation, Message } from "@/lib/types/chat";

const sb = () => createClient();

type ConversationRow = Database["public"]["Tables"]["conversations"]["Insert"];

/* ------------------------------------------------------------------ */
/*  Conversations                                                      */
/* ------------------------------------------------------------------ */

export async function syncConversationToSupabase(conversation: Conversation, userId: string) {
    try {
        const row: ConversationRow = {
            id: conversation.id,
            user_id: userId,
            title: conversation.title,
            model: conversation.model,
            created_at: new Date(conversation.createdAt).toISOString(),
            updated_at: new Date(conversation.updatedAt).toISOString(),
            is_archived: conversation.isArchived,
            metadata: (conversation.metadata ?? {}) as Database["public"]["Tables"]["conversations"]["Row"]["metadata"],
        };
        await sb().from("conversations").upsert(row as never, { onConflict: "id" });
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
        return (data ?? []).map((row: Record<string, unknown>) => ({
            id: String(row.id),
            userId: String(row.user_id),
            title: String(row.title || "New Chat"),
            model: String(row.model || "mar-beta"),
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
            isArchived: Boolean(row.is_archived ?? false),
            isPinned: false,
            metadata: (row.metadata as Record<string, unknown>) ?? {},
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
        const row = {
            id: message.id,
            conversation_id: message.conversationId,
            role: message.role,
            content: message.content,
            created_at: new Date(message.createdAt).toISOString(),
            metadata: message.metadata ?? {},
            tokens_used: message.tokensUsed ?? null,
            model: message.model ?? null,
        };
        await sb().from("messages").upsert(row as never, { onConflict: "id" });
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
        return (data ?? []).map((row: Record<string, unknown>) => ({
            id: String(row.id),
            conversationId: String(row.conversation_id),
            role: String(row.role),
            content: String(row.content),
            createdAt: new Date(row.created_at as string),
            metadata: (row.metadata as Record<string, unknown>) ?? {},
            tokensUsed: row.tokens_used != null ? Number(row.tokens_used) : undefined,
            model: row.model != null ? String(row.model) : undefined,
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
            .update({ preferences } as never)
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
        return ((data as { preferences?: Record<string, unknown> } | null)?.preferences) ?? null;
    } catch (e) {
        console.warn("[sync] fetch settings failed", e);
        return null;
    }
}

/** Fetch recent conversation summaries for cross-chat context (title + last message preview). */
export async function fetchRecentConversationSummaries(
    userId: string,
    excludeConversationId: string | null,
    limit: number = 15
): Promise<Array<{ title: string; lastPreview: string }>> {
    try {
        const { data: convs, error: convErr } = await sb()
            .from("conversations")
            .select("id, title")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(limit + 10);
        if (convErr || !convs?.length) return [];
        const ids = (convs as { id: string; title: string }[])
            .filter((c) => c.id !== excludeConversationId)
            .slice(0, limit)
            .map((c) => c.id);
        if (ids.length === 0) return [];
        const { data: msgs, error: msgErr } = await sb()
            .from("messages")
            .select("conversation_id, content, role")
            .in("conversation_id", ids)
            .order("created_at", { ascending: false });
        if (msgErr || !msgs?.length) {
            return ids.map((id) => {
                const c = (convs as { id: string; title: string }[]).find((x) => x.id === id);
                return { title: c?.title ?? "Chat", lastPreview: "" };
            });
        }
        const byConv = (msgs as { conversation_id: string; content: string; role: string }[]).reduce(
            (acc, m) => {
                if (!acc[m.conversation_id]) acc[m.conversation_id] = [];
                acc[m.conversation_id].push(m);
                return acc;
            },
            {} as Record<string, { content: string; role: string }[]>
        );
        return ids.map((id) => {
            const c = (convs as { id: string; title: string }[]).find((x) => x.id === id);
            const last = byConv[id]?.[0];
            const preview = last ? `${last.role}: ${(last.content || "").slice(0, 120).trim()}${last.content.length > 120 ? "…" : ""}` : "";
            return { title: c?.title ?? "Chat", lastPreview: preview };
        });
    } catch (e) {
        console.warn("[sync] fetch recent summaries failed", e);
        return [];
    }
}
