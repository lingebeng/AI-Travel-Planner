"""
AI Service for travel itinerary planning using DeepSeek
"""

import json
from datetime import datetime
from typing import Any, Dict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from loguru import logger

from ..config import Config


class AIService:
    """Service for AI-powered travel planning"""

    def __init__(self):
        """Initialize the AI service with DeepSeek"""
        self.llm = ChatOpenAI(
            model="deepseek-chat",
            base_url="https://api.deepseek.com",
            api_key=Config.DEEPSEEK_API_KEY,
            temperature=0.7,
            max_tokens=4000,
        )
        logger.info("AI Service initialized with DeepSeek")

    def generate_itinerary(
        self,
        destination: str,
        start_date: str,
        end_date: str,
        budget: float,
        people_count: int,
        preferences: str = "",
    ) -> Dict[str, Any]:
        """
        Generate a detailed travel itinerary using AI

        Args:
            destination: Travel destination
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            budget: Total budget in CNY
            people_count: Number of travelers
            preferences: User preferences (optional)

        Returns:
            dict: Generated itinerary with structured data
        """
        try:
            # Calculate days
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            days = (end - start).days + 1

            # Prepare the prompt
            prompt = self._create_itinerary_prompt(
                destination,
                start_date,
                end_date,
                days,
                budget,
                people_count,
                preferences,
            )

            # Create messages
            messages = [
                SystemMessage(
                    content="你是一个专业的旅行规划师，擅长为用户制定详细、实用的旅行计划。请用中文回答。"
                ),
                HumanMessage(content=prompt),
            ]

            # Call the model
            logger.info(
                f"Generating itinerary for {destination}, {days} days, budget: {budget}"
            )
            response = self.llm.invoke(messages)

            # Parse the response
            result = self._parse_itinerary_response(response.content)

            # Add metadata
            result["metadata"] = {
                "destination": destination,
                "start_date": start_date,
                "end_date": end_date,
                "total_days": days,
                "budget": budget,
                "people_count": people_count,
                "generated_at": datetime.now().isoformat(),
            }

            logger.info("Itinerary generated successfully")
            return {"success": True, "data": result}

        except Exception as e:
            logger.error(f"Failed to generate itinerary: {e}")
            return {"success": False, "error": str(e)}

    def _create_itinerary_prompt(
        self,
        destination: str,
        start_date: str,
        end_date: str,
        days: int,
        budget: float,
        people_count: int,
        preferences: str,
    ) -> str:
        """Create a detailed prompt for itinerary generation"""

        prompt = f"""请为我生成一份详细的旅行计划，要求如下：

旅行信息：
- 目的地：{destination}
- 出行时间：{start_date} 至 {end_date}（共 {days} 天）
- 预算：{budget} 元人民币
- 同行人数：{people_count} 人
- 特别偏好：{preferences if preferences else "无特别要求"}

请生成详细的旅行计划，必须严格按照以下 JSON 格式返回：

{{
  "summary": "简要总结这次旅行的亮点（50-100字）",
  "budget_breakdown": {{
    "transportation": 800,
    "accommodation": 1200,
    "food": 1500,
    "attractions": 800,
    "shopping": 500,
    "other": 200
  }},
  "daily_itinerary": [
    {{
      "day": 1,
      "date": "{start_date}",
      "theme": "第一天的主题（如：历史文化探索）",
      "items": [
        {{
          "time": "09:00",
          "type": "attraction",
          "title": "具体地点或活动名称",
          "description": "详细描述（50-100字）",
          "location": "具体地址",
          "estimated_cost": 100,
          "duration": "2小时",
          "tips": "实用建议或注意事项"
        }}
      ]
    }}
  ],
  "accommodation_suggestions": [
    {{
      "name": "酒店名称",
      "location": "具体地址",
      "price_range": "价格范围（如：300-500元/晚）",
      "features": "特色（如：近地铁、含早餐）",
      "booking_tips": "预订建议"
    }}
  ],
  "travel_tips": [
    "实用建议1（如：建议购买交通卡）",
    "实用建议2（如：注意当地天气）",
    "实用建议3（如：提前预订热门景点门票）"
  ],
  "emergency_contacts": [
    {{
      "name": "紧急联系名称（如：当地警察）",
      "phone": "电话号码"
    }}
  ]
}}

要求：
1. 必须返回有效的 JSON 格式，不要包含任何其他说明文字
2. 数字类型的字段（如 estimated_cost, day, transportation 等）必须使用数字，不要使用字符串
3. type 字段的值只能是：attraction, restaurant, hotel, transportation 之一
4. 每天至少安排 4-6 个行程项目，时间安排要合理
5. 预算分配要符合实际，不能超出总预算
6. 考虑交通时间，相邻景点之间的路程要合理
7. 提供具体的地址，方便导航
8. 针对{destination}的特色，推荐当地美食和必去景点"""

        return prompt

    def _parse_itinerary_response(self, response: str) -> Dict[str, Any]:
        """Parse the AI response to extract structured data"""
        try:
            # Try to find JSON in the response
            response = response.strip()

            # If response starts with ```json, extract the JSON part
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]

            # Additional cleaning: remove any text before the first {
            json_start = response.find("{")
            if json_start > 0:
                response = response[json_start:]

            # Additional cleaning: remove any text after the last }
            json_end = response.rfind("}")
            if json_end > 0:
                response = response[: json_end + 1]

            # Try to fix common JSON errors
            response = response.strip()

            # Parse JSON
            data = json.loads(response)

            # Validate the structure
            required_keys = ["summary", "budget_breakdown", "daily_itinerary"]
            for key in required_keys:
                if key not in data:
                    logger.warning(f"Missing required key in AI response: {key}")

            return data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.debug(f"Response was: {response[:1000]}...")

            # Try to extract useful information even if JSON parsing fails
            try:
                # Attempt to fix common issues and retry
                # Remove any trailing commas before } or ]
                import re

                fixed_response = re.sub(r",(\s*[}\]])", r"\1", response)
                # Try parsing again
                data = json.loads(fixed_response)
                logger.info("Successfully parsed JSON after fixing common errors")
                return data
            except:  # noqa
                pass

            # Return a fallback structure
            return {
                "summary": "行程生成成功，但格式解析失败。请查看原始响应。",
                "raw_response": response,
                "parse_error": str(e),
                "budget_breakdown": {
                    "transportation": 0,
                    "accommodation": 0,
                    "food": 0,
                    "attractions": 0,
                    "shopping": 0,
                    "other": 0,
                },
                "daily_itinerary": [],
                "travel_tips": ["请查看原始响应获取完整行程信息"],
            }

    def optimize_budget(
        self, itinerary_data: Dict, new_budget: float
    ) -> Dict[str, Any]:
        """
        Optimize an existing itinerary for a new budget

        Args:
            itinerary_data: Existing itinerary data
            new_budget: New budget constraint

        Returns:
            dict: Optimized itinerary
        """
        # TODO: Implement budget optimization logic
        pass

    def get_destination_insights(self, destination: str) -> Dict[str, Any]:
        """
        Get insights and recommendations for a destination

        Args:
            destination: The destination to analyze

        Returns:
            dict: Destination insights and tips
        """
        try:
            prompt = f"""请提供关于{destination}的旅行见解，包括：
            1. 最佳旅行季节
            2. 必去景点TOP5
            3. 当地美食推荐
            4. 文化习俗和注意事项
            5. 交通建议

            请以JSON格式返回。"""

            messages = [
                SystemMessage(content="你是一个旅行专家，了解各地的文化和旅行信息。"),
                HumanMessage(content=prompt),
            ]

            response = self.llm.invoke(messages)
            return {"success": True, "data": response.content}
        except Exception as e:
            logger.error(f"Failed to get destination insights: {e}")
            return {"success": False, "error": str(e)}


# Create a singleton instance
ai_service = AIService()
