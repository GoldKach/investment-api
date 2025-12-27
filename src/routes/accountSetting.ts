import {Router } from "express";
import {
  getCurrentUser,
  updateBasicProfile,
  updateEmail,
  changePassword,
  updateProfileImage,
  getOnboardingInfo,
  updateOnboardingInfo,
  updateKycDocuments,
  getAccountActivity,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  deactivateAccount,
  getNotificationPreferences,
  getAccountSummary,
} from "@/controllers/accountSetting";
import { authenticateToken } from "@/utils/auth";


const accountSettingRouter = Router();

/* ─────────────────────────────────────────────────────────────────────────────
   ACCOUNT SETTINGS ROUTES
   
   All routes require authentication
   ───────────────────────────────────────────────────────────────────────────── */

accountSettingRouter.use(authenticateToken);

/**
 * @route   GET /api/v1/account/me
 * @desc    Get current user profile
 * @access  Authenticated
 */
accountSettingRouter.get("/me", getCurrentUser);

/**
 * @route   GET /api/v1/account/summary
 * @desc    Get account summary with statistics
 * @access  Authenticated
 */
accountSettingRouter.get("/summary", getAccountSummary);

/**
 * @route   PATCH /api/v1/account/profile
 * @desc    Update basic profile (name, phone)
 * @access  Authenticated
 */
accountSettingRouter.patch("/profile", updateBasicProfile);

/**
 * @route   PATCH /api/v1/account/email
 * @desc    Update email address (requires password verification)
 * @access  Authenticated
 */
accountSettingRouter.patch("/email", updateEmail);

/**
 * @route   POST /api/v1/account/change-password
 * @desc    Change password
 * @access  Authenticated
 */
accountSettingRouter.post("/change-password", changePassword);

/**
 * @route   PATCH /api/v1/account/profile-image
 * @desc    Update profile image
 * @access  Authenticated
 */
accountSettingRouter.patch("/profile-image", updateProfileImage);

/**
 * @route   GET /api/v1/account/onboarding
 * @desc    Get onboarding information
 * @access  Authenticated
 */
accountSettingRouter.get("/onboarding", getOnboardingInfo);

/**
 * @route   PATCH /api/v1/account/onboarding
 * @desc    Update onboarding information
 * @access  Authenticated
 */
accountSettingRouter.patch("/onboarding", updateOnboardingInfo);

/**
 * @route   PATCH /api/v1/account/kyc-documents
 * @desc    Update KYC documents (avatar, ID)
 * @access  Authenticated
 */
accountSettingRouter.patch("/kyc-documents", updateKycDocuments);

/**
 * @route   GET /api/v1/account/activity
 * @desc    Get account activity log
 * @query   page, limit, module
 * @access  Authenticated
 */
accountSettingRouter.get("/activity", getAccountActivity);

/**
 * @route   GET /api/v1/account/sessions
 * @desc    Get active sessions
 * @access  Authenticated
 */
accountSettingRouter.get("/sessions", getActiveSessions);

/**
 * @route   DELETE /api/v1/account/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Authenticated
 */
accountSettingRouter.delete("/sessions/:sessionId", revokeSession);

/**
 * @route   DELETE /api/v1/account/sessions
 * @desc    Revoke all sessions (except current)
 * @access  Authenticated
 */
accountSettingRouter.delete("/sessions", revokeAllSessions);

/**
 * @route   GET /api/v1/account/notifications
 * @desc    Get notification preferences
 * @access  Authenticated
 */
accountSettingRouter.get("/notifications", getNotificationPreferences);

/**
 * @route   POST /api/v1/account/deactivate
 * @desc    Deactivate account (requires password)
 * @access  Authenticated
 */
accountSettingRouter.post("/deactivate", deactivateAccount);

export default accountSettingRouter;