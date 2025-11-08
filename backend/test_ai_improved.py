#!/usr/bin/env python3
"""
测试改进后的AI行程生成服务
"""

import json

import requests


def test_ai_itinerary():
    url = "http://localhost:5001/api/itinerary/generate"

    # 测试数据
    data = {
        "destination": "上海",
        "start_date": "2024-12-15",
        "end_date": "2024-12-17",
        "budget": 3000,
        "people_count": 1,
        "preferences": "科技馆，现代艺术，美食",
    }

    print("发送请求...")
    print(f"数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
    print("-" * 50)

    response = requests.post(url, json=data)

    print(f"状态码: {response.status_code}")
    print("-" * 50)

    result = response.json()

    # 检查是否成功
    if result.get("success"):
        data = result.get("data", {})

        # 检查是否有解析错误
        if "parse_error" in data:
            print(f"⚠️ JSON解析错误: {data['parse_error']}")
            if "raw_response" in data:
                print("\n原始响应 (前500字符):")
                print(data["raw_response"][:500])
        else:
            # 成功解析
            print("✅ 行程生成成功！")
            print(f"\n📝 行程概要: {data.get('summary', 'N/A')}")

            # 显示预算分配
            if "budget_breakdown" in data:
                print("\n💰 预算分配:")
                for key, value in data["budget_breakdown"].items():
                    print(f"  - {key}: ¥{value}")

            # 显示每日行程
            if "daily_itinerary" in data:
                print(f"\n📅 行程安排 ({len(data['daily_itinerary'])} 天):")
                for day_info in data["daily_itinerary"][:1]:  # 只显示第一天
                    print(
                        f"\n  第 {day_info.get('day', '?')} 天 - {day_info.get('theme', '')}"
                    )
                    items = day_info.get("items", [])
                    for item in items[:3]:  # 只显示前3个项目
                        print(f"    • {item.get('time', '')} - {item.get('title', '')}")
                        print(
                            f"      类型: {item.get('type', '')} | 费用: ¥{item.get('estimated_cost', 0)}"
                        )

                if len(data["daily_itinerary"]) > 1:
                    print(f"    ... 还有 {len(data['daily_itinerary']) - 1} 天的行程")

            # 显示旅行建议
            if "travel_tips" in data:
                print(f"\n💡 旅行建议 ({len(data.get('travel_tips', []))} 条):")
                for tip in data.get("travel_tips", [])[:3]:
                    print(f"  • {tip}")
    else:
        print(f"❌ 请求失败: {result.get('error', 'Unknown error')}")

    return result


if __name__ == "__main__":
    test_ai_itinerary()
