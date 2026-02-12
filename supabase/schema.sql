-- MAR Chat Database Schema
-- Run this in your Supabase SQL Editor

-- ===========================================
-- IMPORTANT: Configure Auth Redirect URLs
-- ===========================================
-- In Supabase Dashboard: Authentication > URL Configuration
-- Add these to "Redirect URLs":
--   http://localhost:3000/auth/callback
--   https://chat.gomarai.com/auth/callback
-- Set "Site URL" to: https://chat.gomarai.com
-- For magic links: Auth > Email Templates - ensure magic link template is configured.
-- To reduce "otp_expired" errors: Auth > Settings > Auth Providers > Email - 
--   Magic Link expiry is 3600s by default. Consider enabling "Secure email change" etc.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{
        "theme": "system",
        "defaultModel": "mar-beta",
        "privacyMode": "public",
        "enableTools": true,
        "enableArtifacts": true,
        "persona": "professional",
        "notifications": true
    }'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    model TEXT DEFAULT 'mar-beta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    tokens_used INTEGER,
    model TEXT
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages of own conversations" ON public.messages;
CREATE POLICY "Users can view messages of own conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.messages;
CREATE POLICY "Users can create messages in own conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.messages;
CREATE POLICY "Users can update messages in own conversations"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.messages;
CREATE POLICY "Users can delete messages in own conversations"
    ON public.messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Artifacts table
CREATE TABLE IF NOT EXISTS public.artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Artifacts policies
DROP POLICY IF EXISTS "Users can view own artifacts" ON public.artifacts;
CREATE POLICY "Users can view own artifacts"
    ON public.artifacts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create artifacts" ON public.artifacts;
CREATE POLICY "Users can create artifacts"
    ON public.artifacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own artifacts" ON public.artifacts;
CREATE POLICY "Users can update own artifacts"
    ON public.artifacts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own artifacts" ON public.artifacts;
CREATE POLICY "Users can delete own artifacts"
    ON public.artifacts FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON public.artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_conversation_id ON public.artifacts(conversation_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artifacts_updated_at ON public.artifacts;
CREATE TRIGGER update_artifacts_updated_at
    BEFORE UPDATE ON public.artifacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifacts', 'artifacts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload artifacts" ON storage.objects;
CREATE POLICY "Users can upload artifacts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'artifacts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can view own artifacts" ON storage.objects;
CREATE POLICY "Users can view own artifacts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'artifacts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete own artifacts" ON storage.objects;
CREATE POLICY "Users can delete own artifacts"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'artifacts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
