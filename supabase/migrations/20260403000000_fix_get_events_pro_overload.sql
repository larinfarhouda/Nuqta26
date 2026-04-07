-- Drop the OLD get_events_pro that does NOT have p_country parameter.
-- This resolves the PGRST203 "Could not choose the best candidate function" error
-- caused by two overloaded versions of the same function.
drop function if exists get_events_pro(float, float, float, text, float, float, text, timestamptz, timestamptz, int, int);
