import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

load_dotenv()
key = os.environ.get("DEEPSEEK_API_KEY")
llm = ChatOpenAI(
    model="deepseek-chat", base_url="https://api.deepseek.com", api_key=key
)

# 2. 准备消息列表
messages = [
    SystemMessage(content="你是一个专业的旅行规划师。"),
    HumanMessage(content="你好！请帮我规划一个为期三天的北京之旅。"),
]

# 3. 调用模型
# .invoke() 是 LangChain 的标准执行方法
response = llm.invoke(messages)

# 4. 查看结果
print(response.content)
