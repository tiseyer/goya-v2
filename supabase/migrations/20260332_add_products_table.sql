CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('teacher_designation', 'experienced_teacher', 'school_designation', 'special')),
  price_display text NOT NULL,
  price_cents integer,
  image_path text,
  description text,
  features jsonb DEFAULT '[]',
  requires_any_of text[] DEFAULT '{}',
  hidden_if_has_any text[] DEFAULT '{}',
  has_variants boolean DEFAULT false,
  variants jsonb DEFAULT '{}',
  priority integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- Add designations column to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designations text[] DEFAULT '{}';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed all 22 products
INSERT INTO public.products (slug, name, full_name, category, price_display, price_cents, image_path, description, features, requires_any_of, hidden_if_has_any, has_variants, variants, priority) VALUES

('experience-years', 'Experience Years', 'GOYA Teaching Experience Year', 'special',
'Free', 0, '/images/products/experience-badges.png',
'GOYA Teaching Experience Badges honor the dedication, commitment, and long-term contribution of yoga teachers across the world. These badges recognize verified years of teaching experience, celebrating the depth, wisdom, and personal evolution that only time can cultivate.',
'[]'::jsonb,
ARRAY['teacher'],
ARRAY[]::text[],
true,
'{"type": "select", "label": "Experience Years", "options": ["Starter", "1 Year", "2 Years", "5 Years", "10 Years", "20 Years", "30 Years", "40 Years", "50 Years"]}'::jsonb,
10),

('giving-tree', 'GOYA Giving Tree Donation', 'GOYA Giving Tree Donation', 'special',
'from $5.00/year', 500, '/images/products/experience-badges.png',
'Join us in spreading the power of yoga and community worldwide! By contributing to the GOYA Giving Tree, you help us train and empower yoga teachers globally, create inclusive yoga programs for diverse communities, and support underserved populations with tools for mindfulness, health, and well-being.',
'[]'::jsonb,
ARRAY[]::text[],
ARRAY[]::text[],
true,
'{"amount": {"label": "Donation Amount", "options": ["$5", "$10", "$25", "$50"]}, "frequency": {"label": "Payment Frequency", "options": ["One Time", "Monthly", "Yearly"]}}'::jsonb,
20),

('goya-wp', 'GOYA-WP®', 'GOYA Wellness Practitioner', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation WP.png',
'A Wellness Practitioner is a professional who specializes in promoting holistic health and well-being, often through means such as nutrition, exercise, stress management, and alternative therapies. They focus on enhancing an individual''s overall wellness, considering physical, mental, and emotional aspects to achieve a balanced and healthy lifestyle. Professions included range from nutritionists, life coaches, massage therapists, naturopaths, nurse practitioners, holistic therapists, acupuncturists and so many more. All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Document Verification", "text": "Mandatory for acquiring this status."}]'::jsonb,
ARRAY[]::text[],
ARRAY['GOYA-WP'],
false, '{}'::jsonb, 30),

('goya-cyt200', 'GOYA-CYT200®', 'GOYA Certified Yoga Teacher 200 Hour', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation CYT200.png',
'All sales are final. If you cancel your registration with GOYA, all related designations will be cancelled and no refund will be issued.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Certification Verification", "text": "Mandatory for acquiring this status."}, {"label": "Educational Requirements", "text": "Successful completion of a 200-Hour Yoga Teacher Training (Online or In Person). The training does not have to have been completed with a GOYA-CYS200."}]'::jsonb,
ARRAY['teacher'],
ARRAY['GOYA-CYT200', 'GOYA-CYT500', 'GOYA-ECYT200', 'GOYA-ECYT500'],
false, '{}'::jsonb, 40),

('goya-cyt500', 'GOYA-CYT500®', 'GOYA Certified Yoga Teacher 500 Hour', 'teacher_designation',
'$15.00', 1500, '/images/products/GOYA Designation CYT500.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time upgrade fee of $15USD to add designation."}, {"label": "Recurring Annual Fee", "text": "No additional annual charges for maintaining the designation."}, {"label": "Prerequisite", "text": "Available to members who have an active designation as a GOYA-CYT200 or GOYA-ECYT200."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 30 teaching hours must be completed since obtaining 500 hour certification."}, {"label": "Follow-up Email", "text": "Expect an email within 24 hours with instructions on submitting your teaching hours and certification documents."}]'::jsonb,
ARRAY['GOYA-CYT200', 'GOYA-ECYT200'],
ARRAY['GOYA-CYT500', 'GOYA-ECYT500'],
false, '{}'::jsonb, 50),

