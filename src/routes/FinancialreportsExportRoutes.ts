import { Router } from "express";
import {
  exportDepositsToExcel,
  exportWithdrawalsToExcel,
  exportWalletsToExcel,
  exportComprehensiveReportToExcel,
} from  "@/controllers/financialreportsExport";
import { requireRole } from "@/middleware/roleMiddleware";
import { authenticateToken } from "@/lib/auth";

const fExportRouter = Router();



fExportRouter.use(authenticateToken);
fExportRouter.use(requireRole(["SUPER_ADMIN"]));

/**
 * @route   GET /api/reports/export/deposits
 * @desc    Export deposits report to Excel
 * @query   startDate, endDate, status
 * @access  Super Admin only
 */
fExportRouter.get("/deposits", exportDepositsToExcel);

/**
 * @route   GET /api/reports/export/withdrawals
 * @desc    Export withdrawals report to Excel
 * @query   startDate, endDate, status
 * @access  Super Admin only
 */
fExportRouter.get("/withdrawals", exportWithdrawalsToExcel);

/**
 * @route   GET /api/reports/export/wallets
 * @desc    Export wallets report to Excel
 * @query   status
 * @access  Super Admin only
 */
fExportRouter.get("/wallets", exportWalletsToExcel);

/**
 * @route   GET /api/reports/export/comprehensive
 * @desc    Export comprehensive financial report to Excel (multiple sheets)
 * @query   startDate, endDate
 * @access  Super Admin only
 */
fExportRouter.get("/comprehensive", exportComprehensiveReportToExcel);

export default fExportRouter;