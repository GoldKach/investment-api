import {Router } from "express";
import {
  getRecentActivity,
  getAuditTrail,
  getSystemLogs,
  getActivityDetail,
  getActivityStats,
  getUserActivity,
  exportActivityLogs,
  getModulesList,
  getActionsList,
  deleteOldLogs,
} from "@/controllers/activitiesHistory";
import { authenticateToken } from "@/lib/auth";


const activityHistoryRouter = Router();

/* ─────────────────────────────────────────────────────────────────────────────
   ACTIVITY HISTORY ROUTES
   
   All routes require authentication
   ───────────────────────────────────────────────────────────────────────────── */

activityHistoryRouter.use(authenticateToken);

/**
 * @route   GET /api/v1/activity/recent
 * @desc    Get recent activity for current user
 * @access  Authenticated
 */
activityHistoryRouter.get("/recent", getRecentActivity);

/**
 * @route   GET /api/v1/activity/audit
 * @desc    Get audit trail (all users)
 * @access  Admin, Manager
 */
activityHistoryRouter.get("/audit", getAuditTrail);

/**
 * @route   GET /api/v1/activity/system
 * @desc    Get system logs
 * @access  Super Admin
 */
activityHistoryRouter.get("/system", getSystemLogs);

/**
 * @route   GET /api/v1/activity/stats
 * @desc    Get activity statistics for dashboard
 * @access  Admin, Manager
 */
activityHistoryRouter.get("/stats", getActivityStats);

/**
 * @route   GET /api/v1/activity/modules
 * @desc    Get list of modules (for filters)
 * @access  Authenticated
 */
activityHistoryRouter.get("/modules", getModulesList);

/**
 * @route   GET /api/v1/activity/actions
 * @desc    Get list of actions (for filters)
 * @access  Authenticated
 */
activityHistoryRouter.get("/actions", getActionsList);

/**
 * @route   GET /api/v1/activity/export
 * @desc    Export activity logs
 * @access  Admin
 */
activityHistoryRouter.get("/export", exportActivityLogs);

/**
 * @route   GET /api/v1/activity/user/:userId
 * @desc    Get activity for specific user
 * @access  Admin, Manager
 */
activityHistoryRouter.get("/user/:userId", getUserActivity);

/**
 * @route   GET /api/v1/activity/:id
 * @desc    Get activity detail
 * @access  Authenticated (own) / Admin (any)
 */
activityHistoryRouter.get("/:id", getActivityDetail);

/**
 * @route   DELETE /api/v1/activity/cleanup
 * @desc    Delete old logs (maintenance)
 * @access  Super Admin
 */
activityHistoryRouter.delete("/cleanup", deleteOldLogs);

export default activityHistoryRouter;