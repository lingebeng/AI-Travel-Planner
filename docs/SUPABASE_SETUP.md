# Supabase 数据库搭建指南

## 📋 目录

1. [前提条件](#前提条件)
2. [执行 SQL 脚本](#执行-sql-脚本)
3. [数据库结构说明](#数据库结构说明)
4. [测试数据库连接](#测试数据库连接)
5. [常见问题](#常见问题)

---

## 🎯 前提条件

- 已注册 [Supabase](https://supabase.com) 账号
- 已创建项目并获取以下信息：
  - `SUPABASE_URL`: 项目 URL
  - `SUPABASE_KEY`: anon/public key (前端使用)
  - `SUPABASE_SERVICE_KEY`: service role key (后端使用)
- 已配置 `.env` 文件

---

## 🚀 执行 SQL 脚本

### 步骤 1: 打开 Supabase SQL Editor

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目：`AI Travel Planner`
3. 在左侧菜单中点击 **SQL Editor**
4. 点击 **New Query** 创建新查询

### 步骤 2: 复制并执行 SQL 脚本

1. 打开文件：`docs/supabase_init.sql`
2. 复制全部内容（约 300 行）
3. 粘贴到 Supabase SQL Editor 中
4. 点击右下角的 **RUN** 按钮执行

### 步骤 3: 验证执行结果

执行成功后，你应该看到类似以下的输出：

```
========================================
Supabase 数据库初始化完成！
========================================
已创建的表:
  - profiles (用户资料表)
  - itineraries (行程表)
  - expenses (费用记录表)

已创建的视图:
  - itinerary_statistics

已创建的函数:
  - handle_new_user()
  - get_user_itinerary_stats()
  - get_itinerary_details()

所有表已启用 Row Level Security (RLS)
========================================
```

### 步骤 4: 检查表是否创建成功

1. 在左侧菜单中点击 **Table Editor**
2. 你应该看到以下表：
   - `profiles`
   - `itineraries`
   - `expenses`

---

## 📊 数据库结构说明

### 1. `profiles` 表 - 用户资料

扩展 Supabase 自带的 `auth.users` 表，存储额外的用户信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键，关联 auth.users.id |
| username | TEXT | 用户名（唯一） |
| full_name | TEXT | 全名 |
| avatar_url | TEXT | 头像 URL |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**特性**：
- ✅ 启用 RLS：用户只能查看和修改自己的资料
- ✅ 自动触发器：新用户注册时自动创建资料记录
- ✅ 自动更新 `updated_at` 字段

---

### 2. `itineraries` 表 - 行程表

存储用户创建的旅行行程。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID（外键） |
| title | TEXT | 行程标题 |
| destination | TEXT | 目的地 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| budget | DECIMAL | 预算（元） |
| people_count | INTEGER | 出行人数 |
| preferences | JSONB | 用户偏好（JSON 格式） |
| ai_response | JSONB | AI 生成的完整行程数据 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**约束**：
- `start_date <= end_date`
- `budget >= 0`
- `people_count > 0`

**特性**：
- ✅ 启用 RLS：用户只能访问自己的行程
- ✅ 级联删除：删除用户时自动删除关联行程
- ✅ 索引优化：user_id、created_at、destination

**`ai_response` 字段示例**：
```json
{
  "summary": "探索上海的现代与传统...",
  "budget_breakdown": {
    "transportation": 800,
    "accommodation": 1500,
    "food": 1200,
    "attractions": 800,
    "other": 700
  },
  "daily_itinerary": [
    {
      "day": 1,
      "date": "2025-11-10",
      "theme": "外滩与现代上海",
      "items": [
        {
          "time": "09:00",
          "type": "attraction",
          "title": "外滩",
          "description": "欣赏黄浦江两岸的建筑群...",
          "location": "中山东一路",
          "estimated_cost": 0,
          "duration": "2小时"
        }
      ]
    }
  ],
  "tips": ["建议提前预订酒店", "准备舒适的鞋子"]
}
```

---

### 3. `expenses` 表 - 费用记录表

记录旅行过程中的实际花费。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| itinerary_id | UUID | 行程 ID（外键） |
| user_id | UUID | 用户 ID（外键） |
| category | TEXT | 费用类别 |
| amount | DECIMAL | 金额（元） |
| description | TEXT | 描述 |
| expense_date | DATE | 消费日期 |
| voice_input | BOOLEAN | 是否通过语音输入 |
| created_at | TIMESTAMP | 创建时间 |

**费用类别**：
- 交通
- 住宿
- 餐饮
- 景点
- 购物
- 其他

**特性**：
- ✅ 启用 RLS：用户只能访问自己的费用记录
- ✅ 级联删除：删除行程时自动删除关联费用
- ✅ 索引优化：itinerary_id、user_id、expense_date

---

### 4. `itinerary_statistics` 视图 - 行程统计

自动计算每个行程的费用统计。

| 字段名 | 说明 |
|--------|------|
| itinerary_id | 行程 ID |
| user_id | 用户 ID |
| title | 行程标题 |
| destination | 目的地 |
| budget | 预算 |
| expense_count | 费用记录数 |
| total_spent | 总花费 |
| remaining_budget | 剩余预算 |

**使用示例**：
```sql
-- 查看某个用户的所有行程统计
SELECT * FROM itinerary_statistics
WHERE user_id = 'xxx-xxx-xxx';
```

---

### 5. 数据库函数

#### `handle_new_user()` - 自动创建用户资料

当新用户注册时，自动在 `profiles` 表创建记录。

#### `get_user_itinerary_stats(p_user_id UUID)` - 获取用户统计

返回用户的整体旅行统计数据。

**使用示例**：
```sql
SELECT * FROM get_user_itinerary_stats('your-user-id');
```

**返回字段**：
- `total_itineraries`: 总行程数
- `total_destinations`: 去过的目的地数
- `total_budget`: 总预算
- `total_spent`: 总花费
- `upcoming_trips`: 即将到来的行程数

#### `get_itinerary_details(p_itinerary_id UUID)` - 获取行程详情

返回单个行程的详细信息，包括费用分类统计。

**使用示例**：
```sql
SELECT * FROM get_itinerary_details('your-itinerary-id');
```

---

## 🧪 测试数据库连接

### 方法 1: 使用 Supabase Dashboard

1. 在 **Table Editor** 中手动插入测试数据
2. 测试 RLS 策略是否生效

### 方法 2: 使用 Python 测试脚本

创建测试文件 `backend/test_supabase.py`：

```python
#!/usr/bin/env python3
"""测试 Supabase 数据库连接"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# 初始化 Supabase 客户端
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def test_connection():
    """测试数据库连接"""
    print("🔍 测试 Supabase 连接...")

    try:
        # 测试查询 profiles 表
        result = supabase.table("profiles").select("*").limit(1).execute()
        print("✅ 数据库连接成功！")
        print(f"📊 profiles 表记录数: {len(result.data)}")

        # 测试查询 itineraries 表
        result = supabase.table("itineraries").select("*").limit(1).execute()
        print(f"📊 itineraries 表记录数: {len(result.data)}")

        # 测试查询 expenses 表
        result = supabase.table("expenses").select("*").limit(1).execute()
        print(f"📊 expenses 表记录数: {len(result.data)}")

        return True
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return False

if __name__ == "__main__":
    test_connection()
```

运行测试：
```bash
cd backend
source ../.venv/bin/activate
python test_supabase.py
```

### 方法 3: 使用 Postman 测试 API

等后端 API 开发完成后，通过 API 间接测试数据库。

---

## ❓ 常见问题

### Q1: 执行 SQL 时报错 "permission denied"

**原因**：权限不足

**解决方案**：
1. 确保你是项目的 Owner
2. 尝试使用 service role key 连接
3. 检查是否在正确的项目中执行

### Q2: RLS 策略导致无法查询数据

**原因**：Row Level Security 策略阻止了查询

**解决方案**：
1. 使用 service role key（后端）绕过 RLS
2. 确保用户已登录并通过 JWT 认证
3. 临时禁用 RLS 进行测试：
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```

### Q3: 无法插入数据到 profiles 表

**原因**：user_id 不存在于 auth.users 表

**解决方案**：
1. 先通过 Supabase Auth 注册用户
2. 触发器会自动创建 profiles 记录
3. 或手动创建用户后再插入

### Q4: JSONB 字段无法插入数据

**原因**：格式不正确

**解决方案**：
```python
# 正确的 JSONB 插入方式
from json import dumps

data = {
    "preferences": dumps({"budget_level": "medium"}),
    "ai_response": dumps({"summary": "..."})
}
```

### Q5: 如何重置数据库？

**方案 1 - 删除表并重新执行脚本**：
```sql
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS itineraries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
-- 然后重新执行 supabase_init.sql
```

**方案 2 - 清空数据**：
```sql
TRUNCATE TABLE expenses;
TRUNCATE TABLE itineraries CASCADE;
TRUNCATE TABLE profiles CASCADE;
```

---

## 🔐 安全建议

1. **永远不要在前端使用 service role key**
   - 前端只使用 anon key
   - service role key 仅在后端使用

2. **启用 RLS**
   - 所有表都应该启用 RLS
   - 确保用户只能访问自己的数据

3. **API Key 安全**
   - 不要将 API Key 提交到 Git
   - 使用 `.env` 文件管理
   - 确保 `.env` 在 `.gitignore` 中

4. **定期备份**
   - Supabase 提供自动备份
   - 也可以手动导出数据

---

## 📚 参考文档

- [Supabase 官方文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)

---

**创建日期**: 2025-11-08
**最后更新**: 2025-11-08
**维护者**: AI Travel Planner Team
