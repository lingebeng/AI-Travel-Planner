import os

import requests
from dotenv import load_dotenv

# --- 关键步骤：加载 .env 文件 ---
# load_dotenv() 会自动查找当前目录或上级目录中的 .env 文件并加载它
load_dotenv()

# --- 现在，可以安全地从 os.environ 中获取密钥 ---
# os.environ.get("变量名") 是推荐的方式
key = os.environ.get("AMAP_API_KEY")

# 检查是否成功获取了 Key
if not key:
    print("错误：未能在 .env 文件中找到 AMAP_API_KEY。")
    print("请确保 .env 文件存在，并且包含 AMAP_API_KEY=your_key")
else:
    print("成功从 .env 文件加载 API Key！")

    # --- 后续代码与之前完全一样 ---
    address_to_query = "北京市朝阳区阜通东大街6号"
    url = "https://restapi.amap.com/v3/geocode/geo"
    params = {
        "key": key,
        "address": address_to_query,
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if data["status"] == "1":
            location = data["geocodes"][0]["location"]
            print(f"查询成功: {address_to_query} 的经纬度是 {location}")
        else:
            print(f"API 请求失败: {data['info']}")

    except requests.exceptions.RequestException as e:
        print(f"网络请求出错: {e}")
