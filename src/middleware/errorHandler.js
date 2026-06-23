export function errorHandler(err, _req, res, _next) {
  console.error('[Error]', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, message: '图片超过 10MB 大小限制' });
  }

  if (err.message && err.message.startsWith('不支持的图片格式')) {
    return res.status(400).json({ code: 400, message: err.message });
  }

  if (err.code === 'CONFIG_MISSING') {
    return res.status(500).json({ code: 500, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ code: status, message: err.message || '服务器内部错误' });
}
