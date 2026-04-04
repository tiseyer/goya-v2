CREATE TABLE IF NOT EXISTS admin_test_user_slots (
  admin_user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  slot_1 uuid REFERENCES profiles(id) ON DELETE SET NULL,
  slot_2 uuid REFERENCES profiles(id) ON DELETE SET NULL,
  slot_3 uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_test_user_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own slots" ON admin_test_user_slots
  FOR ALL USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());
