#!/usr/bin/env python3
"""
测试 Supabase 认证 API
"""

import json

import requests

BASE_URL = "http://localhost:5001/api"


def test_register():
    """测试用户注册"""
    print("\n🔍 测试用户注册...")

    url = f"{BASE_URL}/auth/register"
    data = {
        "email": "test@example.com",
        "password": "Test123456!",
        "full_name": "Test User",
    }

    response = requests.post(url, json=data)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

    if response.status_code == 200:
        print("✅ 注册成功！")
        return response.json()["data"]
    else:
        print("❌ 注册失败")
        return None


def test_login():
    """测试用户登录"""
    print("\n🔍 测试用户登录...")

    url = f"{BASE_URL}/auth/login"
    data = {"email": "test@example.com", "password": "Test123456!"}

    response = requests.post(url, json=data)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

    if response.status_code == 200:
        print("✅ 登录成功！")
        return response.json()["data"]
    else:
        print("❌ 登录失败")
        return None


def test_get_current_user(access_token):
    """测试获取当前用户信息"""
    print("\n🔍 测试获取当前用户信息...")

    url = f"{BASE_URL}/auth/me"
    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(url, headers=headers)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

    if response.status_code == 200:
        print("✅ 获取用户信息成功！")
        return True
    else:
        print("❌ 获取用户信息失败")
        return False


def test_save_itinerary(access_token):
    """测试保存行程（需要认证）"""
    print("\n🔍 测试保存行程...")

    url = f"{BASE_URL}/itinerary/save"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    data = {
        "title": "测试行程 - 上海三日游",
        "destination": "上海",
        "start_date": "2025-11-15",
        "end_date": "2025-11-17",
        "budget": 5000,
        "people_count": 2,
        "preferences": {"interests": ["美食", "文化"]},
        "ai_response": {"summary": "这是一个测试行程", "daily_itinerary": []},
    }

    response = requests.post(url, json=data, headers=headers)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

    if response.status_code == 200:
        print("✅ 保存行程成功！")
        return response.json()["data"]
    else:
        print("❌ 保存行程失败")
        return None


def test_list_itineraries(access_token):
    """测试获取行程列表（需要认证）"""
    print("\n🔍 测试获取行程列表...")

    url = f"{BASE_URL}/itinerary/list"
    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(url, headers=headers)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

    if response.status_code == 200:
        print(f"✅ 获取行程列表成功！共 {len(response.json()['data'])} 条记录")
        return True
    else:
        print("❌ 获取行程列表失败")
        return False


def test_save_without_auth():
    """测试未认证时保存行程（应该失败）"""
    print("\n🔍 测试未认证时保存行程...")

    url = f"{BASE_URL}/itinerary/save"
    data = {
        "title": "测试行程",
        "destination": "上海",
        "start_date": "2025-11-15",
        "end_date": "2025-11-17",
        "budget": 5000,
        "people_count": 2,
    }

    response = requests.post(url, json=data)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

    if response.status_code == 401:
        print("✅ 正确返回 401 未授权")
        return True
    else:
        print("❌ 应该返回 401 未授权")
        return False


def main():
    """主测试函数"""
    print("=" * 60)
    print("Supabase 认证 API 测试")
    print("=" * 60)

    # 测试 1: 注册（可能已存在）
    register_result = test_register()

    # 测试 2: 登录
    login_result = test_login()
    if not login_result:
        print("\n❌ 登录失败，无法继续测试")
        return

    access_token = login_result["session"]["access_token"]
    print(f"\n📝 Access Token: {access_token[:50]}...")

    # 测试 3: 获取当前用户信息
    test_get_current_user(access_token)

    # 测试 4: 未认证时保存行程
    test_save_without_auth()

    # 测试 5: 认证后保存行程
    test_save_itinerary(access_token)

    # 测试 6: 获取行程列表
    test_list_itineraries(access_token)

    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
