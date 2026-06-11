-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES & COLUMNS
-- ==========================================

-- PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- DAILY ENTRIES TABLE
CREATE TABLE public.daily_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    transport_type TEXT,
    transport_distance_km NUMERIC,
    food_type TEXT,
    energy_usage_kwh NUMERIC,
    shopping_items INTEGER,
    carbon_score NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, date) -- Assuming one consolidated entry per day
);

-- ECOSYSTEM STATES TABLE
CREATE TABLE public.ecosystem_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    forest_health INTEGER DEFAULT 50 CHECK (forest_health >= 0 AND forest_health <= 100),
    water_quality INTEGER DEFAULT 50 CHECK (water_quality >= 0 AND water_quality <= 100),
    air_quality INTEGER DEFAULT 50 CHECK (air_quality >= 0 AND air_quality <= 100),
    biodiversity INTEGER DEFAULT 50 CHECK (biodiversity >= 0 AND biodiversity <= 100),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- INSIGHTS TABLE
CREATE TABLE public.insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    generated_for_date DATE NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, generated_for_date, insight_type)
);

-- ==========================================
-- 2. AUTOMATIC UPDATED_AT TRIGGERS
-- ==========================================

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_entries_updated_at
    BEFORE UPDATE ON public.daily_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ecosystem_states_updated_at
    BEFORE UPDATE ON public.ecosystem_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. INDEXES
-- ==========================================

CREATE INDEX idx_daily_entries_user_date ON public.daily_entries(user_id, date);
CREATE INDEX idx_ecosystem_states_user_created ON public.ecosystem_states(user_id, created_at DESC);
CREATE INDEX idx_insights_user_created ON public.insights(user_id, created_at DESC);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Daily Entries Policies
CREATE POLICY "Users can view own daily entries" 
    ON public.daily_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily entries" 
    ON public.daily_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily entries" 
    ON public.daily_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily entries" 
    ON public.daily_entries FOR DELETE USING (auth.uid() = user_id);

-- Ecosystem States Policies
CREATE POLICY "Users can view own ecosystem states" 
    ON public.ecosystem_states FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ecosystem states" 
    ON public.ecosystem_states FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ecosystem states" 
    ON public.ecosystem_states FOR UPDATE USING (auth.uid() = user_id);

-- Insights Policies
CREATE POLICY "Users can view own insights" 
    ON public.insights FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights (e.g. mark read)" 
    ON public.insights FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 5. AUTH TRIGGER (Automatically create profile)
-- ==========================================

-- This automatically creates a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
