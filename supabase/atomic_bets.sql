-- 1. FIX DATA: Reset negative balances to 0 to satisfy upcoming constraints
UPDATE public.users SET bankroll = 0 WHERE bankroll < 0;
UPDATE public.tournament_entries SET current_stack = 0 WHERE current_stack < 0;

-- 2. ADD CONSTRAINTS: Prevent future negative balances
ALTER TABLE public.users ADD CONSTRAINT users_bankroll_check CHECK (bankroll >= 0);
ALTER TABLE public.tournament_entries ADD CONSTRAINT tournament_entries_stack_check CHECK (current_stack >= 0);

-- 3. RPC: Atomic Single Bet
CREATE OR REPLACE FUNCTION place_bet(
  p_user_id UUID,
  p_prediction_id UUID,
  p_side TEXT,
  p_wager NUMERIC,
  p_multiplier NUMERIC,
  p_tournament_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  -- Validate Wager
  IF p_wager <= 0 THEN
    RETURN jsonb_build_object('error', 'Wager must be positive');
  END IF;

  IF p_tournament_id IS NOT NULL THEN
    -- Tournament Context
    SELECT current_stack INTO v_balance FROM tournament_entries 
    WHERE user_id = p_user_id AND tournament_id = p_tournament_id FOR UPDATE;
    
    IF v_balance IS NULL THEN RETURN jsonb_build_object('error', 'Not entered in tournament'); END IF;
    IF v_balance < p_wager THEN RETURN jsonb_build_object('error', 'Insufficient tournament chips'); END IF;

    UPDATE tournament_entries SET current_stack = current_stack - p_wager 
    WHERE user_id = p_user_id AND tournament_id = p_tournament_id;
  ELSE
    -- specific Cash Context
    SELECT bankroll INTO v_balance FROM users WHERE id = p_user_id FOR UPDATE;
    
    IF v_balance IS NULL THEN RETURN jsonb_build_object('error', 'User not found'); END IF;
    IF v_balance < p_wager THEN RETURN jsonb_build_object('error', 'Insufficient funds'); END IF;

    UPDATE users SET bankroll = bankroll - p_wager WHERE id = p_user_id;
  END IF;

  -- Insert Vote
  INSERT INTO votes (user_id, prediction_id, side, wager, payout_multiplier, tournament_id)
  VALUES (p_user_id, p_prediction_id, p_side, p_wager, p_multiplier, p_tournament_id);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Atomic Bundle Bet
CREATE OR REPLACE FUNCTION place_bundle(
  p_user_id UUID,
  p_wager NUMERIC,
  p_total_multiplier NUMERIC,
  p_legs JSONB, -- Array of objects: [{prediction_id, side, multiplier}]
  p_tournament_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC;
  v_bundle_id UUID;
  v_leg JSONB;
BEGIN
  -- Validate Wager
  IF p_wager <= 0 THEN
    RETURN jsonb_build_object('error', 'Wager must be positive');
  END IF;

  IF p_tournament_id IS NOT NULL THEN
    -- Tournament Context
    SELECT current_stack INTO v_balance FROM tournament_entries 
    WHERE user_id = p_user_id AND tournament_id = p_tournament_id FOR UPDATE;
    
    IF v_balance IS NULL THEN RETURN jsonb_build_object('error', 'Not entered in tournament'); END IF;
    IF v_balance < p_wager THEN RETURN jsonb_build_object('error', 'Insufficient tournament chips'); END IF;

    UPDATE tournament_entries SET current_stack = current_stack - p_wager 
    WHERE user_id = p_user_id AND tournament_id = p_tournament_id;
  ELSE
    -- Cash Context
    SELECT bankroll INTO v_balance FROM users WHERE id = p_user_id FOR UPDATE;
    
    IF v_balance IS NULL THEN RETURN jsonb_build_object('error', 'User not found'); END IF;
    IF v_balance < p_wager THEN RETURN jsonb_build_object('error', 'Insufficient funds'); END IF;

    UPDATE users SET bankroll = bankroll - p_wager WHERE id = p_user_id;
  END IF;

  -- Create Bundle
  INSERT INTO bundles (user_id, wager, total_multiplier, status, tournament_id)
  VALUES (p_user_id, p_wager, p_total_multiplier, 'PENDING', p_tournament_id)
  RETURNING id INTO v_bundle_id;

  -- Create Legs
  FOR v_leg IN SELECT * FROM jsonb_array_elements(p_legs)
  LOOP
    INSERT INTO bundle_legs (bundle_id, prediction_id, side, multiplier)
    VALUES (
      v_bundle_id, 
      (v_leg->>'prediction_id')::UUID, 
      v_leg->>'side', 
      (v_leg->>'multiplier')::NUMERIC
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'bundle_id', v_bundle_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
