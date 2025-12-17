import express from 'express';
import {
  getManagerMonthlyReport,
  getBoardMonthlySnapshot
} from '../controllers/condoController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/manager/reports/monthly',
  requireAuth,
  requireRole(['manager', 'admin']),
  getManagerMonthlyReport
);

router.get(
  '/board/reports/monthly',
  requireAuth,
  requireRole(['board', 'admin']),
  getBoardMonthlySnapshot
);

export default router;
