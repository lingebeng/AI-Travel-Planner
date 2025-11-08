import requests

# 测试地图API���码
url = "https://restapi.amap.com/v3/geocode/geo"
params = {"key": "38f0c3f8b200b1ac9a0c6f7fc977ac07", "address": "北京市天安门"}

response = requests.get(url, params=params)
print(f"URL: {response.url}")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# 测试我们的后端API
backend_url = "http://localhost:5001/api/map/geocode"
backend_params = {"address": "北京市天安门"}

backend_response = requests.get(backend_url, params=backend_params)
print(f"\nBackend URL: {backend_response.url}")
print(f"Backend Status: {backend_response.status_code}")
print(f"Backend Response: {backend_response.json()}")