('goya-ecyt200', 'GOYA-ECYT200®', 'GOYA Experienced Certified Yoga Teacher 200 Hour', 'experienced_teacher',
'$10.00/year + $15.00 sign-up fee', 1000, '/images/products/GOYA Designation ECYT200.png',
'The additional $10USD annual recurring fee complements your existing annual recurring fee of $39 USD, which was paid during initial registration. All Experienced designations incur an annual recurring fee of $49 USD. All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time upgrade fee of $15USD to add designation."}, {"label": "Recurring Annual Fee", "text": "Annual recurring of $10USD for maintaining the designation. First payment due today."}, {"label": "Prerequisite", "text": "Available to members who have an active designation as a GOYA-CYT200."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 850 teaching hours must be completed since obtaining certification."}, {"label": "Follow-up Email", "text": "Expect an email within 24 hours with instructions on submitting your teaching hours."}]'::jsonb,
ARRAY['GOYA-CYT200'],
ARRAY['GOYA-ECYT200', 'GOYA-ECYT500'],
false, '{}'::jsonb, 60),

('goya-ecyt500', 'GOYA-ECYT500®', 'GOYA Experienced Certified Yoga Teacher 500 Hour', 'experienced_teacher',
'$10.00/year + $15.00 sign-up fee', 1000, '/images/products/GOYA Designation ECYT500.png',
'The additional $10USD annual recurring fee complements your existing annual recurring fee of $39 USD. All Experienced designations incur an annual recurring fee of $49 USD. If you currently hold an ECYT200, your prior extra recurring fee of $10USD will automatically be cancelled. All sales are final.',
'[{"label": "Profile Addition", "text": "One-time upgrade fee of $15USD to add designation."}, {"label": "Recurring Annual Fee", "text": "Annual recurring of $10USD for maintaining the designation. First payment due today."}, {"label": "Prerequisite", "text": "Available to members who have an active designation as a GOYA-CYT200, GOYA-ECYT200 or GOYA-CYT500."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 1,000 teaching hours must be completed since obtaining 500 hour certification. 300 of these teaching hours must have occurred within the past 12 months."}]'::jsonb,
ARRAY['GOYA-CYT200', 'GOYA-ECYT200', 'GOYA-CYT500'],
ARRAY['GOYA-ECYT500'],
false, '{}'::jsonb, 70),

('goya-ccep', 'GOYA-CCEP®', 'GOYA Certified Continuing Education Provider', 'experienced_teacher',
'$10.00/year + $29.00 sign-up fee', 1000, '/images/products/GOYA Designation CCEP.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time upgrade fee of $29USD to add designation."}, {"label": "Recurring Annual Fee", "text": "Annual recurring of $10USD for maintaining the designation. First payment due today."}, {"label": "Prerequisite", "text": "Available to members who have an active designation as a GOYA-ECYT200, GOYA-CYT500 or GOYA-ECYT500."}]'::jsonb,
ARRAY['GOYA-ECYT200', 'GOYA-CYT500', 'GOYA-ECYT500'],
ARRAY['GOYA-CCEP'],
false, '{}'::jsonb, 80),

('goya-ccyt', 'GOYA-CCYT®', 'GOYA Certified Children''s Yoga Teacher', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation CCYT.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Certification Verification", "text": "Mandatory for acquiring this status."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 15 hours of Children''s Yoga teaching or practice must be completed since obtaining certification."}, {"label": "Follow-up Email", "text": "Expect an email within 24 hours with instructions on submitting your certification documentation and teaching hours."}]'::jsonb,
ARRAY['teacher', 'GOYA-CYT200', 'GOYA-CYT500', 'GOYA-ECYT200', 'GOYA-ECYT500'],
ARRAY['GOYA-CCYT'],
false, '{}'::jsonb, 90),

('goya-cpyt', 'GOYA-CPYT®', 'GOYA Certified Prenatal Yoga Teacher', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation CPYT.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Certification Verification", "text": "Mandatory for acquiring this status."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 15 hours of Prenatal Yoga teaching or practice must be completed since obtaining certification."}, {"label": "Follow-up Email", "text": "Expect an email within 24 hours with instructions on submitting your certification documentation and teaching hours."}]'::jsonb,
ARRAY['teacher', 'GOYA-CYT200', 'GOYA-CYT500', 'GOYA-ECYT200', 'GOYA-ECYT500'],
ARRAY['GOYA-CPYT'],
false, '{}'::jsonb, 100),

('goya-cyyt', 'GOYA-CYYT®', 'GOYA Certified Yin Yoga Teacher', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation CYYT.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Certification Verification", "text": "Mandatory for acquiring this status."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 10 hours of Yin Yoga teaching or practice must be completed since obtaining certification."}]'::jsonb,
ARRAY['teacher', 'GOYA-CYT200', 'GOYA-CYT500', 'GOYA-ECYT200', 'GOYA-ECYT500'],
ARRAY['GOYA-CYYT'],
false, '{}'::jsonb, 110),

