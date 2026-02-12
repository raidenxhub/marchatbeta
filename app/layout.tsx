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

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MAR Chat",
    applicationCategory: "ProductivityApplication",
    description: "Free AI assistant with 400K context, web search, code execution, and artifacts. No subscriptions. Better than ChatGPT, Claude, and Gemini for privacy and capability.",
    url: BASE_URL,
    author: { "@type": "Organization", name: "MAR", url: "https://gomarai.com" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
        "400K token context window",
        "Web search",
        "Image and document analysis",
        "Code execution and artifacts",
        "Flights, hotels, weather tools",
        "No ads, no sponsored content",
        "Privacy-first, no training on your data",
    ],
};

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "MAR Chat | Free AI Assistant — ChatGPT, Claude & Gemini Alternative",
        template: "%s | MAR Chat",
    },
    description:
        "MAR Chat is a free AI assistant with 400K context, web search, code execution, and artifacts. No ads. No sponsored content. No subscriptions. Better than ChatGPT, Claude, and Gemini for privacy and capability.",
    keywords: [
        "MAR Chat",
        "AI chat",
        "free AI assistant",
        "ChatGPT alternative",
        "Claude alternative",
        "Gemini alternative",
        "MAR AI",
        "gomarai",
        "open source AI",
        "privacy-first AI",
        "AI chatbot",
        "conversational AI",
        "AI"
    ],
    authors: [{ name: "MAR", url: "https://gomarai.com" }],
    creator: "MAR",
    publisher: "MAR",
    alternates: { canonical: BASE_URL },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: BASE_URL,
        siteName: "MAR Chat",
        title: "MAR Chat | Free AI Assistant — ChatGPT, Claude & Gemini Alternative",
        description:
            "Free AI assistant with 400K context, web search, and tools. No ads. No subscriptions. No limits.",
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
        title: "MAR Chat | Free AI Assistant",
        description:
            "Free AI assistant. No ads. No subscriptions. No limits.",
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
    category: "technology",
    applicationName: "MAR Chat",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f5f5dc" },
        { media: "(prefers-color-scheme: dark)", color: "#1e1e1c" },
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
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
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
