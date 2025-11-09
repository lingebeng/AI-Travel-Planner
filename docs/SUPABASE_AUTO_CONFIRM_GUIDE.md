# Supabase 邮箱自动确认设置指南

## 问题描述
Supabase 默认要求用户注册后进行邮箱确认，这在开发环境中会导致用户无法立即登录使用。

## 解决方案：SQL 触发器自动确认

### 📋 步骤 1: 登录 Supabase Dashboard

1. 访问：https://supabase.com/dashboard
2. 选择你的项目：`AI Travel Planner`

### 📋 步骤 2: 打开 SQL Editor

1. 在左侧导航栏找到 **SQL Editor**（数据库图标）
2. 点击进入 SQL Editor 页面
3. 点击右上角 **"New query"** 创建新查询

### 📋 步骤 3: 执行 SQL 脚本

复制以下完整 SQL 脚本并粘贴到编辑器中：

```sql
-- ============================================
-- Supabase 自动确认用户邮箱的 SQL 触发器
-- ============================================

-- 步骤 1: 创建触发函数
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
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
```

### 📋 步骤 4: 运行脚本

1. 点击右下角的 **"Run"** 按钮（或按 `Ctrl/Cmd + Enter`）
2. 等待执行完成
3. 看到 **"Success. No rows returned"** 表示执行成功

### 📋 步骤 5: 验证触发器

在 SQL Editor 中运行以下查询来验证触发器是否创建成功：

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_confirm_user_trigger';
```

**预期结果**：
应该返回一行数据，显示触发器的详细信息：
- `trigger_name`: auto_confirm_user_trigger
- `event_manipulation`: INSERT
- `event_object_table`: users
- `action_statement`: EXECUTE FUNCTION public.auto_confirm_user()

### 📋 步骤 6: （可选）确认现有未确认的用户

如果你之前已经创建了一些测试用户但未确认，可以运行以下 SQL 来手动确认它们：

```sql
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

**警告**：此操作会确认所有未确认的用户，请谨慎使用！

## ✅ 测试

### 测试新用户注册

1. 访问你的应用：http://localhost:5173/auth
2. 切换到"注册"标签
3. 填写信息：
   - 邮箱：`newuser@example.com`
   - 密码：`password123`
   - 确认密码：`password123`
4. 点击"注册"

**预期结果**：
- ✅ 注册立即成功
- ✅ 自动登录（有 session）
- ✅ 跳转到首页
- ✅ 导航栏显示用户邮箱
- ✅ 可以立即使用所有功能（保存行程、查看我的行程等）

### 验证数据库

在 Supabase Dashboard 中查看用户：

1. 进入 **Authentication** → **Users**
2. 找到刚注册的用户
3. 检查字段：
   - `email_confirmed_at`: 应该有时间戳（不是 NULL）
   - `confirmed_at`: 应该有时间戳（不是 NULL）

## 🔧 触发器工作原理

```
用户注册流程：

前端 → POST /api/auth/register
  ↓
后端 → supabase.auth.sign_up({email, password})
  ↓
Supabase Auth → INSERT INTO auth.users (...)
  ↓
触发器触发 → BEFORE INSERT
  ↓
auto_confirm_user() 函数执行
  ↓
设置 email_confirmed_at = NOW()
设置 confirmed_at = NOW()
  ↓
用户记录插入完成（已确认状态）
  ↓
返回 session 给前端
  ↓
用户立即登录成功！
```

## 🛠️ 管理触发器

### 禁用触发器（不推荐）
```sql
ALTER TABLE auth.users DISABLE TRIGGER auto_confirm_user_trigger;
```

### 启用触发器
```sql
ALTER TABLE auth.users ENABLE TRIGGER auto_confirm_user_trigger;
```

### 删除触发器
```sql
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user();
```

## 🔒 安全注意事项

### 开发环境 vs 生产环境

**开发环境**（当前设置）：
- ✅ 适合：快速测试，无需邮箱验证
- ⚠️ 任何人都可以注册并立即使用

**生产环境**（推荐）：
- ✅ 删除此触发器
- ✅ 启用邮箱确认
- ✅ 配置邮件服务（SMTP）
- ✅ 增加额外的安全措施（验证码、限流等）

### 迁移到生产环境时

在部署到生产环境前，请执行以下操作：

1. **删除触发器**：
   ```sql
   DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
   DROP FUNCTION IF EXISTS public.auto_confirm_user();
   ```

2. **启用邮箱确认**：
   - 进入 **Authentication** → **Providers** → **Email**
   - 勾选 **"Confirm email"**
   - 配置 SMTP 邮件服务

3. **更新后端代码**：
   - 移除注册后自动登录的逻辑
   - 添加"请查收邮件确认"的提示

## 📝 故障排查

### 问题 1: 触发器创建失败
**错误**: `permission denied for schema auth`

**解决**:
- 确保你使用的是 **Service Role Key**（不是 Anon Key）
- 或者使用 Supabase Dashboard 的 SQL Editor（已有足够权限）

### 问题 2: 触发器不生效
**症状**: 用户注册后仍然显示未确认

**解决**:
1. 检查触发器是否存在：
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'auto_confirm_user_trigger';
   ```

2. 检查触发器是否启用：
   ```sql
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgname = 'auto_confirm_user_trigger';
   ```
   `tgenabled` 应该是 `O`（启用）

3. 重新创建触发器（运行步骤 3 的 SQL）

### 问题 3: 现有用户仍未确认
**解决**: 运行步骤 6 的 UPDATE 语句手动确认

## 📖 相关文档

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [GitHub Issue #5113](https://github.com/supabase/supabase/issues/5113#issuecomment-1183985288)

## ✅ 完成检查清单

- [ ] 已登录 Supabase Dashboard
- [ ] 已打开 SQL Editor
- [ ] 已执行触发器创建脚本
- [ ] 已验证触发器存在
- [ ] 已测试新用户注册
- [ ] 注册后立即登录成功
- [ ] （可选）已确认现有未确认用户

完成以上步骤后，你的应用就可以支持用户立即注册并登录了！🎉
