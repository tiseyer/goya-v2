-- Migration: Seed 3 onboarding flow templates
-- Replaces hardcoded onboarding with flow-builder-driven templates
-- Also marks all in-progress users as completed and adds actions column to flow_steps

-- A) Add actions column to flow_steps if missing
ALTER TABLE flow_steps ADD COLUMN IF NOT EXISTS actions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- B) Mark all in-progress onboarding users as completed
UPDATE profiles
SET onboarding_completed = true, onboarding_step = 999
WHERE onboarding_completed = false;

-- C) Seed Student Onboarding template
DO $$
DECLARE
  flow_id uuid;
  step_0_id uuid;
  step_1_id uuid;
  step_2_id uuid;
  step_3_id uuid;
  step_4_id uuid;
  step_5_id uuid;
  step_6_id uuid;
  step_7_id uuid;
  step_8_id uuid;
  step_9_id uuid;
  step_10_id uuid;
  step_11_id uuid;
  step_12_id uuid;
BEGIN
  INSERT INTO flows (
    id, name, description, status, display_type,
    modal_dismissible, modal_backdrop,
    trigger_type, frequency, is_template, template_name,
    priority, schema_version,
    conditions
  ) VALUES (
    gen_random_uuid(),
    'Student Onboarding',
    'Onboarding flow for student practitioners',
    'active',
    'modal',
    false,
    'blur',
    'login',
    'once',
    true,
    'student_onboarding',
    100,
    1,
    '[{"type":"role","operator":"equals","value":"student"},{"type":"onboarding_status","operator":"equals","value":"incomplete"}]'::jsonb
  ) RETURNING id INTO flow_id;

  -- Step 0: Your Designation
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 0, 'Your Designation',
    '[{"type":"info_text","element_key":"intro_info","label":"Your Designation","content":"You have selected the Student Practitioner designation. If you attain Teacher status, you will have the opportunity to upgrade your designation later.","required":false}]'::jsonb,
    '[]'::jsonb,
    1
  ) RETURNING id INTO step_0_id;

  -- Step 1: Full Legal Name
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 1, 'Full Legal Name',
    '[{"type":"short_text","element_key":"first_name","label":"First and Middle Name","required":true,"help_text":null},{"type":"short_text","element_key":"last_name","label":"Last Name","required":true,"help_text":null}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"first_name":"first_name","last_name":"last_name"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_1_id;

  -- Step 2: Email
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 2, 'Email',
    '[{"type":"short_text","element_key":"email","label":"Email Address","required":true,"help_text":null}]'::jsonb,
    '[]'::jsonb,
    1
  ) RETURNING id INTO step_2_id;

  -- Step 3: Create Your Username
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 3, 'Create Your Username',
    '[{"type":"info_text","element_key":"username_rules","label":"Username Rules","content":"Do NOT use @ symbol. Minimum 5 characters, maximum 20. Make it distinctive and personal.","required":false},{"type":"short_text","element_key":"username","label":"Username","required":true,"help_text":"Choose a unique username for your GOYA profile (similar to a social media handle)."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"username":"username"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_3_id;

  -- Step 4: How do you practice?
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 4, 'How do you practice?',
    '[{"type":"single_choice","element_key":"practice_format","label":"Practice Format","required":true,"help_text":null,"options":[{"label":"Online","value":"online"},{"label":"In-Person","value":"in_person"},{"label":"Hybrid (Online & In-Person)","value":"hybrid"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"practice_format":"practice_format"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_4_id;

  -- Step 5: Your Profile Picture
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 5, 'Your Profile Picture',
    '[{"type":"image_upload","element_key":"avatar_url","label":"Profile Picture","required":true,"help_text":"Upload a profile picture. This will appear in our Public Directory. Every profile must include a clear, recent photo of the member."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"avatar_url":"avatar_url"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_5_id;

  -- Step 6: Your Introduction
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 6, 'Your Introduction',
    '[{"type":"long_text","element_key":"introduction","label":"Introduction","required":true,"help_text":"Write a short sentence in first person that introduces you to the GOYA community."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"introduction":"introduction"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_6_id;

  -- Step 7: Your Profile Bio
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 7, 'Your Profile Bio',
    '[{"type":"long_text","element_key":"bio","label":"Profile Bio","required":true,"help_text":"Tell your story. Share your background, your journey, your passions and what brings you to GOYA. Minimum 250 characters."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"bio":"bio"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_7_id;

  -- Step 8: Practice Level
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 8, 'Practice Level',
    '[{"type":"single_choice","element_key":"practice_level","label":"Practice Level","required":true,"help_text":"Which experience level best describes your current practice?","options":[{"label":"Beginner","value":"beginner"},{"label":"Intermediate","value":"intermediate"},{"label":"Advanced","value":"advanced"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"practice_level":"practice_level"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_8_id;

  -- Step 9: Practice Style
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 9, 'Practice Style',
    '[{"type":"multi_choice","element_key":"practice_styles","label":"Practice Styles","required":true,"help_text":"Which styles best describe your practice? Choose 1 to 5 options.","options":[{"label":"Hatha Yoga","value":"hatha"},{"label":"Vinyasa Flow","value":"vinyasa"},{"label":"Yin Yoga","value":"yin"},{"label":"Restorative Yoga","value":"restorative"},{"label":"Ashtanga Yoga","value":"ashtanga"},{"label":"Prenatal Yoga","value":"prenatal"},{"label":"Postnatal Yoga","value":"postnatal"},{"label":"Children''s Yoga","value":"childrens"},{"label":"Power Yoga","value":"power"},{"label":"Kundalini Yoga","value":"kundalini"},{"label":"Hot Yoga","value":"hot"},{"label":"Gentle Yoga","value":"gentle"},{"label":"Modern Contemporary Yoga","value":"modern_contemporary"},{"label":"Traditional Lineage Based Yoga","value":"traditional_lineage"},{"label":"Trauma-Informed Yoga","value":"trauma_informed"},{"label":"Iyengar Yoga","value":"iyengar"},{"label":"Somatic Yoga","value":"somatic"},{"label":"Chair Yoga","value":"chair"},{"label":"Aerial Yoga","value":"aerial"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"practice_styles":"practice_styles"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_9_id;

  -- Step 10: Languages
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 10, 'Languages',
    '[{"type":"multi_choice","element_key":"languages","label":"Languages","required":true,"help_text":"Which languages do you practice in? Select all that apply.","options":[{"label":"English","value":"english"},{"label":"French","value":"french"},{"label":"German","value":"german"},{"label":"Spanish","value":"spanish"},{"label":"Arabic","value":"arabic"},{"label":"Croatian","value":"croatian"},{"label":"Czech","value":"czech"},{"label":"Dutch","value":"dutch"},{"label":"Finnish","value":"finnish"},{"label":"Greek","value":"greek"},{"label":"Hindi","value":"hindi"},{"label":"Italian","value":"italian"},{"label":"Japanese","value":"japanese"},{"label":"Mandarin","value":"mandarin"},{"label":"Polish","value":"polish"},{"label":"Portuguese","value":"portuguese"},{"label":"Slovakian","value":"slovakian"},{"label":"Swedish","value":"swedish"},{"label":"Thai","value":"thai"},{"label":"Ukrainian","value":"ukrainian"},{"label":"Urdu","value":"urdu"},{"label":"Other","value":"other"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"languages":"languages"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_10_id;

  -- Step 11: Your Social Media & Website
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 11, 'Your Social Media & Website',
    '[{"type":"short_text","element_key":"website","label":"Website or Booking Page","required":false,"help_text":"Add links to help other members find and connect with you. All fields are optional."},{"type":"short_text","element_key":"instagram","label":"Instagram","required":false,"help_text":null},{"type":"short_text","element_key":"facebook","label":"Facebook","required":false,"help_text":null},{"type":"short_text","element_key":"tiktok","label":"TikTok","required":false,"help_text":null},{"type":"short_text","element_key":"youtube","label":"YouTube","required":false,"help_text":null}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"website":"website","instagram":"instagram","facebook":"facebook","tiktok":"tiktok","youtube":"youtube"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_11_id;

  -- Step 12: Complete
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 12, 'Complete',
    '[{"type":"info_text","element_key":"submit_info","label":"Completion","content":"Click Next to create your Student Practitioner account. Welcome to the GOYA community!","required":false}]'::jsonb,
    '[{"type":"mark_complete","config":{}}]'::jsonb,
    1
  ) RETURNING id INTO step_12_id;

