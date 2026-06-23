import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomUUID();
    cb(null, `${name}${ext}`);
  },
});

// 先不校验文件类型，留给路由层处理（确保参数冲突检测优先）
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function validateFileType(file) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error(`不支持的图片格式: ${file.mimetype}，仅支持 JPEG/PNG/GIF/WebP`);
  }
}
