"""
AI Expense Analyzer for intelligent expense parsing and budget analysis
"""

import json
from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from loguru import logger

from ..config import Config


class AIExpenseAnalyzer:
    """AI-powered expense analysis service"""

    def __init__(self):
        """Initialize AI expense analyzer with DeepSeek"""
        self.llm = ChatOpenAI(
            model="deepseek-chat",
            base_url="https://api.deepseek.com",
            api_key=Config.DEEPSEEK_API_KEY,
            temperature=0.3,  # Lower temperature for more consistent parsing
            max_tokens=2000,
        )
        logger.info("AI Expense Analyzer initialized")

    def parse_voice_expense(self, voice_text: str) -> Dict[str, Any]:
        """
        Parse voice input into structured expense data using AI

        Args:
            voice_text: Transcribed voice text (e.g., "刚吃饭花了80块")

        Returns:
            Dictionary with parsed expense data:
            - category: 类别 (交通/住宿/餐饮/景点/购物/其他)
            - amount: 金额 (float)
            - description: 描述 (string, optional)
            - location: 地点 (string, optional)
            - payment_method: 支付方式 (现金/微信/支付宝/银行卡, optional)
            - confidence: AI 解析置信度 (0-1)
        """
        try:
            prompt = self._create_voice_parsing_prompt(voice_text)

            messages = [
                SystemMessage(
                    content="""你是一个智能开销记录助手。用户会说一句话描述他们的消费，你需要准确解析出以下信息：
1. category: 类别（必须从以下选择：交通/住宿/餐饮/景点/购物/其他）
2. amount: 金额（数字，必须）
3. description: 描述（简短文本，可选）
4. location: 地点（如果用户提到了地点，可选）
5. payment_method: 支付方式（如果提到：现金/微信/支付宝/银行卡，可选）
6. confidence: 你对解析结果的置信度（0-1之间的小数）

请严格按照 JSON 格式返回，不要添加任何其他文字。"""
                ),
                HumanMessage(content=prompt),
            ]

            logger.info(f"Parsing voice expense: {voice_text}")
            response = self.llm.invoke(messages)

            # Parse JSON response
            result = self._parse_json_response(response.content)

            # Validate and normalize
            result = self._validate_expense_data(result)

            logger.info(f"Successfully parsed expense: {result}")
            return {"success": True, "data": result}

        except Exception as e:
            logger.error(f"Failed to parse voice expense: {e}")
            return {
                "success": False,
                "error": f"解析失败: {str(e)}",
                "data": {
                    "category": "其他",
                    "amount": 0,
                    "description": voice_text,
                    "confidence": 0.0,
                },
            }

    def analyze_budget(
        self,
        expenses: List[Dict[str, Any]],
        budget_breakdown: Dict[str, float],
        total_budget: float,
        destination: str,
        remaining_days: int = 0,
    ) -> Dict[str, Any]:
        """
        Comprehensive AI budget analysis

        Args:
            expenses: List of expense records
            budget_breakdown: Original budget allocation by category
            total_budget: Total budget amount
            destination: Travel destination
            remaining_days: Days remaining in trip

        Returns:
            Dictionary with analysis results:
            - overspending_alert: 超支警告
            - saving_suggestions: 节省建议
            - optimized_budget: 优化后的预算分配
            - trend_prediction: 消费趋势预测
        """
        try:
            prompt = self._create_budget_analysis_prompt(
                expenses, budget_breakdown, total_budget, destination, remaining_days
            )

            messages = [
                SystemMessage(
                    content="""你是一位专业的旅行预算分析师。请基于用户的行程预算和实际开销，提供全面、客观的分析报告。
你的分析应该：
1. 准确识别超支类别和金额
2. 提供具体可行的节省建议
3. 基于实际消费模式优化预算分配
4. 根据消费趋势预测后续开销

请以 JSON 格式返回结果，不要添加其他文字。"""
                ),
                HumanMessage(content=prompt),
            ]

            logger.info("Analyzing budget...")
            response = self.llm.invoke(messages)

            # Parse JSON response
            result = self._parse_json_response(response.content)

            logger.info("Budget analysis completed")
            return {"success": True, "data": result}

        except Exception as e:
            logger.error(f"Failed to analyze budget: {e}")
            return {
                "success": False,
                "error": f"分析失败: {str(e)}",
            }

    def _create_voice_parsing_prompt(self, voice_text: str) -> str:
        """Create prompt for voice expense parsing"""
        return f"""用户输入的语音文本："{voice_text}"

请解析这句话，提取出开销信息。参考以下示例：

示例1:
输入："刚打车去西湖花了30块"
输出：{{"category": "交通", "amount": 30, "description": "打车去西湖", "location": "西湖", "confidence": 0.95}}

示例2:
输入："中午在楼外楼吃饭80元用微信付的"
输出：{{"category": "餐饮", "amount": 80, "description": "楼外楼吃饭", "location": "楼外楼", "payment_method": "微信", "confidence": 0.98}}

示例3:
输入："买了雷峰塔门票40"
输出：{{"category": "景点", "amount": 40, "description": "雷峰塔门票", "location": "雷峰塔", "confidence": 0.9}}

示例4:
输入："住宿500"
输出：{{"category": "住宿", "amount": 500, "description": "住宿", "confidence": 0.85}}

示例5:
输入："花了200买特产"
输出：{{"category": "购物", "amount": 200, "description": "买特产", "confidence": 0.9}}

请按照相同的格式解析用户输入。注意：
- category 必须是：交通、住宿、餐饮、景点、购物、其他 之一
- amount 必须是数字
- 如果无法确定某个字段，可以省略（除了 category 和 amount 必须有）
- confidence 表示你对解析的置信度（0-1）

现在请解析用户输入并返回 JSON："""

    def _create_budget_analysis_prompt(
        self,
        expenses: List[Dict[str, Any]],
        budget_breakdown: Dict[str, float],
        total_budget: float,
        destination: str,
        remaining_days: int,
    ) -> str:
        """Create prompt for budget analysis"""
        # Calculate current spending
        total_spent = sum(float(exp.get("amount", 0)) for exp in expenses)
        by_category = {}
        for exp in expenses:
            cat = exp.get("category", "其他")
            amount = float(exp.get("amount", 0))
            by_category[cat] = by_category.get(cat, 0) + amount

        # Map categories
        category_map = {
            "transportation": "交通",
            "accommodation": "住宿",
            "food": "餐饮",
            "attractions": "景点",
            "shopping": "购物",
            "other": "其他",
        }

        budget_by_cn_category = {
            category_map[en]: budget_breakdown.get(en, 0) for en in budget_breakdown
        }

        expense_summary = "\n".join(
            [
                f"- {exp.get('category', '其他')}: ¥{exp.get('amount', 0)} ({exp.get('description', '无描述')})"
                for exp in expenses[:20]  # Limit to recent 20
            ]
        )

        return f"""请分析以下行程的预算情况：

## 行程信息
- 目的地：{destination}
- 总预算：¥{total_budget}
- 剩余天数：{remaining_days} 天

## 预算分配
{json.dumps(budget_by_cn_category, ensure_ascii=False, indent=2)}

## 实际开销（共 {len(expenses)} 笔，总计 ¥{total_spent}）
### 按类别汇总：
{json.dumps(by_category, ensure_ascii=False, indent=2)}

### 最近开销明细：
{expense_summary}

## 请提供以下分析（JSON 格式）：

{{
  "overspending_alert": {{
    "has_overspending": true/false,
    "categories": [
      {{
        "category": "类别名",
        "budget": 预算金额,
        "actual": 实际花费,
        "overspent": 超支金额,
        "percentage": 超支百分比
      }}
    ],
    "message": "简短的超支警告信息"
  }},
  "saving_suggestions": [
    {{
      "suggestion": "具体的节省建议",
      "category": "相关类别",
      "estimated_saving": 预计节省金额
    }}
  ],
  "optimized_budget": {{
    "交通": 调整后金额,
    "住宿": 调整后金额,
    "餐饮": 调整后金额,
    "景点": 调整后金额,
    "购物": 调整后金额,
    "其他": 调整后金额,
    "rationale": "为什么这样调整的简短说明"
  }},
  "trend_prediction": {{
    "predicted_total": 预测总花费,
    "predicted_overspending": 预测超支金额,
    "warning_level": "low/medium/high",
    "message": "趋势分析和建议"
  }}
}}

请基于实际数据提供专业、客观的分析。"""

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from AI response, handling markdown code blocks"""
        # Remove markdown code blocks if present
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}\nResponse: {response_text}")
            raise ValueError(f"AI 返回的数据格式错误: {str(e)}")

    def _validate_expense_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize parsed expense data"""
        valid_categories = ["交通", "住宿", "餐饮", "景点", "购物", "其他"]

        # Validate category
        category = data.get("category", "其他")
        if category not in valid_categories:
            logger.warning(f"Invalid category '{category}', defaulting to '其他'")
            category = "其他"
        data["category"] = category

        # Validate amount
        try:
            amount = float(data.get("amount", 0))
            if amount < 0:
                amount = 0
            data["amount"] = amount
        except (ValueError, TypeError):
            logger.warning(f"Invalid amount '{data.get('amount')}', defaulting to 0")
            data["amount"] = 0

        # Ensure confidence is between 0 and 1
        confidence = data.get("confidence", 0.5)
        try:
            confidence = float(confidence)
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, TypeError):
            confidence = 0.5
        data["confidence"] = confidence

        return data


# Singleton instance
ai_expense_analyzer = AIExpenseAnalyzer()
