CREATE OR REPLACE FUNCTION public.join_tournament_secure(
    p_tournament_id uuid,
    p_user_id uuid
) RETURNS void AS $$
DECLARE
    v_tournament record;
    v_entry_count integer;
    v_user_balance decimal;
    v_existing_entry integer;
BEGIN
    -- 1. Get Tournament Details
    SELECT * INTO v_tournament 
    FROM public.tournaments 
    WHERE id = p_tournament_id;

    IF v_tournament IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;

    IF v_tournament.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Tournament is not active';
    END IF;

    -- 2. Check for Existing Entry
    SELECT COUNT(*) INTO v_existing_entry
    FROM public.tournament_entries
    WHERE tournament_id = p_tournament_id AND user_id = p_user_id;

    IF v_existing_entry > 0 THEN
        RAISE EXCEPTION 'Already entered in this tournament';
    END IF;

    -- 3. Check Player Limit (If max_players is passed as NULL it is treated as unlimited, but here we check against the DB column)
    IF v_tournament.max_players IS NOT NULL THEN
        SELECT COUNT(*) INTO v_entry_count 
        FROM public.tournament_entries 
        WHERE tournament_id = p_tournament_id;

        IF v_entry_count >= v_tournament.max_players THEN
            RAISE EXCEPTION 'Tournament is full';
        END IF;
    END IF;

    -- 4. Check User Balance
    SELECT cash_balance INTO v_user_balance
    FROM public.users
    WHERE id = p_user_id;

    IF v_user_balance < v_tournament.entry_fee THEN
        RAISE EXCEPTION 'Insufficient funds (Required: $%, Available: $%)', v_tournament.entry_fee, v_user_balance;
    END IF;

    -- 5. EXECUTE TRANSACTION
    
    -- Deduct Balance
    UPDATE public.users 
    SET cash_balance = cash_balance - v_tournament.entry_fee
    WHERE id = p_user_id;

    -- Log Transaction
    INSERT INTO public.transactions (
        user_id,
        amount,
        type,
        description,
        reference_id
    ) VALUES (
        p_user_id,
        -v_tournament.entry_fee,
        'BUY_IN',
        'Entry Fee: ' || v_tournament.name,
        p_tournament_id -- Using tournament_id as reference
    );

    -- Create Entry
    INSERT INTO public.tournament_entries (
        tournament_id,
        user_id,
        current_stack
    ) VALUES (
        p_tournament_id,
        p_user_id,
        v_tournament.starting_stack
    );

    -- Update Tournament Pool
    UPDATE public.tournaments
    SET collected_pool = collected_pool + v_tournament.entry_fee
    WHERE id = p_tournament_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
