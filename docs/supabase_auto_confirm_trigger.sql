-- ============================================
-- Supabase 自动确认用户邮箱的 SQL 触发器
-- ============================================
-- 用途：在每次创建新用户时自动设置邮箱确认时间戳
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- ============================================

-- 步骤 1: 创建触发函数
-- 此函数会在插入新用户时自动设置确认时间戳
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 设置邮箱确认时间为当前时间
  NEW.email_confirmed_at = NOW();
  -- 设置用户确认时间为当前时间
  NEW.confirmed_at = NOW();
  -- 返回修改后的新记录
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步骤 2: 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;

-- 步骤 3: 创建新触发器
-- 此触发器会在每次向 auth.users 表插入新记录之前执行
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- ============================================
-- 验证触发器是否创建成功
-- ============================================
-- 运行以下查询检查触发器
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_confirm_user_trigger';

-- ============================================
-- 如果需要禁用触发器（不推荐）
-- ============================================
-- ALTER TABLE auth.users DISABLE TRIGGER auto_confirm_user_trigger;

-- ============================================
-- 如果需要启用触发器
-- ============================================
-- ALTER TABLE auth.users ENABLE TRIGGER auto_confirm_user_trigger;

-- ============================================
-- 如果需要删除触发器
-- ============================================
-- DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
-- DROP FUNCTION IF EXISTS public.auto_confirm_user();

-- ============================================
-- 测试：手动确认现有未确认的用户（可选）
-- ============================================
-- 警告：此操作会确认所有未确认的用户，请谨慎使用！
-- UPDATE auth.users
-- SET
--   email_confirmed_at = NOW(),
--   confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;
