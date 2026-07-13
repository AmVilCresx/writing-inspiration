CREATE OR REPLACE FUNCTION public.wi_upsert_entry_tags(rows_json text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
  BEGIN
    INSERT INTO wi_entry_tags (entry_id, tag_id)
    SELECT (r->>'entry_id')::bigint, (r->>'tag_id')::bigint
    FROM json_array_elements(rows_json::json) AS r
    ON CONFLICT (entry_id, tag_id) DO NOTHING;
  END;
  $function$