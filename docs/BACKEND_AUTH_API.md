# 后端认证 API 文档

## 🎯 已实现的功能

### 1. 认证中间件
- ✅ `app/auth.py` - JWT token 验证
- ✅ `require_auth` 装饰器 - 保护需要认证的路由
- ✅ `optional_auth` 装饰器 - 可选认证的路由

### 2. 认证 API 路由

#### **POST /api/auth/register** - 用户注册
```json
// Request
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "User Name"  // 可选
}

// Response (200)
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  },
  "message": "Registration successful"
}
```

#### **POST /api/auth/login** - 用户登录
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response (200)
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "user_metadata": {}
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  },
  "message": "Login successful"
}
```

#### **POST /api/auth/logout** - 用户登出
```json
// Response (200)
{
  "success": true,
  "message": "Logout successful"
}
```

#### **GET /api/auth/me** - 获取当前用户信息（需要认证）
```bash
# Header
Authorization: Bearer {access_token}

# Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {}
  }
}
```

### 3. 行程 API（已更新为需要认证）

#### **POST /api/itinerary/save** - 保存行程（需要认证）
```bash
# Header
Authorization: Bearer {access_token}

# Request
{
  "title": "上海三日游",
  "destination": "上海",
  "start_date": "2025-11-15",
  "end_date": "2025-11-17",
  "budget": 5000,
  "people_count": 2,
  "preferences": {},  // 可选
  "ai_response": {}   // 可选
}

# Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "上海三日游",
    ...
  }
}
```

#### **GET /api/itinerary/list** - 获取行程列表（需要认证）
```bash
# Header
Authorization: Bearer {access_token}

# Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "上海三日游",
      "destination": "上海",
      ...
    }
  ]
}
```

#### **POST /api/itinerary/generate** - 生成行程（不需要认证）
保持原样，不需要认证即可生成行程预览

#### **GET /api/itinerary/:id** - 获取单个行程（不需要认证）
保持原样

#### **DELETE /api/itinerary/:id** - 删除行程（未加认证，待完善）

---

## 🔐 认证流程

### 前端使用流程

1. **注册/登录**
   ```typescript
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password })
   });
   const { data } = await response.json();
   const accessToken = data.session.access_token;
   ```

2. **保存 Token**
   ```typescript
   // 保存到 localStorage
   localStorage.setItem('access_token', accessToken);
   localStorage.setItem('refresh_token', refreshToken);
   ```

3. **使用 Token 调用 API**
   ```typescript
   const response = await fetch('/api/itinerary/save', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${accessToken}`
     },
     body: JSON.stringify(itineraryData)
   });
   ```

4. **检查认证状态**
   ```typescript
   const response = await fetch('/api/auth/me', {
     headers: {
       'Authorization': `Bearer ${accessToken}`
     }
   });
   ```

---

## 🚨 错误处理

### 401 Unauthorized - 未授权
```json
{
  "success": false,
  "error": "Missing Authorization header"
  // 或 "Invalid or expired token"
  // 或 "Invalid credentials"
}
```

### 400 Bad Request - 请求错误
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

### 500 Internal Server Error - 服务器错误
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 📝 注意事项

1. **Supabase 邮箱验证**
   - 默认情况下，Supabase 要求邮箱验证
   - 可以在 Supabase Dashboard → Authentication → Email 中禁用
   - 或者直接在控制台创建测试用户

2. **Token 过期**
   - Access token 有过期时间（通常 1 小时）
   - 前端需要处理 token 刷新逻辑
   - 可以使用 refresh_token 刷新 access_token

3. **安全性**
   - 后端使用 service_role_key，绕过 RLS
   - 前端应该使用 anon_key
   - Token 验证在后端进行

---

## 🔧 待完善功能

1. **Token 刷新**
   - 实现 `/api/auth/refresh` 端点
   - 使用 refresh_token 获取新的 access_token

2. **密码重置**
   - 实现忘记密码功能
   - 邮件发送重置链接

3. **用户资料管理**
   - 更新用户资料
   - 修改密码

4. **行程权限**
   - 检查用户是否有权限访问/修改行程
   - 实现行程分享功能

---

**创建日期**: 2025-11-08
**最后更新**: 2025-11-08
**维护者**: AI Travel Planner Team
