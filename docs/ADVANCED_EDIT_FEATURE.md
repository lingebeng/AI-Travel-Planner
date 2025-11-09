# 高级编辑功能说明

## 📝 功能概述

新增了两种编辑模式，让用户可以根据需求选择最合适的编辑方式：

1. **简单编辑模式**：编辑基本信息（目的地、预算、日期等）
2. **高级编辑模式**：直接编辑完整的 JSON 数据，包括每日行程、景点详情、预算分配等所有内容

---

## 🎯 使用场景

### 简单编辑模式
适合快速修改基本信息，例如：
- 调整预算
- 修改出行日期
- 更改目的地
- 修改行程亮点描述

### 高级编辑模式
适合需要深度定制的场景，例如：
- 修改每日行程的具体安排
- 调整景点的访问时间
- 修改餐厅推荐
- 调整预算分配比例
- 添加或删除行程项目
- 修改地点坐标
- 完全自定义行程内容

---

## 🔧 使用方法

### 1. 简单编辑模式

**步骤**：
1. 在行程详情页点击 **"简单编辑"** 按钮
2. 在表单中修改需要更改的字段
3. 点击 **"保存修改"** 完成

**可编辑字段**：
- 目的地
- 预算
- 开始日期
- 结束日期
- 出行人数
- 行程亮点

**特点**：
- ✅ 界面友好，不需要技术知识
- ✅ 有表单验证，防止输入错误
- ✅ 即时反馈
- ⚠️ 只能修改基本信息

---

### 2. 高级编辑模式

**步骤**：
1. 在行程详情页点击 **"高级编辑"** 按钮
2. 在 JSON 编辑器中直接修改数据
3. 使用 **"格式化 JSON"** 按钮整理格式（可选）
4. 点击 **"保存修改"** 完成

**功能按钮**：
- **保存修改**：保存编辑的 JSON 数据
- **取消**：放弃修改，返回查看模式
- **格式化 JSON**：自动整理 JSON 格式，便于阅读
- **切换到简单编辑**：切换到表单编辑模式

**特点**：
- ✅ 完全控制所有数据
- ✅ 可以修改任何细节
- ✅ 支持复制粘贴
- ⚠️ 需要了解 JSON 格式
- ⚠️ 格式错误会导致保存失败

---

## 📊 JSON 数据结构说明

### 完整结构示例

```json
{
  "metadata": {
    "destination": "杭州",
    "start_date": "2025-11-10",
    "end_date": "2025-11-12",
    "budget": 5000,
    "people_count": 2,
    "preferences": {
      "cultural": true,
      "food": true,
      "nature": true
    }
  },
  "summary": "探索杭州的自然风光与文化魅力，品尝地道美食",
  "daily_itinerary": [
    {
      "day": 1,
      "date": "2025-11-10",
      "theme": "西湖初探",
      "items": [
        {
          "time": "09:00",
          "duration": "2小时",
          "type": "attraction",
          "title": "西湖",
          "description": "游览西湖十景，欣赏湖光山色",
          "location": "西湖风景区",
          "estimated_cost": 0,
          "tips": "建议早上前往，人少景美"
        },
        {
          "time": "12:00",
          "duration": "1.5小时",
          "type": "restaurant",
          "title": "楼外楼",
          "description": "品尝正宗杭帮菜",
          "location": "孤山路30号",
          "estimated_cost": 200,
          "tips": "推荐西湖醋鱼和龙井虾仁"
        }
      ]
    }
  ],
  "budget_breakdown": {
    "transportation": 500,
    "accommodation": 1500,
    "food": 1200,
    "attractions": 800,
    "shopping": 500,
    "other": 500
  },
  "accommodation_suggestions": [
    {
      "name": "西湖国宾馆",
      "location": "西湖区",
      "price_range": "¥800-1500/晚",
      "features": "湖景房，环境优雅"
    }
  ],
  "travel_tips": [
    "提前预订酒店可以获得更好的价格",
    "建议办理杭州市民卡，部分景点有优惠",
    "避开节假日高峰期"
  ]
}
```

