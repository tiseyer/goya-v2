-- Fix: wrong email was promoted to superuser
-- Revert till@seyer-marketing.de back to admin
UPDATE public.profiles
  SET role = 'admin'
  WHERE email = 'till@seyer-marketing.de'
    AND role = 'superuser';

-- Promote correct account to superuser
UPDATE public.profiles
  SET role = 'superuser'
  WHERE email = 'till.seyer@icloud.com';
