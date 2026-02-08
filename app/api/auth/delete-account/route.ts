import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Permanently deletes the authenticated user's account.
 * Uses the standard server-side Supabase client (cookies() from next/headers).
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("[delete-account] getUser error:", userError?.message ?? "no user");
            return NextResponse.json(
                { error: "Session invalid or expired. Please sign in again and try again from Settings." },
                { status: 401 }
            );
        }

        const admin = createAdminClient();
        const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error("[delete-account] deleteUser error:", deleteError);
            return NextResponse.json(
                { error: deleteError.message || "Failed to delete account" },
                { status: 500 }
            );
        }

        // Sign out to clear cookies
        await supabase.auth.signOut();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[delete-account] exception:", e);
        return NextResponse.json(
            { error: "Failed to delete account" },
            { status: 500 }
        );
    }
}
