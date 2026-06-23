import { Router } from 'express';
import fs from 'fs/promises';
import { upload, validateFileType } from '../middleware/upload.js';
import { analyzeImage } from '../services/ai.js';

const router = Router();

function formatResponse(result) {
  return {
    code: 200,
    data: {
      hasFire: result.hasFire === true,
      confidence: typeof result.confidence === 'number' ? result.confidence : null,
      description: result.description || result.text || '',
    },
  };
}

router.post('/detect', upload.single('image'), async (req, res, next) => {
  const hasFile = !!req.file;
  const hasUrl = typeof req.body?.imageUrl === 'string' && req.body.imageUrl.length > 0;

  // 1. 两者都没提供
  if (!hasFile && !hasUrl) {
    return res.status(400).json({
      code: 400,
      message: '缺少图片参数',
      detail: '请提供图片，支持两种方式：① multipart 字段 image 上传文件；② JSON body 传入 imageUrl',
    });
  }

  // 2. 两者同时提供
  if (hasFile && hasUrl) {
    try { await fs.unlink(req.file.path); } catch { /* ignore */ }
    return res.status(400).json({
      code: 400,
      message: '参数冲突',
      detail: '请只选择一种图片来源，不要同时上传文件(image)和传入图片URL(imageUrl)',
    });
  }

  // 3. 图片 URL 方式
  if (hasUrl) {
    const { imageUrl } = req.body;

    if (!/^https?:\/\//i.test(imageUrl)) {
      return res.status(400).json({
        code: 400,
        message: '参数格式无效',
        detail: 'imageUrl 必须以 http:// 或 https:// 开头',
      });
    }

    try {
      const result = await analyzeImage({ type: 'url', url: imageUrl });

      return res.json(formatResponse(result));
    } catch (err) {
      return next(err);
    }
  }

  // 4. 文件上传方式 — 先校验文件类型
  const filePath = req.file.path;
  try {
    validateFileType(req.file);
  } catch (err) {
    try { await fs.unlink(filePath); } catch { /* ignore */ }
    return res.status(400).json({ code: 400, message: err.message });
  }

  try {
    const result = await analyzeImage({
      type: 'buffer',
      buffer: req.file.buffer || (await fs.readFile(filePath)),
      mimetype: req.file.mimetype,
    });

    res.json(formatResponse(result));
  } catch (err) {
    next(err);
  } finally {
    try { await fs.unlink(filePath); } catch { /* ignore */ }
  }
});

export default router;
