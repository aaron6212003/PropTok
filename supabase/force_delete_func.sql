-- FORCE DELETE FUNCTION (SECURITY DEFINER)
-- This function runs with the privileges of the creator (superuser)
-- It allows the API to delete a prediction without needing the Service Role Key in the backend

CREATE OR REPLACE FUNCTION delete_prediction_force(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Check if user is authenticated (Optional: Add Admin check here)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Delete the prediction
  -- Because of our ON DELETE CASCADE migration, this deletes everything else too.
  DELETE FROM public.predictions WHERE id = target_id;
END;
$$;