### 核心字段说明

#### metadata（元数据 - 必填）
包含行程的基本信息：
```json
{
  "destination": "目的地名称",
  "start_date": "开始日期 (YYYY-MM-DD)",
  "end_date": "结束日期 (YYYY-MM-DD)",
  "budget": 总预算（数字），
  "people_count": 出行人数（数字）,
  "preferences": {
    "cultural": true/false,
    "food": true/false,
    "nature": true/false,
    "shopping": true/false,
    "nightlife": true/false,
    "relaxation": true/false
  }
}
```

#### summary（行程亮点 - 可选）
```json
"summary": "简要描述行程的精彩之处"
```

#### daily_itinerary（每日行程 - 核心部分）
数组格式，每天一个对象：
```json
{
  "day": 1,                    // 第几天（数字）
  "date": "2025-11-10",        // 日期
  "theme": "当天主题",         // 主题描述
  "items": [                   // 当天的活动列表
    {
      "time": "09:00",         // 时间
      "duration": "2小时",     // 持续时长
      "type": "attraction",    // 类型：attraction/restaurant/hotel/transportation/shopping
      "title": "活动标题",     // 标题
      "description": "详细描述", // 描述
      "location": "具体位置",   // 位置
      "estimated_cost": 100,   // 预计费用（数字）
      "tips": "小贴士"          // 提示（可选）
    }
  ]
}
```

**type 类型说明**：
- `attraction`：景点
- `restaurant`：餐厅
- `hotel`：住宿
- `transportation`：交通
- `shopping`：购物

#### budget_breakdown（预算分配 - 可选）
```json
{
  "transportation": 500,   // 交通
  "accommodation": 1500,   // 住宿
  "food": 1200,           // 餐饮
  "attractions": 800,     // 景点门票
  "shopping": 500,        // 购物
  "other": 500            // 其他
}
```

#### accommodation_suggestions（住宿推荐 - 可选）
```json
[
  {
    "name": "酒店名称",
    "location": "位置",
    "price_range": "价格区间",
    "features": "特色说明"
  }
]
```

#### travel_tips（旅行贴士 - 可选）
```json
[
  "贴士1",
  "贴士2",
  "贴士3"
]
```

---

## ⚠️ 注意事项

### JSON 格式要求

1. **必须是合法的 JSON 格式**
   - 字符串使用双引号 `""`，不能用单引号
   - 数字不加引号
   - 布尔值：`true` 或 `false`（小写）
   - 最后一个字段后不能有逗号

2. **必填字段**
   - `metadata` 对象必须存在
   - `metadata.destination`、`start_date`、`end_date`、`budget`、`people_count` 必须有值

3. **数据类型**
   - `budget`：必须是数字，不是字符串
   - `people_count`：必须是数字
   - `day`：必须是数字
   - `estimated_cost`：必须是数字

### 常见错误

#### ❌ 错误示例 1：使用单引号
```json
{
  'destination': '杭州'  // ❌ 错误：使用了单引号
}
```

**✅ 正确写法**：
```json
{
  "destination": "杭州"  // ✅ 正确：使用双引号
}
```

#### ❌ 错误示例 2：末尾多余逗号
```json
{
  "destination": "杭州",
  "budget": 5000,  // ❌ 错误：最后一个字段后有逗号
}
```

**✅ 正确写法**：
```json
{
  "destination": "杭州",
  "budget": 5000   // ✅ 正确：最后一个字段后无逗号
}
```

#### ❌ 错误示例 3：数字加了引号
```json
{
  "budget": "5000",        // ❌ 错误：数字不应该加引号
  "people_count": "2"      // ❌ 错误
}
```

**✅ 正确写法**：
```json
{
  "budget": 5000,          // ✅ 正确：数字不加引号
  "people_count": 2        // ✅ 正确
}
```

---

## 🔄 两种模式间切换

