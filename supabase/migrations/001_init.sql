-- Matrix of Soul Database Schema

-- Profiles (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  birth_date DATE,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matrices
CREATE TABLE matrices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  type TEXT DEFAULT 'personal' CHECK (type IN ('personal', 'event', 'daily')),
  data_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibility
CREATE TABLE compatibility (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name_a TEXT,
  name_b TEXT,
  birth_date_a DATE NOT NULL,
  birth_date_b DATE NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarot Spreads
CREATE TABLE tarot_spreads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  spread_type TEXT NOT NULL,
  cards_json JSONB NOT NULL,
  interpretation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')),
  energy_of_day INTEGER NOT NULL,
  reflection_text TEXT,
  tarot_card_id INTEGER,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_spreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own matrices" ON matrices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own matrices" ON matrices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own matrices" ON matrices FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own compatibility" ON compatibility FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own compatibility" ON compatibility FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own spreads" ON tarot_spreads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spreads" ON tarot_spreads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own journal" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
