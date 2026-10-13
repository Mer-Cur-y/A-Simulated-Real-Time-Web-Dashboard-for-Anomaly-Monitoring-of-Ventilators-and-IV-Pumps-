-- Activity notes are free-text staff records, not alert lifecycle events.
-- Apply this migration in Supabase SQL Editor if migrations are not managed locally.

ALTER TABLE public.activity_log
  ALTER COLUMN status DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.create_activity_note(
  p_uwid uuid,
  p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_act_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'ต้องเข้าสู่ระบบก่อนบันทึกข้อความ';
  END IF;

  IF p_description IS NULL OR btrim(p_description) = '' THEN
    RAISE EXCEPTION 'กรุณาระบุรายละเอียดการดูแล';
  END IF;

  INSERT INTO public.activity_log (
    action_type,
    description,
    status,
    created_at,
    uid,
    uwid
  )
  VALUES (
    'user_action',
    btrim(p_description),
    NULL,
    now(),
    auth.uid(),
    p_uwid
  )
  RETURNING act_id INTO new_act_id;

  RETURN new_act_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_activity_note(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_activity_note(uuid, text) TO authenticated;

-- Normalize existing staff-created notes so historical entries also have no status.
UPDATE public.activity_log
SET status = NULL
WHERE action_type = 'user_action';