### 从简单编辑切换到高级编辑
1. 在简单编辑模式下，点击 **"切换到高级编辑"** 按钮
2. 当前的表单数据会自动转换为 JSON 格式
3. 可以继续在 JSON 编辑器中修改

### 从高级编辑切换到简单编辑
1. 在高级编辑模式下，点击 **"切换到简单编辑"** 按钮
2. 切换后只能编辑基本字段
3. 其他详细数据（如每日行程）不会丢失，但在简单模式下无法编辑

**提示**：
- 切换模式不会丢失数据
- 建议先保存当前修改，再切换模式

---

## 💡 使用技巧

### 1. 使用"格式化 JSON"功能
如果 JSON 格式混乱难以阅读，点击 **"格式化 JSON"** 按钮，系统会自动整理格式：

**格式化前**：
```json
{"metadata":{"destination":"杭州","budget":5000},"summary":"探索杭州"}
```

**格式化后**：
```json
{
  "metadata": {
    "destination": "杭州",
    "budget": 5000
  },
  "summary": "探索杭州"
}
```

### 2. 验证 JSON 格式
在保存前，可以先点击 **"格式化 JSON"**，如果能成功格式化，说明 JSON 格式正确。

### 3. 备份数据
在进行大量修改前，建议：
1. 复制整个 JSON 到文本编辑器保存
2. 或者先下载 PDF 备份

### 4. 分步修改
如果要修改很多内容：
1. 先修改一部分
2. 点击 **"格式化 JSON"** 验证格式
3. 保存
4. 再继续修改其他部分

---

## 🧪 测试场景

### 场景 1：修改某天的行程
1. 点击 **"高级编辑"**
2. 找到 `daily_itinerary` 数组
3. 定位到要修改的那天
4. 修改 `items` 数组中的活动
5. 保存

**示例**：将第一天的西湖游览时间从 9:00 改为 10:00
```json
"daily_itinerary": [
  {
    "day": 1,
    "items": [
      {
        "time": "10:00",  // 从 "09:00" 改为 "10:00"
        "title": "西湖"
      }
    ]
  }
]
```

### 场景 2：添加新的景点
在某一天的 `items` 数组中添加新对象：
```json
{
  "time": "15:00",
  "duration": "1.5小时",
  "type": "attraction",
  "title": "雷峰塔",
  "description": "登塔俯瞰西湖全景",
  "location": "南山路15号",
  "estimated_cost": 40,
  "tips": "建议傍晚前往，可以看日落"
}
```

### 场景 3：调整预算分配
修改 `budget_breakdown`：
```json
"budget_breakdown": {
  "transportation": 600,      // 原来是 500
  "accommodation": 1400,      // 原来是 1500
  "food": 1200,
  "attractions": 800,
  "shopping": 500,
  "other": 500
}
```

---

## 🔒 安全保障

### 数据验证
保存时系统会自动验证：
- ✅ JSON 格式是否正确
- ✅ 必填字段是否存在
- ✅ 数据类型是否正确

如果验证失败，会显示具体的错误信息，数据不会被保存。

### 本地优先
- 修改会先在本地生效
- 然后同步到云端
- 如果云端同步失败，本地修改仍然保留

### 撤销机制
点击 **"取消"** 按钮可以放弃所有修改，恢复到编辑前的状态。

---

## 📈 适用人群

### 简单编辑模式
- ✅ 普通用户
- ✅ 只需要调整基本信息
- ✅ 不熟悉技术

### 高级编辑模式
- ✅ 有技术背景的用户
- ✅ 需要精细控制行程细节
- ✅ 熟悉 JSON 格式
- ✅ 想要批量修改数据

---

## 🎉 功能优势

1. **灵活性**：两种模式满足不同需求
2. **强大性**：高级模式可以修改任何内容
3. **安全性**：有数据验证和错误提示
4. **易用性**：简单模式无需技术知识
5. **互操作**：两种模式可以自由切换

---

**更新日期**: 2025-11-09
**版本**: v1.0
**状态**: ✅ 已发布
