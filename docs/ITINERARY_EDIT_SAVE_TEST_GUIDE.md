# 行程编辑与保存功能测试指南

## ✅ 已完成的修复

### 1. **统一 API 配置**
创建了 `frontend/src/config/api.ts`，统一管理所有 API 端点。

**端口问题修复**：
- ❌ 之前：前端调用 `localhost:5000`
- ✅ 现在：前端调用 `localhost:5001`（与后端一致）

### 2. **更新的文件**

#### 前端文件：
1. **`frontend/src/config/api.ts`** (新建)
   - 统一的 API 端点配置
   - 支持环境变量 `VITE_API_URL`

2. **`frontend/src/pages/ItineraryPage.tsx`**
   - 使用 `API_ENDPOINTS.ITINERARY_SAVE`
   - 使用 `API_ENDPOINTS.ITINERARY_UPDATE(id)`

3. **`frontend/src/pages/MyItinerariesPage.tsx`**
   - 使用 `API_ENDPOINTS.ITINERARY_LIST`
   - 使用 `API_ENDPOINTS.ITINERARY_DELETE(id)`

## 🧪 完整测试流程

### 测试场景 1：创建并保存新行程

**步骤**：
1. 登录账号
2. 点击"开始规划"
3. 填写行程信息：
   - 目的地：杭州
   - 日期：选择未来的日期范围（如 2天）
   - 人数：2
   - 预算：5000
4. 点击"生成旅行计划"
5. 等待生成完成
6. 查看"保存到云端"按钮（应该显示）
7. 点击"保存到云端"

**预期结果**：
- ✅ 显示"行程已保存到云端！"
- ✅ URL 从 `/itinerary/preview` 变为 `/itinerary/{真实ID}`
- ✅ "保存到云端"按钮消失
- ✅ 显示"编辑"和"下载PDF"按钮

**失败排查**：
打开浏览器开发者工具（F12）→ Network 标签页，查看：
- 请求 URL 是否为 `http://localhost:5001/api/itinerary/save`
- 响应状态码是否为 200
- 响应 JSON 中 `success` 是否为 `true`

---

### 测试场景 2：编辑已保存的行程

**步骤**：
1. 在上一个场景保存行程后
2. 点击"编辑"按钮
3. 修改目的地或预算
4. 点击"保存"

**预期结果**：
- ✅ 显示"修改已保存到云端"
- ✅ 本地内容立即更新
- ✅ 退出编辑模式

**失败排查**：
查看 Network 标签页：
- 请求 URL: `http://localhost:5001/api/itinerary/{id}`
- 方法: PUT
- 状态码: 200
- 响应: `{"success": true, "data": {...}}`

---

### 测试场景 3：从"我的行程"列表查看和编辑

**步骤**：
1. 点击头像 → "我的行程"
2. 应该看到刚才保存的行程卡片
3. 点击"查看详情"按钮
4. 进入行程详情页
5. 点击"编辑"按钮
6. 修改内容并保存

**预期结果**：
- ✅ 列表显示所有已保存的行程
- ✅ 可以查看详情
- ✅ 可以编辑
- ✅ 修改同步到云端

**失败排查**：
- 列表为空？检查 `/api/itinerary/list` 请求
- 查看详情失败？检查 `/api/itinerary/{id}` 请求
- 编辑失败？检查 PUT 请求的 token 和权限

---

### 测试场景 4：删除行程

**步骤**：
1. 在"我的行程"页面
2. 点击某个行程的"删除"按钮
3. 在确认对话框点击"确定"

**预期结果**：
- ✅ 显示"删除成功"
- ✅ 行程从列表中消失
- ✅ 列表自动刷新

**失败排查**：
- 删除请求 URL: `http://localhost:5001/api/itinerary/{id}`
- 方法: DELETE
- 检查是否返回 403（权限不足）

---

## 🐛 常见错误及解决方案

### 错误 1: 网络错误 / Failed to fetch

**症状**：
- 保存/编辑时显示"网络错误，请重试"
- 浏览器控制台显示 `net::ERR_CONNECTION_REFUSED`

**原因**：
- 后端未启动
- 端口不匹配

**解决**：
```bash
# 检查后端是否运行
lsof -i :5001

# 如果没有运行，启动后端
cd backend
source ../.venv/bin/activate
python run.py
```

