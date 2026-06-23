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
  console.log(`FireVision API running at http://localhost:${PORT}`);
  console.log(`POST /api/detect (multipart/form-data, field: image)`);
});
