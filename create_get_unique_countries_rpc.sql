CREATE OR REPLACE FUNCTION get_unique_countries()
RETURNS TABLE (country text)
LANGUAGE sql
AS $$
  SELECT DISTINCT country FROM visitor_logs WHERE country IS NOT NULL ORDER BY country;
$$;