('goya-cryt', 'GOYA-CRYT®', 'GOYA Certified Restorative Yoga Teacher', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation CRYT.png',
'All sales are final. If you cancel your registration with GOYA, all related designations will be cancelled and no refund will be issued.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Certification Verification", "text": "Mandatory for acquiring this status."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 10 hours of Restorative Yoga teaching or practice must be completed since obtaining certification."}]'::jsonb,
ARRAY['teacher', 'GOYA-CYT200', 'GOYA-CYT500', 'GOYA-ECYT200', 'GOYA-ECYT500'],
ARRAY['GOYA-CRYT'],
false, '{}'::jsonb, 120),

('goya-cmt', 'GOYA-CMT®', 'GOYA Certified Meditation Teacher', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation CMT.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Certification Verification", "text": "Mandatory for acquiring this status."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 10 hours of Meditation teaching or practice must be completed since obtaining certification."}, {"label": "Follow-up Email", "text": "Expect an email within 24 hours with instructions on submitting your certification documentation and teaching hours."}]'::jsonb,
ARRAY['teacher', 'GOYA-CYT200', 'GOYA-CYT500', 'GOYA-ECYT200', 'GOYA-ECYT500'],
ARRAY['GOYA-CMT'],
false, '{}'::jsonb, 130),

('goya-cayt', 'GOYA-CAYT®', 'GOYA Certified Ayurveda Yoga Teacher', 'teacher_designation',
'$10.00', 1000, '/images/products/GOYA Designation CAYT.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[{"label": "Profile Addition", "text": "One-time fee of $10USD to add designation."}, {"label": "No Recurring Fees", "text": "No annual charges for maintaining the designation."}, {"label": "Certification Verification", "text": "Mandatory for acquiring this status."}, {"label": "Teaching | Practice Hours", "text": "Minimum of 15 hours of Ayurveda teaching or practice must be completed since obtaining certification."}, {"label": "Follow-up Email", "text": "Expect an email within 24 hours with instructions on submitting your certification documentation and teaching hours."}]'::jsonb,
ARRAY['teacher', 'GOYA-CYT200', 'GOYA-CYT500', 'GOYA-ECYT200', 'GOYA-ECYT500'],
ARRAY['GOYA-CAYT'],
false, '{}'::jsonb, 140),

('goya-cys200', 'GOYA-CYS200®', 'GOYA Certified Yoga School 200', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CYS200.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner'],
ARRAY['GOYA-CYS200', 'GOYA-CYS300', 'GOYA-CYS500'],
false, '{}'::jsonb, 150),

('goya-cys300', 'GOYA-CYS300®', 'GOYA Certified Yoga School 300', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CYS300.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner', 'GOYA-CYS200'],
ARRAY['GOYA-CYS300', 'GOYA-CYS500'],
false, '{}'::jsonb, 160),

('goya-cys500', 'GOYA-CYS500®', 'GOYA Certified Yoga School 500', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CYS500.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner', 'GOYA-CYS200', 'GOYA-CYS300'],
ARRAY['GOYA-CYS500'],
false, '{}'::jsonb, 170),

('goya-ccys', 'GOYA-CCYS®', 'GOYA Certified Children''s Yoga School', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CCYS.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner', 'GOYA-CYS200', 'GOYA-CYS300', 'GOYA-CYS500'],
ARRAY['GOYA-CCYS'],
false, '{}'::jsonb, 180),

('goya-cpys', 'GOYA-CPYS®', 'GOYA Certified Prenatal Yoga School', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CPYS.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner', 'GOYA-CYS200', 'GOYA-CYS300', 'GOYA-CYS500'],
ARRAY['GOYA-CPYS'],
false, '{}'::jsonb, 185),

('goya-cyys', 'GOYA-CYYS®', 'GOYA Certified Yin Yoga School', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CYYS.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner', 'GOYA-CYS200', 'GOYA-CYS300', 'GOYA-CYS500'],
ARRAY['GOYA-CYYS'],
false, '{}'::jsonb, 190),

('goya-crys', 'GOYA-CRYS®', 'GOYA Certified Restorative Yoga School', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CRYS.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner', 'GOYA-CYS200', 'GOYA-CYS300', 'GOYA-CYS500'],
ARRAY['GOYA-CRYS'],
false, '{}'::jsonb, 200),

('goya-cms', 'GOYA-CMS®', 'GOYA Certified Meditation School', 'school_designation',
'$40.00/year + $99.00 sign-up fee', 4000, '/images/products/GOYA Designation CMS.png',
'All sales are final. Should you cancel your registration with GOYA, all designations automatically cancel.',
'[]'::jsonb,
ARRAY['school_owner', 'GOYA-CYS200', 'GOYA-CYS300', 'GOYA-CYS500'],
ARRAY['GOYA-CMS'],
false, '{}'::jsonb, 210)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  price_display = EXCLUDED.price_display,
  image_path = EXCLUDED.image_path,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  requires_any_of = EXCLUDED.requires_any_of,
  hidden_if_has_any = EXCLUDED.hidden_if_has_any,
  has_variants = EXCLUDED.has_variants,
  variants = EXCLUDED.variants,
  priority = EXCLUDED.priority;
