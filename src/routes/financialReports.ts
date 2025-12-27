import {Router } from "express";
import {
  getDepositsReport,
  getWithdrawalsReport,
  getWalletsReport,
  getPortfolioPerformanceReport,
  getUserActivityReport,
  getComprehensiveFinancialReport,
  getTransactionTrendsReport,
} from "@/controllers/financialReportsController";
import { requireRole } from "@/middleware/roleMiddleware";
import { authenticateToken } from "@/utils/auth";

const fReportsRouter = Router();

fReportsRouter.use(authenticateToken);
fReportsRouter.use(requireRole(["SUPER_ADMIN"]));

/**
 * @route   GET /api/reports/deposits
 * @desc    Get deposits report with filters
 * @query   startDate, endDate, status, userId
 * @access  Super Admin only
 */
fReportsRouter.get("/deposits", getDepositsReport);

/**
 * @route   GET /api/reports/withdrawals
 * @desc    Get withdrawals report with filters
 * @query   startDate, endDate, status, userId
 * @access  Super Admin only
 */
fReportsRouter.get("/withdrawals", getWithdrawalsReport);

/**
 * @route   GET /api/reports/wallets
 * @desc    Get wallets overview report
 * @query   status
 * @access  Super Admin only
 */
fReportsRouter.get("/wallets", getWalletsReport);

/**
 * @route   GET /api/reports/portfolios
 * @desc    Get portfolio performance report
 * @access  Super Admin only
 */
fReportsRouter.get("/portfolios", getPortfolioPerformanceReport);

/**
 * @route   GET /api/reports/activity
 * @desc    Get user activity report
 * @query   startDate, endDate, userId, module, action
 * @access  Super Admin only
 */
fReportsRouter.get("/activity", getUserActivityReport);

/**
 * @route   GET /api/reports/summary
 * @desc    Get comprehensive financial summary report
 * @query   startDate, endDate
 * @access  Super Admin only
 */
fReportsRouter.get("/summary", getComprehensiveFinancialReport);

/**
 * @route   GET /api/reports/trends
 * @desc    Get transaction trends report
 * @query   period (daily|weekly|monthly), limit
 * @access  Super Admin only
 */
fReportsRouter.get("/trends", getTransactionTrendsReport);

export default fReportsRouter;