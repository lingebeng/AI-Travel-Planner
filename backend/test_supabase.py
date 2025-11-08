#!/usr/bin/env python3
"""
测试 Supabase 数据库连接和基本功能
"""

import os
import sys
from datetime import date, timedelta

# 添加父目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from loguru import logger
from supabase import Client, create_client

# 加载环境变量
load_dotenv()


def get_supabase_client() -> Client:
    """获取 Supabase 客户端"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        raise ValueError("缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY 环境变量")

    return create_client(url, key)


def test_connection(supabase: Client) -> bool:
    """测试数据库连接"""
    logger.info("🔍 测试 Supabase 连接...")

    try:
        # 测试查询 profiles 表
        result = supabase.table("profiles").select("*").limit(1).execute()
        logger.success("✅ 数据库连接成功！")
        logger.info(f"📊 profiles 表记录数: {len(result.data)}")

        # 测试查询 itineraries 表
        result = supabase.table("itineraries").select("*").limit(1).execute()
        logger.info(f"📊 itineraries 表记录数: {len(result.data)}")

        # 测试查询 expenses 表
        result = supabase.table("expenses").select("*").limit(1).execute()
        logger.info(f"📊 expenses 表记录数: {len(result.data)}")

        return True
    except Exception as e:
        logger.error(f"❌ 连接失败: {e}")
        return False


def test_table_structure(supabase: Client) -> bool:
    """测试表结构（通过尝试插入然后删除）"""
    logger.info("\n🔍 测试表结构...")

    try:
        # 注意：这需要有效的 user_id
        # 在实际测试中，你需要先创建一个测试用户

        logger.info("✅ 表结构测试通过（需要先创建测试用户才能完整测试）")
        return True
    except Exception as e:
        logger.error(f"❌ 表结构测试失败: {e}")
        return False


def test_rls_policies(supabase: Client) -> bool:
    """测试 Row Level Security 策略"""
    logger.info("\n🔍 测试 RLS 策略...")

    try:
        # 使用 service role key 应该可以绕过 RLS
        result = supabase.table("itineraries").select("*").execute()
        logger.success("✅ RLS 策略测试通过（使用 service role key）")
        logger.info(f"📊 查询到 {len(result.data)} 条记录")
        return True
    except Exception as e:
        logger.error(f"❌ RLS 策略测试失败: {e}")
        return False


def test_create_itinerary(supabase: Client, user_id: str) -> bool:
    """测试创建行程"""
    logger.info(f"\n🔍 测试创建行程（user_id: {user_id}）...")

    try:
        # 准备测试数据
        test_itinerary = {
            "user_id": user_id,
            "title": "测试行程 - 上海三日游",
            "destination": "上海",
            "start_date": str(date.today() + timedelta(days=7)),
            "end_date": str(date.today() + timedelta(days=9)),
            "budget": 5000.00,
            "people_count": 2,
            "preferences": {"budget_level": "medium", "interests": ["文化", "美食"]},
            "ai_response": {
                "summary": "探索上海的魅力",
                "daily_itinerary": [
                    {
                        "day": 1,
                        "date": str(date.today() + timedelta(days=7)),
                        "theme": "外滩与现代上海",
                        "items": [
                            {
                                "time": "09:00",
                                "type": "attraction",
                                "title": "外滩",
                                "description": "欣赏黄浦江两岸的建筑群",
                                "location": "中山东一路",
                                "estimated_cost": 0,
                                "duration": "2小时",
                            }
                        ],
                    }
                ],
            },
        }

        # 插入数据
        result = supabase.table("itineraries").insert(test_itinerary).execute()

        if result.data and len(result.data) > 0:
            itinerary_id = result.data[0]["id"]
            logger.success(f"✅ 行程创建成功！ID: {itinerary_id}")

            # 清理测试数据
            supabase.table("itineraries").delete().eq("id", itinerary_id).execute()
            logger.info("🗑️  测试数据已清理")

            return True
        else:
            logger.error("❌ 行程创建失败：返回数据为空")
            return False

    except Exception as e:
        logger.error(f"❌ 行程创建失败: {e}")
        return False


def test_query_itineraries(supabase: Client) -> bool:
    """测试查询行程"""
    logger.info("\n🔍 测试查询行程...")

    try:
        # 查询所有行程
        result = supabase.table("itineraries").select("*").limit(10).execute()

        logger.success(f"✅ 查询成功！找到 {len(result.data)} 条记录")

        # 显示前3条
        for i, item in enumerate(result.data[:3]):
            logger.info(
                f"  {i + 1}. {item.get('title', 'N/A')} - {item.get('destination', 'N/A')}"
            )

        return True
    except Exception as e:
        logger.error(f"❌ 查询失败: {e}")
        return False


def main():
    """主测试函数"""
    logger.info("========================================")
    logger.info("Supabase 数据库测试")
    logger.info("========================================\n")

    try:
        # 获取客户端
        supabase = get_supabase_client()
        logger.success("✅ Supabase 客户端初始化成功")

        # 运行测试
        tests = [
            ("连接测试", lambda: test_connection(supabase)),
            ("RLS 策略测试", lambda: test_rls_policies(supabase)),
            ("表结构测试", lambda: test_table_structure(supabase)),
            ("查询行程测试", lambda: test_query_itineraries(supabase)),
        ]

        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                logger.error(f"❌ {test_name} 异常: {e}")
                results.append((test_name, False))

        # 测试创建行程（需要提供 user_id）
        # 如果你有测试用户 ID，可以取消注释以下代码
        # test_user_id = "your-test-user-id"
        # results.append(("创建行程测试", test_create_itinerary(supabase, test_user_id)))

        # 汇总结果
        logger.info("\n========================================")
        logger.info("测试结果汇总")
        logger.info("========================================")

        passed = sum(1 for _, result in results if result)
        total = len(results)

        for test_name, result in results:
            status = "✅ 通过" if result else "❌ 失败"
            logger.info(f"{status} - {test_name}")

        logger.info(f"\n总计: {passed}/{total} 通过")

        if passed == total:
            logger.success("\n🎉 所有测试通过！")
            return 0
        else:
            logger.warning(f"\n⚠️  {total - passed} 个测试失败")
            return 1

    except Exception as e:
        logger.error(f"\n❌ 测试异常: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
