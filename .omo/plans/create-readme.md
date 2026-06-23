# Plan: 创建 README.md

## 目标
在项目根目录创建 README.md，包含完整的项目说明、API 文档、配置指南。

## 文件
`/mnt/c/Users/Administrator/jishen/firevision/README.md`

## 内容结构

1. **项目简介** — 基于多模态大模型的火灾识别 API
2. **快速开始** — 安装、配置（含多种模型切换示例表）、启动
3. **API 文档** — 两种传图方式（文件上传 / URL）、成功响应格式、错误响应格式、常见错误对照表
4. **项目结构** — 目录树
5. **技术栈** — Node.js / Express / openai SDK / multer

## 依赖
- `.env` 中的配置示例
- `package.json` 中的脚本
- `src/routes/detect.js` 中的响应格式

## 执行
```bash
cat > README.md << 'EOF'
# FireVision - 火灾识别 API

基于多模态大模型的图片火灾检测服务。支持任何 OpenAI 兼容接口（Ollama、MiniMax、GPT-4o、通义千问 VL、智谱 GLM 等）。

## 快速开始

### 环境要求
- Node.js 18+
- 大模型服务（本地 Ollama 或云端 API）

### 安装
```bash
cd firevision
npm install
```

### 配置
编辑 `.env` 文件：

```env
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
MODEL_NAME=qwen3-vl:8b
MODEL_MAX_TOKENS=300
MODEL_JSON_MODE=false
PORT=3000
```

**切换不同模型的示例：**

| 服务 | OPENAI_BASE_URL | MODEL_NAME | MODEL_JSON_MODE |
|------|----------------|------------|:---:|
| Ollama 本地 | `http://localhost:11434/v1` | `qwen3-vl:8b` / `qwen3.5:9b` 等 | false |
| MiniMax | `https://api.minimaxi.com/v1` | `MiniMax-M3` | true |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` | true |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-vl-max` | false |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4v-plus` | false |

### 启动
```bash
npm start
npm run dev   # 开发模式，自动重启
```

## API

### POST /api/detect

**方式一：上传本地文件**
```bash
curl -X POST http://localhost:3000/api/detect -F "image=@/path/to/photo.jpg"
```

**方式二：传图片 URL**
```bash
curl -X POST http://localhost:3000/api/detect \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/fire.jpg"}'
```

**成功响应 (HTTP 200)**
```json
{
  "code": 200,
  "data": {
    "hasFire": true,
    "confidence": 0.95,
    "description": "画面中心可见摩托车车头处有明亮橙色火焰及周边严重烧毁的车辆残骸"
  }
}
```

| 字段 | 说明 |
|------|------|
| `code` | 状态码，200 成功 |
| `data.hasFire` | 是否有火灾迹象 |
| `data.confidence` | 确信度 0.0~1.0 |
| `data.description` | 图片分析描述 |

**错误响应 (HTTP 400/500)**
```json
{
  "code": 400,
  "message": "缺少图片参数"
}
```

### 错误对照

| 场景 | message |
|------|---------|
| 未传参数 | 缺少图片参数 |
| 同时传 file + imageUrl | 参数冲突 |
| imageUrl 非 http 开头 | 参数格式无效 |
| 文件类型不合法 | 不支持的图片格式 |
| 文件超过 10MB | 图片超过 10MB 大小限制 |
| API Key 未配置 | OPENAI_API_KEY 未配置 |
| 模型不存在 | 模型 xxx 不可用 |
| 认证失败 | API 认证失败 |
| 网络不通 | 无法连接到模型服务 |

## 项目结构
```
firevision/
├── src/
│   ├── index.js                  # Express 入口
│   ├── routes/
│   │   └── detect.js             # POST /api/detect
│   ├── services/
│   │   ├── ai.js                 # 统一调用接口
│   │   ├── prompt.js             # 火灾检测 prompt
│   │   └── providers/
│   │       └── openai.js         # OpenAI 兼容适配器
│   └── middleware/
│       ├── upload.js             # 文件上传处理
│       └── errorHandler.js       # 错误处理
├── uploads/                      # 临时文件（自动清理）
├── .env
├── package.json
└── README.md
```

## 技术栈
- Node.js 24 + Express 4
- openai SDK（OpenAI 兼容适配）
- multer（文件上传）
- dotenv（环境配置）
EOF
```
