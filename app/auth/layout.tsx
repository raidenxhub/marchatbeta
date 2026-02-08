import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "MAR Chat",
    icons: { icon: "/favicon.svg" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
