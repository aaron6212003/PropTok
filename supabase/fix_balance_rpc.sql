-- Create atomic balance increment function
CREATE OR REPLACE FUNCTION increment_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
BEGIN
  UPDATE users
  SET cash_balance = COALESCE(cash_balance, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Ensure we log it if it matters (optional, as we do it in webhook too)
END;
$$;

-- Also create a function for tournament entries just in case
CREATE OR REPLACE FUNCTION join_tournament_atomic(
    p_user_id UUID, 
    p_tournament_id UUID, 
    p_session_id TEXT, 
    p_payment_intent TEXT,
    p_stack INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO tournament_entries (
        tournament_id, 
        user_id, 
        paid, 
        stripe_checkout_session_id, 
        stripe_payment_intent_id, 
        current_stack
    )
    VALUES (
        p_tournament_id, 
        p_user_id, 
        true, 
        p_session_id, 
        p_payment_intent, 
        p_stack
    )
    ON CONFLICT (user_id, tournament_id) 
    DO UPDATE SET 
        paid = true,
        stripe_checkout_session_id = p_session_id,
        stripe_payment_intent_id = p_payment_intent;
END;
$$;
