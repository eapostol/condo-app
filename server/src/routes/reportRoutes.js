import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getReportCatalog,
  getReportFilters,
  runReport
} from '../controllers/reportController.js';

const router = express.Router();

// All reporting endpoints require auth; role checks happen per-report in service layer.
router.get('/catalog', requireAuth, getReportCatalog);
router.get('/filters', requireAuth, getReportFilters);
router.get('/:reportId', requireAuth, runReport);

export default router;
