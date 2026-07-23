-- Tighten beta_feedback INSERT policy: replace always-true WITH CHECK with sanity constraints.
DROP POLICY IF EXISTS "Anyone can submit beta feedback" ON public.beta_feedback;

CREATE POLICY "Anyone can submit beta feedback"
ON public.beta_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  message IS NOT NULL
  AND length(trim(message)) > 0
  AND length(message) <= 5000
  AND (tester_name IS NULL OR length(tester_name) <= 200)
  AND (rating IS NULL OR (rating BETWEEN 1 AND 5))
);

-- No SELECT/UPDATE/DELETE policies exist for anon/authenticated on beta_feedback,
-- so reads remain restricted to service_role (used by feedback-digest / feedback-notify).