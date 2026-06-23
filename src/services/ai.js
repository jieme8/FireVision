import { analyzeImage as openaiAnalyze } from './providers/openai.js';

export async function analyzeImage(opts) {
  return openaiAnalyze(opts);
}
