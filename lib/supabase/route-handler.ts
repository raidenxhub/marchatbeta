import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Parses the Cookie header from a request into a map of name -> value.
 * Supabase stores auth in chunked cookies (key, key.0, key.1, ...).
 */
function parseCookieMap(cookieHeader: string | null): Map<string, string> {
    const map = new Map<string, string>();
    if (!cookieHeader || !cookieHeader.trim()) return map;
    cookieHeader.split(";").forEach((part) => {
        const eq = part.trim().indexOf("=");
        if (eq <= 0) return;
        const name = part.trim().slice(0, eq).trim();
        const value = part.trim().slice(eq + 1).trim();
        if (name) map.set(name, value);
    });
    return map;
}

/**
 * Creates a Supabase server client for use in Route Handlers (e.g. API routes).
 * Uses the incoming Request's Cookie header so the session is always read from
 * what the client sent, avoiding "Unauthorized" due to cookie context issues.
 */
export async function createServerClientForRoute(request: Request) {
    const cookieStore = await cookies();
    const cookieHeader = request.headers.get("cookie");
    const cookieMap = parseCookieMap(cookieHeader);

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async get(name: string) {
                    return cookieMap.get(name);
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // ignore (e.g. from Server Component context)
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
                    } catch {
                        // ignore
                    }
                },
            },
        }
    );
}
