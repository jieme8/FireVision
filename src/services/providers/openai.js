import OpenAI from 'openai';
import { FIRE_DETECT_PROMPT, FIRE_DETECT_SYSTEM } from '../prompt.js';

function getClient() {
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.minimaxi.com/v1';
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw Object.assign(new Error('OPENAI_API_KEY 未配置，请在 .env 文件中设置'), { code: 'CONFIG_MISSING' });
  }

  return new OpenAI({ baseURL, apiKey });
}

function imageToBase64DataUrl(buffer, mimetype) {
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
}

export async function analyzeImage({ type, buffer, mimetype, url }) {
  const client = getClient();

  const model = process.env.MODEL_NAME || 'MiniMax-M3';
  const maxTokens = parseInt(process.env.MODEL_MAX_TOKENS, 10) || 300;
  const useJsonMode = process.env.MODEL_JSON_MODE !== 'false';

  // 统一转成 base64，兼容不支持 URL 的 API（如 Ollama）
  let imageUrl;
  if (type === 'url') {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`下载图片失败 (HTTP ${resp.status})`);
    const raw = await resp.arrayBuffer();
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    imageUrl = imageToBase64DataUrl(Buffer.from(raw), contentType);
  } else {
    imageUrl = imageToBase64DataUrl(buffer, mimetype);
  }

  const params = {
    model,
    messages: [
      { role: 'system', content: FIRE_DETECT_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: FIRE_DETECT_PROMPT },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' },
          },
        ],
      },
    ],
    max_tokens: maxTokens,
  };

  if (useJsonMode) {
    params.response_format = { type: 'json_object' };
  }

  let response;
  try {
    response = await client.chat.completions.create(params);
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      switch (err.status) {
        case 401:
          throw Object.assign(new Error(`API 认证失败，请检查 OPENAI_API_KEY 是否正确`), { status: 502 });
        case 404:
          throw Object.assign(new Error(`模型 "${model}" 不可用，请检查 MODEL_NAME 是否正确`), { status: 502 });
        default:
          throw Object.assign(new Error(`模型服务异常 (${err.status}): ${err.message}`), { status: 502 });
      }
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw Object.assign(
        new Error(`无法连接到模型服务 (${process.env.OPENAI_BASE_URL || 'https://api.minimaxi.com/v1'})，请检查地址和网络`),
        { status: 502 },
      );
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      throw Object.assign(new Error('模型服务请求超时，请稍后重试'), { status: 504 });
    }
    throw err;
  }

  const msg = response.choices[0]?.message;
  let text = msg?.content;
  if (!text && msg?.reasoning) {
    text = msg.reasoning;
  }
  if (!text) {
    throw new Error('模型返回内容为空');
  }

  try {
    return JSON.parse(text);
  } catch {
    // 从末尾往前找最可能的 JSON 对象（模型通常把 JSON 放在思考文本的最后）
    let closeIdx = text.length;
    while ((closeIdx = text.lastIndexOf('}', closeIdx - 1)) !== -1) {
      const openIdx = text.lastIndexOf('{', closeIdx);
      if (openIdx === -1) break;
      try {
        return JSON.parse(text.slice(openIdx, closeIdx + 1));
      } catch {
        closeIdx = openIdx; // 继续往前找
      }
    }
    if (useJsonMode) {
      throw new Error(`模型返回非 JSON 格式: ${text}`);
    }
    const hf = text.match(/hasFire\s*[:\s=]\s*(true|false)/i);
    const conf = text.match(/confidence\s*[:\s=]\s*(\d+(?:\.\d+)?)/i);
    const hasFire = hf ? hf[1].toLowerCase() === 'true' : undefined;
    const confidence = conf ? parseFloat(conf[1]) : undefined;
    return { text, hasFire, confidence };
  }
}