END $$;

-- D) Seed Teacher Onboarding template
DO $$
DECLARE
  flow_id uuid;
  step_0_id uuid;
  step_1_id uuid;
  step_2_id uuid;
  step_3_id uuid;
  step_4_id uuid;
  step_5_id uuid;
  step_6_id uuid;
  step_7_id uuid;
  step_8_id uuid;
  step_9_id uuid;
  step_10_id uuid;
  step_11_id uuid;
  step_12_id uuid;
  step_12b_id uuid;
  step_13_id uuid;
  step_14_id uuid;
  step_15_id uuid;
  step_16_id uuid;
  step_17_id uuid;
  step_18_id uuid;
  step_19_id uuid;
  step_20_id uuid;
  step_21_id uuid;
  step_22_id uuid;
BEGIN
  INSERT INTO flows (
    id, name, description, status, display_type,
    modal_dismissible, modal_backdrop,
    trigger_type, frequency, is_template, template_name,
    priority, schema_version,
    conditions
  ) VALUES (
    gen_random_uuid(),
    'Teacher Onboarding',
    'Onboarding flow for certified teachers',
    'active',
    'modal',
    false,
    'blur',
    'login',
    'once',
    true,
    'teacher_onboarding',
    99,
    1,
    '[{"type":"role","operator":"equals","value":"teacher"},{"type":"onboarding_status","operator":"equals","value":"incomplete"}]'::jsonb
  ) RETURNING id INTO flow_id;

  -- Step 0: Your Designation
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 0, 'Your Designation',
    '[{"type":"info_text","element_key":"intro_info","label":"Your Designation","content":"You''ve selected the Certified Teacher designation. You''re registering as a qualified teacher of Yoga, Meditation or Ayurveda. Once your registration is verified, you''ll have the option to register a School, add other Teaching Designations, and upgrade to Experienced Teacher status.","required":false}]'::jsonb,
    '[]'::jsonb,
    1
  ) RETURNING id INTO step_0_id;

  -- Step 1: Full Legal Name
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 1, 'Full Legal Name',
    '[{"type":"short_text","element_key":"first_name","label":"First and Middle Name","required":true,"help_text":null},{"type":"short_text","element_key":"last_name","label":"Last Name","required":true,"help_text":null}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"first_name":"first_name","last_name":"last_name"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_1_id;

  -- Step 2: Email
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 2, 'Email',
    '[{"type":"short_text","element_key":"email","label":"Email Address","required":true,"help_text":null}]'::jsonb,
    '[]'::jsonb,
    1
  ) RETURNING id INTO step_2_id;

  -- Step 3: Create Your Username
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 3, 'Create Your Username',
    '[{"type":"info_text","element_key":"username_rules","label":"Username Rules","content":"Do NOT use @ symbol. Minimum 5 characters, maximum 20. Make it distinctive and personal.","required":false},{"type":"short_text","element_key":"username","label":"Username","required":true,"help_text":"Choose a unique username for your GOYA profile (similar to a social media handle)."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"username":"username"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_3_id;

  -- Step 4: How do you teach?
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 4, 'How do you teach?',
    '[{"type":"single_choice","element_key":"practice_format","label":"Practice Format","required":true,"help_text":null,"options":[{"label":"Online","value":"online"},{"label":"In-Person","value":"in_person"},{"label":"Hybrid (Online & In-Person)","value":"hybrid"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"practice_format":"practice_format"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_4_id;

  -- Step 5: Your Profile Picture
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 5, 'Your Profile Picture',
    '[{"type":"image_upload","element_key":"avatar_url","label":"Profile Picture","required":true,"help_text":"Upload a profile picture. This will appear in our Public Directory. Every profile must include a clear, recent photo of the member."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"avatar_url":"avatar_url"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_5_id;

  -- Step 6: Teacher Status
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 6, 'Teacher Status',
    '[{"type":"single_choice","element_key":"teacher_status","label":"Teacher Status","required":true,"help_text":"Select the designation that best reflects your certification.","options":[{"label":"GOYA CYT200 (200 Hour)","value":"GOYA CYT200"},{"label":"GOYA CYT500 (500 Hour)","value":"GOYA CYT500"},{"label":"GOYA CCYT (Children''s)","value":"GOYA CCYT"},{"label":"GOYA CPYT (Prenatal)","value":"GOYA CPYT"},{"label":"GOYA CRYT (Restorative)","value":"GOYA CRYT"},{"label":"GOYA CYYT (Yin)","value":"GOYA CYYT"},{"label":"GOYA CAYT (Ayurveda)","value":"GOYA CAYT"},{"label":"GOYA CMT (Meditation)","value":"GOYA CMT"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"teacher_status":"teacher_status"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_6_id;

  -- Step 7: Other Organization Membership (BRANCH: true->8, false->11)
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 7, 'Other Organization Membership',
    '[{"type":"single_choice","element_key":"other_org_member","label":"Member of Another Organization?","required":true,"help_text":"GOYA recognizes memberships with organizations such as Yoga Alliance, Yoga Alliance Professional UK, and others.","options":[{"label":"YES","value":"true"},{"label":"NO","value":"false"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"other_org_member":"other_org_member"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_7_id;

  -- Step 8: Which Organization(s)?
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 8, 'Which Organization(s)?',
    '[{"type":"multi_choice","element_key":"other_org_names","label":"Organizations","required":true,"help_text":"Choose all that apply.","options":[{"label":"Yoga Alliance","value":"Yoga Alliance"},{"label":"Yoga Alliance Professional UK","value":"Yoga Alliance Professional UK"},{"label":"Yoga Alliance International","value":"Yoga Alliance International"},{"label":"International Association of Yoga Therapists","value":"International Association of Yoga Therapists"},{"label":"American Yoga Council","value":"American Yoga Council"},{"label":"Other","value":"Other"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"other_org_names":"other_org_names"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_8_id;

  -- Step 9: Registration Number
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 9, 'Registration Number',
    '[{"type":"short_text","element_key":"other_org_registration","label":"Registration Number","required":true,"help_text":"If you have more than one, please list just one."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"other_org_registration":"other_org_registration"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_9_id;

  -- Step 10: Other Org Designations
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 10, 'Other Org Designations',
    '[{"type":"short_text","element_key":"other_org_designations","label":"Designation(s)","required":true,"help_text":"For Example: RYT200, RPYT, E-RYT500"}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"other_org_designations":"other_org_designations"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_10_id;

  -- Step 11: Official Certificate? (BRANCH: true->12, false->12b)
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 11, 'Official Certificate?',
    '[{"type":"single_choice","element_key":"certificate_is_official","label":"Is your certificate official?","required":true,"help_text":"GOYA only accepts official certificates issued directly by the school or training program.","options":[{"label":"Yes","value":"true"},{"label":"No","value":"false"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"certificate_is_official":"certificate_is_official"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_11_id;

  -- Step 12: Upload Certificate
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 12, 'Upload Certificate',
    '[{"type":"image_upload","element_key":"certificate_url","label":"School Certificate","required":true,"help_text":"Please upload the official certificate issued by your school. Accepted formats: PDF, JPEG, PNG."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"certificate_url":"certificate_url"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_12_id;

  -- Step 12B: Blocked (dead-end for non-official cert)
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 13, 'Unable to Process Registration',
    '[{"type":"info_text","element_key":"blocked_info","label":"Unable to Process","content":"You have indicated that your certificate is not the official certificate issued by your school. As a result, we are unable to process your registration at this time. Please contact your school directly to obtain the official certificate.","required":false}]'::jsonb,
    '[]'::jsonb,
    1
  ) RETURNING id INTO step_12b_id;

  -- Step 13: Your Introduction
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 14, 'Your Introduction',
    '[{"type":"long_text","element_key":"introduction","label":"Introduction","required":true,"help_text":"Write a short sentence in first person that introduces you to the GOYA community."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"introduction":"introduction"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_13_id;

  -- Step 14: Your Profile Bio
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 15, 'Your Profile Bio',
    '[{"type":"long_text","element_key":"bio","label":"Profile Bio","required":true,"help_text":"Tell your story. Share your background, your journey, your passions and what brings you to GOYA. Minimum 250 characters."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"bio":"bio"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_14_id;

  -- Step 15: Video Introduction
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 16, 'Video Introduction',
    '[{"type":"short_text","element_key":"youtube_intro_url","label":"YouTube Introduction Video","required":false,"help_text":"Add a link to a short introduction video on YouTube. Optional."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"youtube_intro_url":"youtube_intro_url"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_15_id;

  -- Step 16: Years Teaching
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 17, 'Years Teaching',
    '[{"type":"single_choice","element_key":"years_teaching","label":"Years Teaching","required":true,"help_text":null,"options":[{"label":"0-1 years","value":"0-1"},{"label":"1-2 years","value":"1-2"},{"label":"2-3 years","value":"2-3"},{"label":"3-5 years","value":"3-5"},{"label":"5-10 years","value":"5-10"},{"label":"10-15 years","value":"10-15"},{"label":"15-20 years","value":"15-20"},{"label":"20+ years","value":"20+"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"years_teaching":"years_teaching"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_16_id;

  -- Step 17: Teaching Styles
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 18, 'Teaching Styles',
    '[{"type":"multi_choice","element_key":"teaching_styles","label":"Teaching Styles","required":true,"help_text":"Which styles do you teach? Choose up to 5.","options":[{"label":"Hatha Yoga","value":"hatha"},{"label":"Vinyasa Flow","value":"vinyasa"},{"label":"Yin Yoga","value":"yin"},{"label":"Restorative Yoga","value":"restorative"},{"label":"Ashtanga Yoga","value":"ashtanga"},{"label":"Prenatal Yoga","value":"prenatal"},{"label":"Postnatal Yoga","value":"postnatal"},{"label":"Children''s Yoga","value":"childrens"},{"label":"Power Yoga","value":"power"},{"label":"Kundalini Yoga","value":"kundalini"},{"label":"Hot Yoga","value":"hot"},{"label":"Gentle Yoga","value":"gentle"},{"label":"Modern Contemporary Yoga","value":"modern_contemporary"},{"label":"Traditional Lineage Based Yoga","value":"traditional_lineage"},{"label":"Trauma-Informed Yoga","value":"trauma_informed"},{"label":"Iyengar Yoga","value":"iyengar"},{"label":"Somatic Yoga","value":"somatic"},{"label":"Chair Yoga","value":"chair"},{"label":"Aerial Yoga","value":"aerial"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"teaching_styles":"teaching_styles"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_17_id;

  -- Step 18: Teaching Focus
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 19, 'Teaching Focus',
    '[{"type":"multi_choice","element_key":"teaching_focus","label":"Teaching Focus","required":true,"help_text":null,"options":[{"label":"Strength & Stability","value":"strength_stability"},{"label":"Flexibility & Mobility","value":"flexibility_mobility"},{"label":"Balance & Coordination","value":"balance_coordination"},{"label":"Relaxation & Stress Relief","value":"relaxation_stress"},{"label":"Meditation & Mindfulness","value":"meditation_mindfulness"},{"label":"Traditional Teachings","value":"traditional_teachings"},{"label":"Breath Work","value":"breath_work"},{"label":"Daily Movement & Wellbeing","value":"daily_movement"},{"label":"Restorative & Recovery","value":"restorative_recovery"},{"label":"Energy & Spiritual Exploration","value":"energy_spiritual"},{"label":"Teaching & Skill Development","value":"teaching_skill"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"teaching_focus":"teaching_focus_arr"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_18_id;

  -- Step 19: Influences
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 20, 'Influences',
    '[{"type":"multi_choice","element_key":"influences","label":"Influences","required":true,"help_text":null,"options":[{"label":"Traditional Lineages","value":"traditional_lineages"},{"label":"Eastern Philosophy","value":"eastern_philosophy"},{"label":"Modern Contemporary Yoga Educators","value":"modern_contemporary"},{"label":"Independent Self-Study","value":"independent_self_study"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"influences":"influences_arr"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_19_id;

  -- Step 20: Languages
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 21, 'Languages',
    '[{"type":"multi_choice","element_key":"languages","label":"Languages","required":true,"help_text":"Which languages do you teach in? Select all that apply.","options":[{"label":"English","value":"english"},{"label":"French","value":"french"},{"label":"German","value":"german"},{"label":"Spanish","value":"spanish"},{"label":"Arabic","value":"arabic"},{"label":"Croatian","value":"croatian"},{"label":"Czech","value":"czech"},{"label":"Dutch","value":"dutch"},{"label":"Finnish","value":"finnish"},{"label":"Greek","value":"greek"},{"label":"Hindi","value":"hindi"},{"label":"Italian","value":"italian"},{"label":"Japanese","value":"japanese"},{"label":"Mandarin","value":"mandarin"},{"label":"Polish","value":"polish"},{"label":"Portuguese","value":"portuguese"},{"label":"Slovakian","value":"slovakian"},{"label":"Swedish","value":"swedish"},{"label":"Thai","value":"thai"},{"label":"Ukrainian","value":"ukrainian"},{"label":"Urdu","value":"urdu"},{"label":"Other","value":"other"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"languages":"languages"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_20_id;

  -- Step 21: Social Media
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 22, 'Your Social Media & Website',
    '[{"type":"short_text","element_key":"website","label":"Website or Booking Page","required":false,"help_text":"Add links to help other members find and connect with you. All fields are optional."},{"type":"short_text","element_key":"instagram","label":"Instagram","required":false,"help_text":null},{"type":"short_text","element_key":"facebook","label":"Facebook","required":false,"help_text":null},{"type":"short_text","element_key":"tiktok","label":"TikTok","required":false,"help_text":null},{"type":"short_text","element_key":"youtube","label":"YouTube","required":false,"help_text":null}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"website":"website","instagram":"instagram","facebook":"facebook","tiktok":"tiktok","youtube":"youtube"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_21_id;

  -- Step 22: Complete
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 23, 'Complete',
    '[{"type":"info_text","element_key":"submit_info","label":"Complete Application","content":"Click Next to complete your Certified Teacher application. Our team will review your certificate and verify your account within 3-5 business days.","required":false}]'::jsonb,
    '[{"type":"mark_complete","config":{}}]'::jsonb,
    1
  ) RETURNING id INTO step_22_id;

  -- BRANCHES for Teacher template
  -- Step 7 (other_org_member): "true" -> Step 8, "false" -> Step 11
  INSERT INTO flow_branches (id, step_id, element_key, answer_value, target_step_id)
  VALUES (gen_random_uuid(), step_7_id, 'other_org_member', 'true', step_8_id);
  INSERT INTO flow_branches (id, step_id, element_key, answer_value, target_step_id)
  VALUES (gen_random_uuid(), step_7_id, 'other_org_member', 'false', step_11_id);

  -- Step 11 (certificate_is_official): "true" -> Step 12, "false" -> Step 12B
  INSERT INTO flow_branches (id, step_id, element_key, answer_value, target_step_id)
  VALUES (gen_random_uuid(), step_11_id, 'certificate_is_official', 'true', step_12_id);
  INSERT INTO flow_branches (id, step_id, element_key, answer_value, target_step_id)
  VALUES (gen_random_uuid(), step_11_id, 'certificate_is_official', 'false', step_12b_id);

