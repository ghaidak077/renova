-- SPRINT 1: DATABASE HARDENING & SCHEMA MIGRATION

-- 1. Add referral_code and referred_by to users
ALTER TABLE users ADD COLUMN referral_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create an index for quick referral lookups
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- 2. Add offline monetization ledger columns to stores
-- subscription_status: 'trial', 'active', 'suspended'
ALTER TABLE stores ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'trial';
ALTER TABLE stores ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stores ADD COLUMN payment_reference VARCHAR(255);

-- 3. Create commission_ledger table
CREATE TABLE commission_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    amount_syp NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_commission_ledger_user_id ON commission_ledger(user_id);

-- Enable RLS on commission_ledger
ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own commission ledger
CREATE POLICY "Users can view their own commissions."
ON commission_ledger FOR SELECT
USING (auth.uid() = user_id);

-- 4. Drop open RLS policy on analytics_events
DROP POLICY IF EXISTS "Analytics events can be inserted by anyone." ON analytics_events;

-- 5. Write the exact PostgreSQL RPC function for process_manual_payment
CREATE OR REPLACE FUNCTION process_manual_payment(
    p_store_id UUID,
    p_receipt_id VARCHAR,
    p_added_days INT,
    p_payment_amount_syp NUMERIC DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_merchant_user_id UUID;
    v_referred_by UUID;
    v_current_ends_at TIMESTAMP WITH TIME ZONE;
    v_new_ends_at TIMESTAMP WITH TIME ZONE;
    v_commission_amount NUMERIC;
BEGIN
    -- 1. Get the store's user and current subscription end date
    SELECT user_id, subscription_ends_at INTO v_merchant_user_id, v_current_ends_at
    FROM stores
    WHERE id = p_store_id;

    IF v_merchant_user_id IS NULL THEN
        RAISE EXCEPTION 'Store not found';
    END IF;

    -- 2. Calculate new subscription_ends_at
    IF v_current_ends_at IS NULL OR v_current_ends_at < now() THEN
        v_new_ends_at := now() + (p_added_days || ' days')::INTERVAL;
    ELSE
        v_new_ends_at := v_current_ends_at + (p_added_days || ' days')::INTERVAL;
    END IF;

    -- 3. Update the store's subscription
    UPDATE stores
    SET
        subscription_status = 'active',
        subscription_ends_at = v_new_ends_at,
        payment_reference = p_receipt_id,
        updated_at = now()
    WHERE id = p_store_id;

    -- 4. Check for referral and process commission
    -- Get the user who referred this merchant
    SELECT referred_by INTO v_referred_by
    FROM users
    WHERE id = v_merchant_user_id;

    IF v_referred_by IS NOT NULL AND p_payment_amount_syp > 0 THEN
        -- Calculate 5% commission
        v_commission_amount := p_payment_amount_syp * 0.05;

        -- Credit Merchant A's ledger
        INSERT INTO commission_ledger (
            user_id,
            referred_store_id,
            amount_syp,
            status,
            description
        ) VALUES (
            v_referred_by,
            p_store_id,
            v_commission_amount,
            'pending',
            'Referral commission for manual payment receipt ' || p_receipt_id
        );

        -- Extend Merchant A's subscription_ends_at by 30 days
        -- Note: Updating all stores owned by Merchant A
        UPDATE stores
        SET
            subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, now()), now()) + INTERVAL '30 days',
            subscription_status = 'active',
            updated_at = now()
        WHERE user_id = v_referred_by;
    END IF;
END;
$$;
