CREATE TABLE public.beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tester_name text,
  rating int,
  category text,
  message text,
  page text,
  user_agent text,
  screen_size text,
  app_version text
);

GRANT INSERT ON public.beta_feedback TO anon;
GRANT INSERT ON public.beta_feedback TO authenticated;
GRANT ALL ON public.beta_feedback TO service_role;

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit beta feedback"
  ON public.beta_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
