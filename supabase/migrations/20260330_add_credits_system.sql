-- Credits/Hours log table — every entry is one submission
CREATE TABLE public.credit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_type text NOT NULL CHECK (credit_type IN ('ce', 'karma', 'practice', 'teaching', 'community')),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  activity_date date NOT NULL,
  description text,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'automatic')),
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  expires_at date GENERATED ALWAYS AS (activity_date + INTERVAL '365 days') STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits" ON public.credit_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.credit_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits" ON public.credit_entries
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE TRIGGER update_credit_entries_updated_at
  BEFORE UPDATE ON public.credit_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit requirements settings table (admin-configurable)
CREATE TABLE public.credit_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_type text NOT NULL UNIQUE CHECK (credit_type IN ('ce', 'karma', 'practice', 'teaching', 'community')),
  required_amount numeric(10,2) NOT NULL DEFAULT 0,
  period_months integer NOT NULL DEFAULT 24,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.credit_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit requirements" ON public.credit_requirements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage credit requirements" ON public.credit_requirements
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Seed default requirements
INSERT INTO public.credit_requirements (credit_type, required_amount, period_months) VALUES
  ('ce', 20, 24),
  ('karma', 10, 24),
  ('practice', 50, 24),
  ('teaching', 100, 24),
  ('community', 0, 12)
ON CONFLICT (credit_type) DO NOTHING;
