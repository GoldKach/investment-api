import { Request, Response } from "express";
import { db } from "@/db/db";

/* ─────────────────────────────────────────────────────────────────────────────
   ACTIVITY HISTORY CONTROLLER
   ───────────────────────────────────────────────────────────────────────────── */

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. GET RECENT ACTIVITY (Current User)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getRecentActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { page = "1", limit = "20", module, action, status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (module) where.module = module;
    if (action) where.action = { contains: action as string, mode: "insensitive" };
    if (status) where.status = status;

    const [activities, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limitNum,
        skip,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
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
    console.error("getRecentActivity error:", error);
    return res.status(500).json({ error: "Failed to fetch recent activity" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. GET AUDIT TRAIL (All Users - Admin Only)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getAuditTrail(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    if (!userRole || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const {
      page = "1",
      limit = "50",
      userId,
      module,
      action,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (action) where.action = { contains: action as string, mode: "insensitive" };
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { user: { name: { contains: search as string, mode: "insensitive" } } },
        { user: { email: { contains: search as string, mode: "insensitive" } } },
      ];
    }

    const [activities, total, stats] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limitNum,
        skip,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
              role: true,
            },
          },
        },
      }),
      db.activityLog.count({ where }),
      // Get stats
      db.activityLog.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
    ]);

    const statusStats = {
      total,
      success: stats.find((s) => s.status === "SUCCESS")?._count || 0,
      failed: stats.find((s) => s.status === "FAILED")?._count || 0,
      pending: stats.find((s) => s.status === "PENDING")?._count || 0,
    };

    return res.status(200).json({
      success: true,
      data: activities,
      stats: statusStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getAuditTrail error:", error);
    return res.status(500).json({ error: "Failed to fetch audit trail" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. GET SYSTEM LOGS (Super Admin Only)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getSystemLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    if (userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Access denied. Super Admin privileges required." });
    }

    const {
      page = "1",
      limit = "100",
      module,
      method,
      platform,
      isAutomated,
      startDate,
      endDate,
      search,
      errorOnly,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 200);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (module) where.module = module;
    if (method) where.method = method;
    if (platform) where.platform = platform;
    if (isAutomated === "true") where.isAutomated = true;
    if (isAutomated === "false") where.isAutomated = false;
    if (errorOnly === "true") where.status = "FAILED";

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { errorMessage: { contains: search as string, mode: "insensitive" } },
        { ipAddress: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [logs, total, moduleStats, methodStats, platformStats] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limitNum,
        skip,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      db.activityLog.count({ where }),
      // Module breakdown
      db.activityLog.groupBy({
        by: ["module"],
        where,
        _count: true,
      }),
      // Method breakdown
      db.activityLog.groupBy({
        by: ["method"],
        where,
        _count: true,
      }),
      // Platform breakdown
      db.activityLog.groupBy({
        by: ["platform"],
        where,
        _count: true,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      stats: {
        total,
        byModule: moduleStats.map((m) => ({ module: m.module || "unknown", count: m._count })),
        byMethod: methodStats.map((m) => ({ method: m.method || "unknown", count: m._count })),
        byPlatform: platformStats.map((p) => ({ platform: p.platform || "unknown", count: p._count })),
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getSystemLogs error:", error);
    return res.status(500).json({ error: "Failed to fetch system logs" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. GET ACTIVITY DETAIL
   ───────────────────────────────────────────────────────────────────────────── */

export async function getActivityDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const activity = await db.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            role: true,
          },
        },
      },
    });

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    // Regular users can only view their own activity
    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(userRole || "") && activity.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("getActivityDetail error:", error);
    return res.status(500).json({ error: "Failed to fetch activity detail" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. GET ACTIVITY STATS (Dashboard)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getActivityStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    if (!userRole || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { period = "7d" } = req.query;

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const where = { createdAt: { gte: startDate } };

    const [
      totalActivities,
      successCount,
      failedCount,
      uniqueUsers,
      byModule,
      byAction,
      recentTrend,
    ] = await Promise.all([
      db.activityLog.count({ where }),
      db.activityLog.count({ where: { ...where, status: "SUCCESS" } }),
      db.activityLog.count({ where: { ...where, status: "FAILED" } }),
      db.activityLog.groupBy({
        by: ["userId"],
        where,
        _count: true,
      }),
      db.activityLog.groupBy({
        by: ["module"],
        where,
        _count: true,
        orderBy: { _count: { module: "desc" } },
        take: 10,
      }),
      db.activityLog.groupBy({
        by: ["action"],
        where,
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      // Get daily activity for trend
      db.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as success_count,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count
        FROM "ActivityLog"
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      ` as Promise<any[]>,
    ]);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalActivities,
          successCount,
          failedCount,
          successRate: totalActivities > 0 ? ((successCount / totalActivities) * 100).toFixed(2) : 0,
          uniqueUsers: uniqueUsers.length,
        },
        byModule: byModule.map((m) => ({
          module: m.module || "unknown",
          count: m._count,
        })),
        byAction: byAction.map((a) => ({
          action: a.action,
          count: a._count,
        })),
        trend: recentTrend.map((t: any) => ({
          date: t.date,
          count: Number(t.count),
          successCount: Number(t.success_count),
          failedCount: Number(t.failed_count),
        })),
      },
    });
  } catch (error) {
    console.error("getActivityStats error:", error);
    return res.status(500).json({ error: "Failed to fetch activity stats" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. GET USER ACTIVITY (Admin - for specific user)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getUserActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    if (!userRole || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId } = req.params;
    const { page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [activities, total] = await Promise.all([
      db.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limitNum,
        skip,
      }),
      db.activityLog.count({ where: { userId } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user,
        activities,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getUserActivity error:", error);
    return res.status(500).json({ error: "Failed to fetch user activity" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. EXPORT ACTIVITY LOGS
   ───────────────────────────────────────────────────────────────────────────── */

export async function exportActivityLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    if (!userRole || !["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { startDate, endDate, module, format = "json" } = req.query;

    const where: any = {};
    if (module) where.module = module;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const logs = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000, // Limit export to 10k records
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (format === "csv") {
      const csvHeaders = [
        "ID",
        "User",
        "Email",
        "Role",
        "Action",
        "Module",
        "Status",
        "Description",
        "Method",
        "Platform",
        "IP Address",
        "Created At",
      ].join(",");

      const csvRows = logs.map((log) =>
        [
          log.id,
          log.user?.name || "",
          log.user?.email || "",
          log.user?.role || "",
          log.action,
          log.module || "",
          log.status || "",
          `"${(log.description || "").replace(/"/g, '""')}"`,
          log.method || "",
          log.platform || "",
          log.ipAddress || "",
          log.createdAt.toISOString(),
        ].join(",")
      );

      const csv = [csvHeaders, ...csvRows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=activity_logs_${Date.now()}.csv`);
      return res.send(csv);
    }

    return res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("exportActivityLogs error:", error);
    return res.status(500).json({ error: "Failed to export activity logs" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   8. GET MODULES LIST (for filters)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getModulesList(req: AuthenticatedRequest, res: Response) {
  try {
    const modules = await db.activityLog.groupBy({
      by: ["module"],
      _count: true,
      orderBy: { _count: { module: "desc" } },
    });

    return res.status(200).json({
      success: true,
      data: modules
        .filter((m) => m.module)
        .map((m) => ({
          module: m.module,
          count: m._count,
        })),
    });
  } catch (error) {
    console.error("getModulesList error:", error);
    return res.status(500).json({ error: "Failed to fetch modules list" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   9. GET ACTIONS LIST (for filters)
   ───────────────────────────────────────────────────────────────────────────── */

export async function getActionsList(req: AuthenticatedRequest, res: Response) {
  try {
    const actions = await db.activityLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: { _count: { action: "desc" } },
      take: 50,
    });

    return res.status(200).json({
      success: true,
      data: actions.map((a) => ({
        action: a.action,
        count: a._count,
      })),
    });
  } catch (error) {
    console.error("getActionsList error:", error);
    return res.status(500).json({ error: "Failed to fetch actions list" });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   10. DELETE OLD LOGS (Super Admin - Maintenance)
   ───────────────────────────────────────────────────────────────────────────── */

export async function deleteOldLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    if (userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Access denied. Super Admin privileges required." });
    }

    const { olderThanDays = "90" } = req.body;
    const days = parseInt(olderThanDays, 10);

    if (days < 30) {
      return res.status(400).json({ error: "Cannot delete logs newer than 30 days" });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    // Log this maintenance action
    await db.activityLog.create({
      data: {
        userId: req.user?.userId || "",
        action: "LOGS_CLEANUP",
        module: "system",
        status: "SUCCESS",
        description: `Deleted ${result.count} logs older than ${days} days`,
        method: "DELETE",
        platform: "web",
        isAutomated: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.count} logs older than ${days} days`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("deleteOldLogs error:", error);
    return res.status(500).json({ error: "Failed to delete old logs" });
  }
}