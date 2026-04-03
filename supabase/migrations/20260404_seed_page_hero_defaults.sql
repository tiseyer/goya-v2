-- Seed default hero content for all 4 page slugs.
-- Uses ON CONFLICT DO NOTHING so existing customized values are preserved.

INSERT INTO public.page_hero_content (slug, pill, title, subtitle, updated_at, updated_by)
VALUES
  (
    'dashboard',
    '[role]',
    '[greeting], [first_name].',
    'Ready to practice today?',
    now(),
    NULL
  ),
  (
    'events',
    'Events',
    'Events',
    'Workshops, teacher trainings, dharma talks, and conferences from the global GOYA community.',
    now(),
    NULL
  ),
  (
    'academy',
    'GOYA Academy',
    'Course Library',
    'Workshops, sequences, dharma talks, and research — curated for the serious yoga practitioner.',
    now(),
    NULL
  ),
  (
    'add-ons',
    'Brightcoms',
    'All Add-Ons & Upgrades',
    'Enhance your GOYA profile with verified designation badges, continuing education credits, and more.',
    now(),
    NULL
  )
ON CONFLICT (slug) DO NOTHING;
