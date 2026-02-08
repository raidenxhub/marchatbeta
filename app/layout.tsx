import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeSync } from "@/components/providers/theme-sync";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains",
    display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://chat.gomarai.com";

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "MAR Chat",
        template: "%s | MAR Chat",
    },
    description:
        "MAR Chat - A free, open-source AI assistant that rivals Claude, ChatGPT, and Gemini. Powered by advanced AI with unlimited access, complete privacy, and powerful tools.",
    keywords: [
        "AI",
        "chatbot",
        "assistant",
        "MAR AI",
        "gomarai",
        "free AI",
        "open source",
        "Gemini",
        "ChatGPT alternative",
        "Claude alternative",
    ],
    authors: [{ name: "MAR AI", url: "https://chat.gomarai.com" }],
    creator: "MAR AI",
    publisher: "MAR AI",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://chat.gomarai.com",
        siteName: "MAR Chat",
        title: "MAR Chat",
        description:
            "Free, open-source AI assistant with unlimited access. No subscriptions, no limits.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "MAR Chat - Free AI Assistant",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "MAR Chat",
        description:
            "Free, open-source AI assistant with unlimited access. No subscriptions, no limits.",
        images: ["/og-image.png"],
        creator: "@gomarai",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    manifest: "/manifest.json",
    icons: {
        icon: "/favicon.svg",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <ThemeSync />
                        {children}
                        <Toaster richColors position="top-center" />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
