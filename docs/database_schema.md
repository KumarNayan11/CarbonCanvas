# CarbonCanvas - Supabase PostgreSQL Schema Design

## 1. ER Diagram Description

The data model centers around the user and tracks their actions, resulting footprint, and the state of their virtual ecosystem over time.

*   **`users` (Supabase Auth)**: The core identity provider managed by Supabase.
*   **`profiles`**: 1-to-1 relationship with `auth.users`. Stores application-specific user details like name and email.
*   **`daily_entries`**: 1-to-Many relationship with `profiles`. Records a user's daily activities across various categories (transport, food, energy, shopping) and the calculated daily carbon score.
*   **`ecosystem_states`**: 1-to-Many relationship with `profiles`. Tracks the historical health of the user's virtual ecosystem (forest, water, air, biodiversity) to reflect the cumulative impact of their choices over time.
*   **`insights`**: 1-to-Many relationship with `profiles`. Stores cached, AI-generated awareness narratives, observations, and recommendations tailored to the user.

## 2. Tables

1.  **`profiles`**: Extended user data synced with Supabase Auth.
2.  **`daily_entries`**: Daily logs of user activities and their resulting carbon footprint.
3.  **`ecosystem_states`**: Snapshots of the user's environmental dimensions reflecting their historical impact.
4.  **`insights`**: Cached AI-generated recommendations and sustainability narratives.

## 3. Columns and Data Types

### `profiles`
*   `id` (UUID, Primary Key)
*   `full_name` (Text, Nullable)
*   `email` (Text, Unique, Not Null)
*   `created_at` (Timestamptz, Default: now())
*   `updated_at` (Timestamptz, Default: now())

### `daily_entries`
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Not Null)
*   `date` (Date, Not Null)
*   `transport_type` (Text, Nullable)
*   `transport_distance_km` (Numeric, Nullable)
*   `food_type` (Text, Nullable)
*   `energy_usage_kwh` (Numeric, Nullable)
*   `shopping_items` (Integer, Nullable)
*   `carbon_score` (Numeric, Not Null) - *Estimated daily carbon footprint*
*   `created_at` (Timestamptz, Default: now())
*   `updated_at` (Timestamptz, Default: now())

### `ecosystem_states`
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Not Null)
*   `forest_health` (Integer, Default: 50) - *Scale of 0-100*
*   `water_quality` (Integer, Default: 50) - *Scale of 0-100*
*   `air_quality` (Integer, Default: 50) - *Scale of 0-100*
*   `biodiversity` (Integer, Default: 50) - *Scale of 0-100*
*   `created_at` (Timestamptz, Default: now()) - *Used to track history*
*   `updated_at` (Timestamptz, Default: now())

### `insights`
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Not Null)
*   `insight_type` (Text, Not Null) - *e.g., 'observation', 'recommendation', 'narrative'*
*   `generated_for_date` (Date, Not Null) - *The date this insight pertains to*
*   `content` (Text, Not Null)
*   `metadata` (JSONB, Nullable) - *Structured context for the insight*
*   `is_read` (Boolean, Default: false)
*   `created_at` (Timestamptz, Default: now())

## 4. Foreign Keys

*   `profiles.id` references `auth.users(id)` ON DELETE CASCADE.
*   `daily_entries.user_id` references `profiles(id)` ON DELETE CASCADE.
*   `ecosystem_states.user_id` references `profiles(id)` ON DELETE CASCADE.
*   `insights.user_id` references `profiles(id)` ON DELETE CASCADE.

## 5. Indexes

To ensure query efficiency, especially for generating dashboards and trends:
*   `idx_daily_entries_user_date` on `daily_entries (user_id, date)` - *For daily lookups and date-range aggregations.*
*   `idx_ecosystem_states_user_created` on `ecosystem_states (user_id, created_at DESC)` - *For fetching the latest ecosystem state quickly.*
*   `idx_insights_user_created` on `insights (user_id, created_at DESC)` - *For loading recent insights.*

## 6. Row Level Security (RLS) Policies

All tables are secured so users can only access their own data:
*   **`profiles`**: Users can `SELECT` and `UPDATE` their own profile. Insert is handled via a secure database trigger on `auth.users` signup.
*   **`daily_entries`**: Users can perform all operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) but strictly filtered where `user_id = auth.uid()`.
*   **`ecosystem_states`**: Users can perform all operations where `user_id = auth.uid()`.
*   **`insights`**: Users can `SELECT` and `UPDATE` (e.g., mark as read) their own insights. Only the system/AI layer (via service role key) can `INSERT`.

---

## 7. SQL Schema

```sql
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
```
