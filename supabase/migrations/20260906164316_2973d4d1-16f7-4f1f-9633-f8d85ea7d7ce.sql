revoke execute on function public.shadow_outcome_bucket(text)       from anon, authenticated, public;
revoke execute on function public.bump_rate(text, text)             from anon, authenticated, public;
revoke execute on function public.record_shadow(text, text)         from anon, authenticated, public;
revoke execute on function public.record_request(text, text, text) from anon, authenticated, public;
revoke execute on function public.rate_metrics(integer)            from anon, authenticated, public;

grant execute on function public.record_request(text, text, text) to service_role;
grant execute on function public.bump_rate(text, text)             to service_role;
grant execute on function public.record_shadow(text, text)         to service_role;
grant execute on function public.rate_metrics(integer)            to service_role;