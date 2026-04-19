import express from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { createReportsNestApp } from './nest/create-reports-nest-app.js';

const router = express.Router();
const nestReportsApp = await createReportsNestApp();

// All reporting endpoints require auth; role checks happen per-report in service layer.
router.use(requireAuth, nestReportsApp);

export default router;
