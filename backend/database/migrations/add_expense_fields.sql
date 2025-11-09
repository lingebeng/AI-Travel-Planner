-- Migration: Add location and payment_method fields to expenses table
-- Created: 2025-11-09
-- Description: Add optional location and payment_method fields for more detailed expense tracking

-- Add location field (optional, for recording where the expense occurred)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add payment_method field (optional, for recording how the expense was paid)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (
    payment_method IS NULL OR
    payment_method IN ('现金', '微信', '支付宝', '银行卡', 'Cash', 'WeChat', 'Alipay', 'Card')
);

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.location IS 'Location where the expense occurred (optional)';
COMMENT ON COLUMN public.expenses.payment_method IS 'Payment method used: 现金/微信/支付宝/银行卡 (optional)';
