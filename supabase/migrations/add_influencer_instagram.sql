-- Add instagram_account_id to influencers table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'influencers'
        AND column_name = 'instagram_account_id'
    ) THEN
        ALTER TABLE public.influencers
        ADD COLUMN instagram_account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_influencers_instagram_account_id ON public.influencers(instagram_account_id);
