import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import detectRouter from './routes/detect.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.use(express.json());
app.use('/api', detectRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  const baseUrl = `http://localhost:${PORT}`;
  const model = process.env.MODEL_NAME || '(default)';
  const apiBase = process.env.OPENAI_BASE_URL || '(default)';

  console.log('');
  console.log(`  🔥 FireVision API 已启动`);
  console.log(`  ─────────────────────────`);
  console.log(`  接口地址  POST ${baseUrl}/api/detect`);
  console.log(`  模型名称  ${model}`);
  console.log(`  模型服务  ${apiBase}`);
  console.log(``);
  console.log(`  📤 测试命令`);
  console.log(`  ──────────`);
  console.log(`  # 方式一：上传文件`);
  console.log(`  curl -X POST ${baseUrl}/api/detect \\`);
  console.log(`    -F "image=@/path/to/photo.jpg"`);
  console.log(``);
  console.log(`  # 方式二：图片 URL`);
  console.log(`  curl -X POST ${baseUrl}/api/detect \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"imageUrl":"https://example.com/fire.jpg"}'`);
  console.log('');
});
