import { Request, Response } from "express";
import { db } from "@/db/db";
import bcrypt from "bcryptjs";

/* ─────────────────────────────────────────────────────────────────────────────
   ACCOUNT SETTINGS CONTROLLER
   ───────────────────────────────────────────────────────────────────────────── */

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. GET CURRENT USER PROFILE
   ───────────────────────────────────────────────────────────────────────────── */

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
        status: true,
        emailVerified: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
        entityOnboarding: true,
        wallet: {
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            netAssetValue: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. UPDATE BASIC PROFILE (Name, Phone)
   ───────────────────────────────────────────────────────────────────────────── */

export async function updateBasicProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!firstName && !lastName && !phone) {
      return res.status(400).json({ error: "At least one field is required to update" });
    }

    // Check if phone is already taken by another user
    if (phone) {
      const existingUser = await db.user.findFirst({
        where: {
          phone,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: "Phone number is already in use" });
      }
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    // Update name field as well
    if (firstName || lastName) {
      const currentUser = await db.user.findUnique({ where: { id: userId } });
      updateData.name = `${firstName || currentUser?.firstName} ${lastName || currentUser?.lastName}`;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "PROFILE_UPDATE",
        module: "account",
        status: "SUCCESS",
        description: "Updated basic profile information",
        method: "PATCH",
        platform: "web",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateBasicProfile error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. UPDATE EMAIL (with verification requirement)
   ───────────────────────────────────────────────────────────────────────────── */

export async function updateEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ error: "New email and current password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Verify current password
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Check if email is already taken
    const existingUser = await db.user.findFirst({
      where: {
        email: newEmail,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email is already in use" });
    }

    // Update email and set emailVerified to false
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "EMAIL_CHANGE",
        module: "account",
        status: "SUCCESS",
        description: `Email changed to ${newEmail}`,
        method: "PATCH",
        platform: "web",
      },
    });

    // TODO: Send verification email to new address

    return res.status(200).json({
      success: true,
      message: "Email updated successfully. Please verify your new email address.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateEmail error:", error);
    return res.status(500).json({ error: "Failed to update email" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. CHANGE PASSWORD
   ───────────────────────────────────────────────────────────────────────────── */

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All password fields are required" });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    // Verify current password
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      // Log failed attempt
      await db.activityLog.create({
        data: {
          userId,
          action: "PASSWORD_CHANGE_FAILED",
          module: "account",
          status: "FAILED",
          description: "Failed password change attempt - invalid current password",
          method: "POST",
          platform: "web",
        },
      });

      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens for security
    await db.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "PASSWORD_CHANGE",
        module: "account",
        status: "SUCCESS",
        description: "Password changed successfully",
        method: "POST",
        platform: "web",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again with your new password.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. UPDATE PROFILE IMAGE
   ───────────────────────────────────────────────────────────────────────────── */

export async function updateProfileImage(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { imageUrl },
      select: {
        id: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "PROFILE_IMAGE_UPDATE",
        module: "account",
        status: "SUCCESS",
        description: "Profile image updated",
        method: "PATCH",
        platform: "web",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateProfileImage error:", error);
    return res.status(500).json({ error: "Failed to update profile image" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. GET ONBOARDING INFORMATION
   ───────────────────────────────────────────────────────────────────────────── */

export async function getOnboardingInfo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const onboarding = await db.entityOnboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding information not found" });
    }

    return res.status(200).json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    console.error("getOnboardingInfo error:", error);
    return res.status(500).json({ error: "Failed to fetch onboarding information" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. UPDATE ONBOARDING INFORMATION
   ───────────────────────────────────────────────────────────────────────────── */

export async function updateOnboardingInfo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingOnboarding = await db.entityOnboarding.findUnique({
      where: { userId },
    });

    if (!existingOnboarding) {
      return res.status(404).json({ error: "Onboarding information not found" });
    }

    // Fields that can be updated (excluding sensitive fields that require verification)
    const {
      homeAddress,
      phoneNumber,
      employmentStatus,
      occupation,
      companyName,
      companyAddress,
      businessType,
      authorizedRepName,
      authorizedRepEmail,
      authorizedRepPhone,
      authorizedRepPosition,
      primaryGoal,
      timeHorizon,
      riskTolerance,
      sourceOfWealth,
      businessOwnership,
      employmentIncome,
      expectedInvestment,
      businessName,
      businessAddress,
    } = req.body;

    const updateData: any = {};

    // Only update provided fields
    if (homeAddress !== undefined) updateData.homeAddress = homeAddress;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (employmentStatus !== undefined) updateData.employmentStatus = employmentStatus;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
    if (businessType !== undefined) updateData.businessType = businessType;
    if (authorizedRepName !== undefined) updateData.authorizedRepName = authorizedRepName;
    if (authorizedRepEmail !== undefined) updateData.authorizedRepEmail = authorizedRepEmail;
    if (authorizedRepPhone !== undefined) updateData.authorizedRepPhone = authorizedRepPhone;
    if (authorizedRepPosition !== undefined) updateData.authorizedRepPosition = authorizedRepPosition;
    if (primaryGoal !== undefined) updateData.primaryGoal = primaryGoal;
    if (timeHorizon !== undefined) updateData.timeHorizon = timeHorizon;
    if (riskTolerance !== undefined) updateData.riskTolerance = riskTolerance;
    if (sourceOfWealth !== undefined) updateData.sourceOfWealth = sourceOfWealth;
    if (businessOwnership !== undefined) updateData.businessOwnership = businessOwnership;
    if (employmentIncome !== undefined) updateData.employmentIncome = employmentIncome;
    if (expectedInvestment !== undefined) updateData.expectedInvestment = expectedInvestment;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (businessAddress !== undefined) updateData.businessAddress = businessAddress;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    const updatedOnboarding = await db.entityOnboarding.update({
      where: { userId },
      data: updateData,
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "ONBOARDING_UPDATE",
        module: "account",
        status: "SUCCESS",
        description: "Updated onboarding information",
        method: "PATCH",
        platform: "web",
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Onboarding information updated successfully",
      data: updatedOnboarding,
    });
  } catch (error) {
    console.error("updateOnboardingInfo error:", error);
    return res.status(500).json({ error: "Failed to update onboarding information" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   8. UPDATE KYC DOCUMENTS
   ───────────────────────────────────────────────────────────────────────────── */

export async function updateKycDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { avatarUrl, idUrl } = req.body;

    if (!avatarUrl && !idUrl) {
      return res.status(400).json({ error: "At least one document URL is required" });
    }

    const existingOnboarding = await db.entityOnboarding.findUnique({
      where: { userId },
    });

    if (!existingOnboarding) {
      return res.status(404).json({ error: "Onboarding information not found" });
    }

    const updateData: any = {};
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (idUrl) updateData.idUrl = idUrl;

    // When KYC documents are updated, set isApproved to false for re-verification
    updateData.isApproved = false;

    const updatedOnboarding = await db.entityOnboarding.update({
      where: { userId },
      data: updateData,
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "KYC_DOCUMENTS_UPDATE",
        module: "account",
        status: "SUCCESS",
        description: "Updated KYC documents - pending re-verification",
        method: "PATCH",
        platform: "web",
      },
    });

    return res.status(200).json({
      success: true,
      message: "KYC documents updated successfully. Your documents are pending re-verification.",
      data: {
        avatarUrl: updatedOnboarding.avatarUrl,
        idUrl: updatedOnboarding.idUrl,
        isApproved: updatedOnboarding.isApproved,
      },
    });
  } catch (error) {
    console.error("updateKycDocuments error:", error);
    return res.status(500).json({ error: "Failed to update KYC documents" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   9. GET ACCOUNT ACTIVITY LOG
   ───────────────────────────────────────────────────────────────────────────── */

export async function getAccountActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { page = "1", limit = "20", module } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (module) where.module = module;

    const [activities, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limitNum,
        skip,
        select: {
          id: true,
          action: true,
          module: true,
          status: true,
          description: true,
          method: true,
          platform: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
      db.activityLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getAccountActivity error:", error);
    return res.status(500).json({ error: "Failed to fetch account activity" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   10. GET ACTIVE SESSIONS
   ───────────────────────────────────────────────────────────────────────────── */

export async function getActiveSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await db.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("getActiveSessions error:", error);
    return res.status(500).json({ error: "Failed to fetch active sessions" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   11. REVOKE SESSION
   ───────────────────────────────────────────────────────────────────────────── */

export async function revokeSession(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { sessionId } = req.params;

    const session = await db.refreshToken.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await db.refreshToken.update({
      where: { id: sessionId },
      data: { revoked: true },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "SESSION_REVOKED",
        module: "account",
        status: "SUCCESS",
        description: "Revoked a session",
        method: "DELETE",
        platform: "web",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("revokeSession error:", error);
    return res.status(500).json({ error: "Failed to revoke session" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   12. REVOKE ALL SESSIONS (except current)
   ───────────────────────────────────────────────────────────────────────────── */

export async function revokeAllSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentSessionId } = req.body;

    const where: any = { userId };
    if (currentSessionId) {
      where.NOT = { id: currentSessionId };
    }

    const result = await db.refreshToken.updateMany({
      where,
      data: { revoked: true },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "ALL_SESSIONS_REVOKED",
        module: "account",
        status: "SUCCESS",
        description: `Revoked ${result.count} sessions`,
        method: "DELETE",
        platform: "web",
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully revoked ${result.count} sessions`,
      revokedCount: result.count,
    });
  } catch (error) {
    console.error("revokeAllSessions error:", error);
    return res.status(500).json({ error: "Failed to revoke sessions" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   13. DELETE ACCOUNT (Soft delete / Deactivate)
   ───────────────────────────────────────────────────────────────────────────── */

export async function deactivateAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { password, reason } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required to deactivate account" });
    }

    // Verify password
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Check if user has pending withdrawals
    const pendingWithdrawals = await db.withdrawal.count({
      where: {
        userId,
        transactionStatus: "PENDING",
      },
    });

    if (pendingWithdrawals > 0) {
      return res.status(400).json({
        error: "Cannot deactivate account with pending withdrawals",
        pendingWithdrawals,
      });
    }

    // Deactivate account
    await db.user.update({
      where: { id: userId },
      data: { status: "DEACTIVATED" },
    });

    // Revoke all sessions
    await db.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId,
        action: "ACCOUNT_DEACTIVATED",
        module: "account",
        status: "SUCCESS",
        description: reason || "Account deactivated by user",
        method: "DELETE",
        platform: "web",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("deactivateAccount error:", error);
    return res.status(500).json({ error: "Failed to deactivate account" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   14. GET NOTIFICATION PREFERENCES (Placeholder)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getNotificationPreferences(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Since there's no notification preferences table in schema,
    // return default preferences
    const defaultPreferences = {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      transactionAlerts: true,
      securityAlerts: true,
      weeklyDigest: true,
      monthlyStatement: true,
    };

    return res.status(200).json({
      success: true,
      data: defaultPreferences,
    });
  } catch (error) {
    console.error("getNotificationPreferences error:", error);
    return res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   15. GET ACCOUNT SUMMARY
   ───────────────────────────────────────────────────────────────────────────── */

export async function getAccountSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [user, wallet, deposits, withdrawals, activityCount] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          emailVerified: true,
          isApproved: true,
          createdAt: true,
        },
      }),
      db.wallet.findUnique({
        where: { userId },
        select: {
          balance: true,
          netAssetValue: true,
          status: true,
        },
      }),
      db.deposit.aggregate({
        where: { userId, transactionStatus: "APPROVED" },
        _sum: { amount: true },
        _count: true,
      }),
      db.withdrawal.aggregate({
        where: { userId, transactionStatus: "APPROVED" },
        _sum: { amount: true },
        _count: true,
      }),
      db.activityLog.count({ where: { userId } }),
    ]);

    const summary = {
      user,
      wallet,
      transactions: {
        totalDeposits: deposits._sum.amount || 0,
        depositCount: deposits._count,
        totalWithdrawals: withdrawals._sum.amount || 0,
        withdrawalCount: withdrawals._count,
      },
      activityCount,
      accountAge: user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    };

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("getAccountSummary error:", error);
    return res.status(500).json({ error: "Failed to fetch account summary" });
  }
}