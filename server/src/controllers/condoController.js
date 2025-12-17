import WorkOrder from '../models/WorkOrder.js';
import Payment from '../models/Payment.js';
import CondoUnit from '../models/CondoUnit.js';

export async function getManagerMonthlyReport(req, res) {
  try {
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const openWorkOrders = await WorkOrder.find({ status: { $ne: 'closed' } })
      .populate('unit')
      .lean();

    const payments = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      period: { month, year },
      openWorkOrders,
      paymentsSummary: payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load manager report' });
  }
}

export async function getBoardMonthlySnapshot(req, res) {
  try {
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const payments = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const openCount = await WorkOrder.countDocuments({ status: { $ne: 'closed' } });
    const totalUnits = await CondoUnit.countDocuments();

    res.json({
      period: { month, year },
      totals: {
        openWorkOrders: openCount,
        totalUnits
      },
      paymentsSummary: payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load board snapshot' });
  }
}