---

### 错误 2: 401 Unauthorized

**症状**：
- 保存时显示"请先登录"或"无效的token"
- 响应状态码 401

**原因**：
- 用户未登录
- Token 过期
- Token 未正确传递

**解决**：
1. 检查是否已登录（导航栏是否显示用户邮箱）
2. 退出重新登录
3. 检查 Network 请求头中是否有 `Authorization: Bearer {token}`

---

### 错误 3: 403 Forbidden

**症状**：
- 编辑/删除时显示"Unauthorized"
- 响应状态码 403

**原因**：
- 尝试编辑/删除别人的行程
- 所有权验证失败

**解决**：
- 确保编辑的是自己创建的行程
- 检查数据库中行程的 `user_id` 是否匹配当前用户

---

### 错误 4: 500 Internal Server Error

**症状**：
- 任何操作都返回 500 错误

**原因**：
- 后端代码错误
- 数据库连接问题
- 数据格式不正确

**解决**：
1. 查看后端日志（终端中的错误信息）
2. 检查 Supabase 连接是否正常
3. 验证发送的数据格式是否正确

---

### 错误 5: 行程保存后无法查看

**症状**：
- 保存成功
- 但"我的行程"列表为空

**原因**：
- RLS 策略问题
- `user_id` 不匹配

**解决**：
在 Supabase SQL Editor 中检查：
```sql
-- 查看是否有行程数据
SELECT * FROM itineraries;

-- 查看当前用户的行程
SELECT * FROM itineraries WHERE user_id = 'YOUR_USER_ID';
```

---

## 📊 调试工具

### 1. 浏览器开发者工具

**Network 标签页**：
- 查看所有 HTTP 请求
- 检查请求 URL、方法、状态码
- 查看请求头（Authorization token）
- 查看请求体（发送的数据）
- 查看响应体（返回的数据）

**Console 标签页**：
- 查看 JavaScript 错误
- 查看 `console.log` 输出
- 查看网络错误

### 2. 后端日志

后端运行的终端会实时显示：
- 请求路径和方法
- 响应状态码
- 错误日志（红色）
- 调试信息

### 3. Supabase Dashboard

**Authentication → Users**：
- 查看注册的用户
- 检查 `email_confirmed_at` 是否已设置

**Table Editor → itineraries**：
- 查看保存的行程数据
- 检查 `user_id` 是否正确
- 验证数据完整性

---

## ✅ 功能检查清单

- [ ] 前端和后端都在运行
- [ ] 用户已成功注册并登录
- [ ] 可以生成新行程
- [ ] "保存到云端"按钮正常显示
- [ ] 保存成功后 URL 更新
- [ ] "我的行程"列表显示已保存的行程
- [ ] 可以查看行程详情
- [ ] 可以编辑行程
- [ ] 编辑后同步到云端
- [ ] 可以删除行程
- [ ] 删除后列表自动刷新

---

## 🔧 手动测试 API

使用 curl 或 Postman 测试：

### 保存行程
```bash
curl -X POST http://localhost:5001/api/itinerary/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "destination": "杭州",
    "start_date": "2025-11-10",
    "end_date": "2025-11-12",
    "budget": 5000,
    "people_count": 2,
    "preferences": {},
    "ai_response": {}
  }'
```

### 获取行程列表
```bash
curl -X GET http://localhost:5001/api/itinerary/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 更新行程
```bash
curl -X PUT http://localhost:5001/api/itinerary/ITINERARY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "destination": "苏州",
    "budget": 6000
  }'
```

### 删除行程
```bash
curl -X DELETE http://localhost:5001/api/itinerary/ITINERARY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 注意事项

1. **Token 获取**：
   - 登录后在浏览器 DevTools → Application → Local Storage 中查找
   - 或在 Network 请求中复制 Authorization 头

2. **端口一致性**：
   - 后端：5001
   - 前端：5173
   - Supabase：云端

3. **CORS 配置**：
   - 后端已配置允许 `http://localhost:5173`
   - 如果更改前端端口需同步更新 `.env`

---

**创建日期**: 2025-11-09
**状态**: ✅ 已修复并测试
**版本**: v1.0