END $$;

-- E) Seed Wellness Practitioner Onboarding template
DO $$
DECLARE
  flow_id uuid;
  step_0_id uuid;
  step_1_id uuid;
  step_2_id uuid;
  step_3_id uuid;
  step_4_id uuid;
  step_5_id uuid;
  step_6_id uuid;
  step_7_id uuid;
  step_8_id uuid;
  step_9_id uuid;
  step_10_id uuid;
  step_11_id uuid;
  step_12_id uuid;
  step_13_id uuid;
  step_14_id uuid;
  step_15_id uuid;
BEGIN
  INSERT INTO flows (
    id, name, description, status, display_type,
    modal_dismissible, modal_backdrop,
    trigger_type, frequency, is_template, template_name,
    priority, schema_version,
    conditions
  ) VALUES (
    gen_random_uuid(),
    'Wellness Practitioner Onboarding',
    'Onboarding flow for wellness practitioners',
    'active',
    'modal',
    false,
    'blur',
    'login',
    'once',
    true,
    'wellness_onboarding',
    98,
    1,
    '[{"type":"role","operator":"equals","value":"wellness_practitioner"},{"type":"onboarding_status","operator":"equals","value":"incomplete"}]'::jsonb
  ) RETURNING id INTO flow_id;

  -- Step 0: Your Designation
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 0, 'Your Designation',
    '[{"type":"info_text","element_key":"intro_info","label":"Your Designation","content":"You have selected the Wellness Practitioner designation. You are registering as a qualified wellness professional. Once your registration is verified, you will be listed in our Wellness directory.","required":false}]'::jsonb,
    '[]'::jsonb,
    1
  ) RETURNING id INTO step_0_id;

  -- Step 1: Full Legal Name
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 1, 'Full Legal Name',
    '[{"type":"short_text","element_key":"first_name","label":"First and Middle Name","required":true,"help_text":null},{"type":"short_text","element_key":"last_name","label":"Last Name","required":true,"help_text":null}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"first_name":"first_name","last_name":"last_name"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_1_id;

  -- Step 2: Email
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 2, 'Email',
    '[{"type":"short_text","element_key":"email","label":"Email Address","required":true,"help_text":null}]'::jsonb,
    '[]'::jsonb,
    1
  ) RETURNING id INTO step_2_id;

  -- Step 3: Create Your Username
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 3, 'Create Your Username',
    '[{"type":"info_text","element_key":"username_rules","label":"Username Rules","content":"Do NOT use @ symbol. Minimum 5 characters, maximum 20. Make it distinctive and personal.","required":false},{"type":"short_text","element_key":"username","label":"Username","required":true,"help_text":"Choose a unique username for your GOYA profile (similar to a social media handle)."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"username":"username"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_3_id;

  -- Step 4: How do you work with clients?
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 4, 'How do you work with clients?',
    '[{"type":"single_choice","element_key":"practice_format","label":"Practice Format","required":true,"help_text":null,"options":[{"label":"Online","value":"online"},{"label":"In-Person","value":"in_person"},{"label":"Hybrid (Online & In-Person)","value":"hybrid"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"practice_format":"practice_format"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_4_id;

  -- Step 5: Organization Name
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 5, 'Organization Name',
    '[{"type":"short_text","element_key":"wellness_org_name","label":"Organization Name","required":false,"help_text":"Leave blank if you practice independently."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"wellness_org_name":"wellness_org_name"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_5_id;

  -- Step 6: Practitioner Designations
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 6, 'Practitioner Designations',
    '[{"type":"multi_choice","element_key":"wellness_designations","label":"Practitioner Designations","required":true,"help_text":null,"options":[{"label":"Massage Therapist","value":"Massage Therapist"},{"label":"Acupuncturist","value":"Acupuncturist"},{"label":"Naturopath","value":"Naturopath"},{"label":"Dietician","value":"Dietician"},{"label":"Psychologist","value":"Psychologist"},{"label":"Psychotherapist","value":"Psychotherapist"},{"label":"Yoga Therapist","value":"Yoga Therapist"},{"label":"Nurse Practitioner","value":"Nurse Practitioner"},{"label":"Reiki Master","value":"Reiki Master"},{"label":"Chiropractor","value":"Chiropractor"},{"label":"Cranio-Sacral Therapist","value":"Cranio-Sacral Therapist"},{"label":"Counsellor","value":"Counsellor"},{"label":"Herbalist","value":"Herbalist"},{"label":"TCM Practitioner","value":"TCM Practitioner"},{"label":"Osteopath","value":"Osteopath"},{"label":"Other","value":"Other"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"wellness_designations":"wellness_designations"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_6_id;

  -- Step 7: Regulatory Body? (BRANCH: true->8, false->9)
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 7, 'Regulatory Body?',
    '[{"type":"single_choice","element_key":"wellness_regulatory_body","label":"Are you regulated by a professional body?","required":true,"help_text":null,"options":[{"label":"YES","value":"true"},{"label":"NO","value":"false"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"wellness_regulatory_body":"wellness_regulatory_body"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_7_id;

  -- Step 8: Regulatory Designations (conditional on regulatory_body=true)
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 8, 'Regulatory Designations',
    '[{"type":"short_text","element_key":"wellness_regulatory_designations","label":"Regulatory Designations","required":true,"help_text":"For Example: RMT, NP"}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"wellness_regulatory_designations":"wellness_regulatory_designations"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_8_id;

  -- Step 9: Upload Certificate
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 9, 'Upload Certificate',
    '[{"type":"image_upload","element_key":"certificate_url","label":"License or Certificate","required":false,"help_text":"Please upload your professional license or certificate."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"certificate_url":"certificate_url"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_9_id;

  -- Step 10: Your Profile Picture
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 10, 'Your Profile Picture',
    '[{"type":"image_upload","element_key":"avatar_url","label":"Profile Picture","required":true,"help_text":"Upload a profile picture. This will appear in our Public Directory. Every profile must include a clear, recent photo of the member."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"avatar_url":"avatar_url"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_10_id;

  -- Step 11: Your Wellness Journey
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 11, 'Your Wellness Journey',
    '[{"type":"long_text","element_key":"bio","label":"Your Wellness Journey","required":true,"help_text":"Tell your story. Share your background, your journey, your specialities and what brings you to GOYA. Minimum 250 characters."}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"bio":"bio"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_11_id;

  -- Step 12: Wellness Focus
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 12, 'Wellness Focus',
    '[{"type":"multi_choice","element_key":"wellness_focus","label":"Wellness Focus","required":true,"help_text":null,"options":[{"label":"Stress & Anxiety Relief","value":"stress_anxiety"},{"label":"Pain Management & Rehabilitation","value":"pain_rehabilitation"},{"label":"Mental Health & Emotional Wellbeing","value":"mental_emotional"},{"label":"Nutrition & Lifestyle","value":"nutrition_lifestyle"},{"label":"Energy & Spiritual Wellbeing","value":"energy_spiritual"},{"label":"Women''s Health","value":"womens_health"},{"label":"Sports Performance & Recovery","value":"sports_performance"},{"label":"Children & Families","value":"children_families"},{"label":"Chronic Illness Support","value":"chronic_illness"},{"label":"Mindfulness & Meditation","value":"mindfulness_meditation"},{"label":"Other","value":"other"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"wellness_focus":"wellness_focus"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_12_id;

  -- Step 13: Languages
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 13, 'Languages',
    '[{"type":"multi_choice","element_key":"languages","label":"Languages","required":true,"help_text":"Which languages do you work in? Select all that apply.","options":[{"label":"English","value":"english"},{"label":"French","value":"french"},{"label":"German","value":"german"},{"label":"Spanish","value":"spanish"},{"label":"Arabic","value":"arabic"},{"label":"Croatian","value":"croatian"},{"label":"Czech","value":"czech"},{"label":"Dutch","value":"dutch"},{"label":"Finnish","value":"finnish"},{"label":"Greek","value":"greek"},{"label":"Hindi","value":"hindi"},{"label":"Italian","value":"italian"},{"label":"Japanese","value":"japanese"},{"label":"Mandarin","value":"mandarin"},{"label":"Polish","value":"polish"},{"label":"Portuguese","value":"portuguese"},{"label":"Slovakian","value":"slovakian"},{"label":"Swedish","value":"swedish"},{"label":"Thai","value":"thai"},{"label":"Ukrainian","value":"ukrainian"},{"label":"Urdu","value":"urdu"},{"label":"Other","value":"other"}]}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"languages":"languages"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_13_id;

  -- Step 14: Social Media
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 14, 'Your Social Media & Website',
    '[{"type":"short_text","element_key":"website","label":"Website or Booking Page","required":false,"help_text":"Add links to help other members find and connect with you. All fields are optional."},{"type":"short_text","element_key":"instagram","label":"Instagram","required":false,"help_text":null},{"type":"short_text","element_key":"facebook","label":"Facebook","required":false,"help_text":null},{"type":"short_text","element_key":"tiktok","label":"TikTok","required":false,"help_text":null},{"type":"short_text","element_key":"youtube","label":"YouTube","required":false,"help_text":null}]'::jsonb,
    '[{"type":"save_to_profile","config":{"mappings":{"website":"website","instagram":"instagram","facebook":"facebook","tiktok":"tiktok","youtube":"youtube"}}}]'::jsonb,
    1
  ) RETURNING id INTO step_14_id;

  -- Step 15: Complete
  INSERT INTO flow_steps (id, flow_id, position, title, elements, actions, schema_version)
  VALUES (
    gen_random_uuid(), flow_id, 15, 'Complete',
    '[{"type":"info_text","element_key":"submit_info","label":"Complete Application","content":"Click Next to complete your Wellness Practitioner application. Our team will review your credentials and verify your account within 3-5 business days.","required":false}]'::jsonb,
    '[{"type":"mark_complete","config":{}}]'::jsonb,
    1
  ) RETURNING id INTO step_15_id;

  -- BRANCHES for Wellness template
  -- Step 7 (wellness_regulatory_body): "true" -> Step 8, "false" -> Step 9
  INSERT INTO flow_branches (id, step_id, element_key, answer_value, target_step_id)
  VALUES (gen_random_uuid(), step_7_id, 'wellness_regulatory_body', 'true', step_8_id);
  INSERT INTO flow_branches (id, step_id, element_key, answer_value, target_step_id)
  VALUES (gen_random_uuid(), step_7_id, 'wellness_regulatory_body', 'false', step_9_id);

END $$;
