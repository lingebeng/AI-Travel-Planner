-- ========================================
-- AI Travel Planner - Supabase 数据库初始化脚本
-- ========================================
-- 执行此脚本前，请确保已在 Supabase 控制台创建项目
-- 执行方式：在 Supabase Dashboard -> SQL Editor 中粘贴并执行

-- ========================================
-- 1. 启用必要的扩展
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 2. 创建 profiles 表（扩展用户信息）
-- ========================================
-- 用于存储额外的用户资料信息
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的资料
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- 创建 RLS 策略：用户只能插入自己的资料
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 创建 RLS 策略：用户只能更新自己的资料
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. 创建 itineraries 表（行程表）
-- ========================================
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10, 2),
    people_count INTEGER DEFAULT 1,
    preferences JSONB DEFAULT '{}'::jsonb,  -- 用户偏好（JSON格式）
    ai_response JSONB DEFAULT '{}'::jsonb,  -- AI生成的完整行程数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 添加约束
    CONSTRAINT valid_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
    CONSTRAINT valid_budget CHECK (budget IS NULL OR budget >= 0),
    CONSTRAINT valid_people_count CHECK (people_count > 0)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS itineraries_created_at_idx ON public.itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS itineraries_destination_idx ON public.itineraries(destination);

-- 启用 RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的行程
DROP POLICY IF EXISTS "Users can view own itineraries" ON public.itineraries;
CREATE POLICY "Users can view own itineraries"
    ON public.itineraries FOR SELECT
    USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能插入自己的行程
DROP POLICY IF EXISTS "Users can insert own itineraries" ON public.itineraries;
CREATE POLICY "Users can insert own itineraries"
    ON public.itineraries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能更新自己的行程
DROP POLICY IF EXISTS "Users can update own itineraries" ON public.itineraries;
CREATE POLICY "Users can update own itineraries"
    ON public.itineraries FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能删除自己的行程
DROP POLICY IF EXISTS "Users can delete own itineraries" ON public.itineraries;
CREATE POLICY "Users can delete own itineraries"
    ON public.itineraries FOR DELETE
    USING (auth.uid() = user_id);

-- 创建触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON public.itineraries;
CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. 创建 expenses 表（费用记录表 - 可选功能）
-- ========================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,  -- 费用类别：交通、住宿、餐饮、景点、购物、其他
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    voice_input BOOLEAN DEFAULT FALSE,  -- 是否通过语音输入
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 添加约束
    CONSTRAINT valid_amount CHECK (amount >= 0),
    CONSTRAINT valid_category CHECK (category IN ('交通', '住宿', '餐饮', '景点', '购物', '其他'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS expenses_itinerary_id_idx ON public.expenses(itinerary_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses(category);

-- 启用 RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的费用记录
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses"
    ON public.expenses FOR SELECT
    USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能插入自己的费用记录
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能更新自己的费用记录
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses"
    ON public.expenses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能删除自己的费用记录
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses"
    ON public.expenses FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- 5. 创建视图：行程统计
-- ========================================
CREATE OR REPLACE VIEW public.itinerary_statistics AS
SELECT
    i.id AS itinerary_id,
    i.user_id,
    i.title,
    i.destination,
    i.budget,
    COUNT(e.id) AS expense_count,
    COALESCE(SUM(e.amount), 0) AS total_spent,
    i.budget - COALESCE(SUM(e.amount), 0) AS remaining_budget
FROM
    public.itineraries i
LEFT JOIN
    public.expenses e ON i.id = e.itinerary_id
GROUP BY
    i.id, i.user_id, i.title, i.destination, i.budget;

-- ========================================
-- 6. 创建函数：自动创建用户资料
-- ========================================
-- 当新用户注册时，自动在 profiles 表创建记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,  -- 使用 email 作为默认 username
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：新用户注册时自动创建资料
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 7. 插入测试数据（可选）
-- ========================================
-- 注意：这些测试数据需要有效的 user_id
-- 在实际使用时，应该通过应用程序插入数据

-- ========================================
-- 8. 创建存储过程：获取用户行程统计
-- ========================================
CREATE OR REPLACE FUNCTION public.get_user_itinerary_stats(p_user_id UUID)
RETURNS TABLE (
    total_itineraries INTEGER,
    total_destinations INTEGER,
    total_budget DECIMAL,
    total_spent DECIMAL,
    upcoming_trips INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT i.id)::INTEGER AS total_itineraries,
        COUNT(DISTINCT i.destination)::INTEGER AS total_destinations,
        COALESCE(SUM(i.budget), 0) AS total_budget,
        COALESCE(SUM(e.amount), 0) AS total_spent,
        COUNT(DISTINCT CASE WHEN i.start_date >= CURRENT_DATE THEN i.id END)::INTEGER AS upcoming_trips
    FROM
        public.itineraries i
    LEFT JOIN
        public.expenses e ON i.id = e.itinerary_id
    WHERE
        i.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 9. 创建存储过程：获取行程详细信息（包含费用统计）
-- ========================================
CREATE OR REPLACE FUNCTION public.get_itinerary_details(p_itinerary_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    destination TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL,
    total_spent DECIMAL,
    expense_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.title,
        i.destination,
        i.start_date,
        i.end_date,
        i.budget,
        COALESCE(SUM(e.amount), 0) AS total_spent,
        jsonb_object_agg(
            COALESCE(e.category, '未分类'),
            COALESCE(SUM(e.amount), 0)
        ) AS expense_breakdown
    FROM
        public.itineraries i
    LEFT JOIN
        public.expenses e ON i.id = e.itinerary_id
    WHERE
        i.id = p_itinerary_id
    GROUP BY
        i.id, i.title, i.destination, i.start_date, i.end_date, i.budget;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 10. 完成提示
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Supabase 数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建的表:';
    RAISE NOTICE '  - profiles (用户资料表)';
    RAISE NOTICE '  - itineraries (行程表)';
    RAISE NOTICE '  - expenses (费用记录表)';
    RAISE NOTICE '';
    RAISE NOTICE '已创建的视图:';
    RAISE NOTICE '  - itinerary_statistics';
    RAISE NOTICE '';
    RAISE NOTICE '已创建的函数:';
    RAISE NOTICE '  - handle_new_user()';
    RAISE NOTICE '  - get_user_itinerary_stats()';
    RAISE NOTICE '  - get_itinerary_details()';
    RAISE NOTICE '';
    RAISE NOTICE '所有表已启用 Row Level Security (RLS)';
    RAISE NOTICE '========================================';
END $$;
