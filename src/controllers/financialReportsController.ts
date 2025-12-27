import { db } from "@/db/db";
import { Request, Response } from "express";

/* ─────────────────────────────────────────────────────────────────────────────
   FINANCIAL REPORTS CONTROLLER - SUPER ADMIN ONLY
   ───────────────────────────────────────────────────────────────────────────── */

interface DateFilter {
  gte?: Date;
  lte?: Date;
}

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
}

const parseDateFilters = (startDate?: string, endDate?: string): DateFilter | undefined => {
  if (!startDate && !endDate) return undefined;
  const filter: DateFilter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return filter;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount);
};

/* ─────────────────────────────────────────────────────────────────────────────
   1. DEPOSITS REPORT
   ───────────────────────────────────────────────────────────────────────────── */

export async function getDepositsReport(req: Request, res: Response) {
  try {
    const { startDate, endDate, status, userId } = req.query as ReportFilters;

    const dateFilter = parseDateFilters(startDate, endDate);

    const where: any = {};
    if (dateFilter) where.createdAt = dateFilter;
    if (status) where.transactionStatus = status;
    if (userId) where.userId = userId;

    const deposits = await db.deposit.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        wallet: { select: { id: true, accountNumber: true, balance: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate statistics
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
    const pendingDeposits = deposits.filter((d) => d.transactionStatus === "PENDING");
    const approvedDeposits = deposits.filter((d) => d.transactionStatus === "APPROVED");
    const rejectedDeposits = deposits.filter((d) => d.transactionStatus === "REJECTED");

    const summary = {
      totalCount: deposits.length,
      totalAmount: totalDeposits,
      totalAmountFormatted: formatCurrency(totalDeposits),
      pending: {
        count: pendingDeposits.length,
        amount: pendingDeposits.reduce((sum, d) => sum + d.amount, 0),
      },
      approved: {
        count: approvedDeposits.length,
        amount: approvedDeposits.reduce((sum, d) => sum + d.amount, 0),
      },
      rejected: {
        count: rejectedDeposits.length,
        amount: rejectedDeposits.reduce((sum, d) => sum + d.amount, 0),
      },
      averageDeposit: deposits.length > 0 ? totalDeposits / deposits.length : 0,
    };

    // Group by method
    const byMethod = deposits.reduce((acc: Record<string, { count: number; amount: number }>, d) => {
      const method = d.method || "Unknown";
      if (!acc[method]) acc[method] = { count: 0, amount: 0 };
      acc[method].count++;
      acc[method].amount += d.amount;
      return acc;
    }, {});

    // Daily breakdown
    const dailyBreakdown = deposits.reduce((acc: Record<string, { count: number; amount: number }>, d) => {
      const date = d.createdAt.toISOString().split("T")[0];
      if (!acc[date]) acc[date] = { count: 0, amount: 0 };
      acc[date].count++;
      acc[date].amount += d.amount;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        summary,
        byMethod,
        dailyBreakdown,
        deposits,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getDepositsReport error:", error);
    return res.status(500).json({ error: "Failed to generate deposits report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. WITHDRAWALS REPORT
   ───────────────────────────────────────────────────────────────────────────── */

export async function getWithdrawalsReport(req: Request, res: Response) {
  try {
    const { startDate, endDate, status, userId } = req.query as ReportFilters;

    const dateFilter = parseDateFilters(startDate, endDate);

    const where: any = {};
    if (dateFilter) where.createdAt = dateFilter;
    if (status) where.transactionStatus = status;
    if (userId) where.userId = userId;

    const withdrawals = await db.withdrawal.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        wallet: { select: { id: true, accountNumber: true, balance: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const pendingWithdrawals = withdrawals.filter((w) => w.transactionStatus === "PENDING");
    const approvedWithdrawals = withdrawals.filter((w) => w.transactionStatus === "APPROVED");
    const rejectedWithdrawals = withdrawals.filter((w) => w.transactionStatus === "REJECTED");

    const summary = {
      totalCount: withdrawals.length,
      totalAmount: totalWithdrawals,
      totalAmountFormatted: formatCurrency(totalWithdrawals),
      pending: {
        count: pendingWithdrawals.length,
        amount: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      },
      approved: {
        count: approvedWithdrawals.length,
        amount: approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      },
      rejected: {
        count: rejectedWithdrawals.length,
        amount: rejectedWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      },
      averageWithdrawal: withdrawals.length > 0 ? totalWithdrawals / withdrawals.length : 0,
    };

    // Group by bank
    const byBank = withdrawals.reduce((acc: Record<string, { count: number; amount: number }>, w) => {
      const bank = w.bankName || "Unknown";
      if (!acc[bank]) acc[bank] = { count: 0, amount: 0 };
      acc[bank].count++;
      acc[bank].amount += w.amount;
      return acc;
    }, {});

    // Daily breakdown
    const dailyBreakdown = withdrawals.reduce((acc: Record<string, { count: number; amount: number }>, w) => {
      const date = w.createdAt.toISOString().split("T")[0];
      if (!acc[date]) acc[date] = { count: 0, amount: 0 };
      acc[date].count++;
      acc[date].amount += w.amount;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        summary,
        byBank,
        dailyBreakdown,
        withdrawals,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getWithdrawalsReport error:", error);
    return res.status(500).json({ error: "Failed to generate withdrawals report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. WALLETS OVERVIEW REPORT
   ───────────────────────────────────────────────────────────────────────────── */

export async function getWalletsReport(req: Request, res: Response) {
  try {
    const { status } = req.query as { status?: string };

    const where: any = {};
    if (status) where.status = status;

    const wallets = await db.wallet.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true } },
        _count: { select: { deposits: true, withdrawals: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalNetAssetValue = wallets.reduce((sum, w) => sum + w.netAssetValue, 0);
    const totalFees = wallets.reduce((sum, w) => sum + w.totalFees, 0);

    const activeWallets = wallets.filter((w) => w.status === "ACTIVE");
    const inactiveWallets = wallets.filter((w) => w.status === "INACTIVE");
    const frozenWallets = wallets.filter((w) => w.status === "FROZEN");

    const summary = {
      totalWallets: wallets.length,
      totalBalance,
      totalBalanceFormatted: formatCurrency(totalBalance),
      totalNetAssetValue,
      totalNetAssetValueFormatted: formatCurrency(totalNetAssetValue),
      totalFeesCollected: totalFees,
      totalFeesCollectedFormatted: formatCurrency(totalFees),
      averageBalance: wallets.length > 0 ? totalBalance / wallets.length : 0,
      byStatus: {
        active: { count: activeWallets.length, totalBalance: activeWallets.reduce((sum, w) => sum + w.balance, 0) },
        inactive: { count: inactiveWallets.length, totalBalance: inactiveWallets.reduce((sum, w) => sum + w.balance, 0) },
        frozen: { count: frozenWallets.length, totalBalance: frozenWallets.reduce((sum, w) => sum + w.balance, 0) },
      },
    };

    // Top 10 wallets by balance
    const topWallets = [...wallets].sort((a, b) => b.balance - a.balance).slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        summary,
        topWallets,
        wallets,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getWalletsReport error:", error);
    return res.status(500).json({ error: "Failed to generate wallets report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. PORTFOLIO PERFORMANCE REPORT
   ───────────────────────────────────────────────────────────────────────────── */

export async function getPortfolioPerformanceReport(req: Request, res: Response) {
  try {
    // Get all portfolios with their assets
    const portfolios = await db.portfolio.findMany({
      include: {
        assets: {
          include: {
            asset: true,
          },
        },
        userPortfolios: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            userAssets: {
              include: {
                portfolioAsset: { include: { asset: true } },
              },
            },
          },
        },
      },
    });

    // Calculate portfolio-level metrics
    const portfolioMetrics = portfolios.map((portfolio) => {
      const totalCostPrice = portfolio.assets.reduce((sum, pa) => sum + pa.costPrice, 0);
      const totalCloseValue = portfolio.assets.reduce((sum, pa) => sum + pa.closeValue, 0);
      const totalLossGain = portfolio.assets.reduce((sum, pa) => sum + pa.lossGain, 0);
      const userCount = portfolio.userPortfolios.length;
      const totalUserPortfolioValue = portfolio.userPortfolios.reduce((sum, up) => sum + up.portfolioValue, 0);

      return {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        riskTolerance: portfolio.riskTolerance,
        timeHorizon: portfolio.timeHorizon,
        assetCount: portfolio.assets.length,
        userCount,
        totalCostPrice,
        totalCloseValue,
        totalLossGain,
        performancePercentage: totalCostPrice > 0 ? ((totalCloseValue - totalCostPrice) / totalCostPrice) * 100 : 0,
        totalUserPortfolioValue,
      };
    });

    // Get all assets performance
    const assets = await db.asset.findMany({
      include: {
        portfolios: true,
      },
    });

    const assetPerformance = assets.map((asset) => {
      const priceChange = asset.closePrice - asset.costPerShare;
      const percentageChange = asset.costPerShare > 0 ? (priceChange / asset.costPerShare) * 100 : 0;

      return {
        id: asset.id,
        symbol: asset.symbol,
        description: asset.description,
        sector: asset.sector,
        costPerShare: asset.costPerShare,
        closePrice: asset.closePrice,
        priceChange,
        percentageChange,
        portfolioCount: asset.portfolios.length,
      };
    });

    // Summary
    const summary = {
      totalPortfolios: portfolios.length,
      totalAssets: assets.length,
      totalUsersWithPortfolios: portfolioMetrics.reduce((sum, p) => sum + p.userCount, 0),
      overallLossGain: portfolioMetrics.reduce((sum, p) => sum + p.totalLossGain, 0),
      totalPortfolioValue: portfolioMetrics.reduce((sum, p) => sum + p.totalUserPortfolioValue, 0),
      bestPerformingPortfolio: portfolioMetrics.sort((a, b) => b.performancePercentage - a.performancePercentage)[0],
      worstPerformingPortfolio: portfolioMetrics.sort((a, b) => a.performancePercentage - b.performancePercentage)[0],
      bestPerformingAsset: assetPerformance.sort((a, b) => b.percentageChange - a.percentageChange)[0],
      worstPerformingAsset: assetPerformance.sort((a, b) => a.percentageChange - b.percentageChange)[0],
    };

    // Sector breakdown
    const sectorBreakdown = assets.reduce((acc: Record<string, { count: number; totalValue: number }>, asset) => {
      const sector = asset.sector || "Other";
      if (!acc[sector]) acc[sector] = { count: 0, totalValue: 0 };
      acc[sector].count++;
      acc[sector].totalValue += asset.closePrice;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        summary,
        portfolioMetrics,
        assetPerformance,
        sectorBreakdown,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getPortfolioPerformanceReport error:", error);
    return res.status(500).json({ error: "Failed to generate portfolio performance report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. USER ACTIVITY REPORT
   ───────────────────────────────────────────────────────────────────────────── */

export async function getUserActivityReport(req: Request, res: Response) {
  try {
    const { startDate, endDate, userId, module, action } = req.query as {
      startDate?: string;
      endDate?: string;
      userId?: string;
      module?: string;
      action?: string;
    };

    const dateFilter = parseDateFilters(startDate, endDate);

    const where: any = {};
    if (dateFilter) where.createdAt = dateFilter;
    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (action) where.action = action;

    const activities = await db.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Limit for performance
    });

    // Group by action
    const byAction = activities.reduce((acc: Record<string, number>, a) => {
      acc[a.action] = (acc[a.action] || 0) + 1;
      return acc;
    }, {});

    // Group by module
    const byModule = activities.reduce((acc: Record<string, number>, a) => {
      const mod = a.module || "Unknown";
      acc[mod] = (acc[mod] || 0) + 1;
      return acc;
    }, {});

    // Group by status
    const byStatus = activities.reduce((acc: Record<string, number>, a) => {
      const status = a.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Group by platform
    const byPlatform = activities.reduce((acc: Record<string, number>, a) => {
      const platform = a.platform || "Unknown";
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});

    // Daily activity
    const dailyActivity = activities.reduce((acc: Record<string, number>, a) => {
      const date = a.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Top active users
    const userActivityCount = activities.reduce((acc: Record<string, { user: any; count: number }>, a) => {
      const userId = a.userId;
      if (!acc[userId]) acc[userId] = { user: a.user, count: 0 };
      acc[userId].count++;
      return acc;
    }, {});

    const topActiveUsers = Object.values(userActivityCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const summary = {
      totalActivities: activities.length,
      successRate: activities.length > 0 ? ((byStatus["SUCCESS"] || 0) / activities.length) * 100 : 0,
      failureRate: activities.length > 0 ? ((byStatus["FAILED"] || 0) / activities.length) * 100 : 0,
      uniqueUsers: Object.keys(userActivityCount).length,
      averageResponseTime: activities.filter((a) => a.durationMs).reduce((sum, a) => sum + (a.durationMs || 0), 0) / activities.filter((a) => a.durationMs).length || 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        summary,
        byAction,
        byModule,
        byStatus,
        byPlatform,
        dailyActivity,
        topActiveUsers,
        recentActivities: activities.slice(0, 100), // Return only recent 100
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getUserActivityReport error:", error);
    return res.status(500).json({ error: "Failed to generate user activity report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. COMPREHENSIVE FINANCIAL SUMMARY REPORT
   ───────────────────────────────────────────────────────────────────────────── */

export async function getComprehensiveFinancialReport(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const dateFilter = parseDateFilters(startDate, endDate);
    const createdAtFilter = dateFilter ? { createdAt: dateFilter } : {};

    // Parallel queries for performance
    const [
      deposits,
      withdrawals,
      wallets,
      users,
      portfolios,
      assets,
      userPortfolios,
    ] = await Promise.all([
      db.deposit.findMany({ where: createdAtFilter }),
      db.withdrawal.findMany({ where: createdAtFilter }),
      db.wallet.findMany(),
      db.user.findMany({ select: { id: true, status: true, role: true, createdAt: true } }),
      db.portfolio.findMany({ include: { assets: true } }),
      db.asset.findMany(),
      db.userPortfolio.findMany(),
    ]);

    // Calculate metrics
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
    const approvedDeposits = deposits.filter((d) => d.transactionStatus === "APPROVED");
    const totalApprovedDeposits = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);

    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const approvedWithdrawals = withdrawals.filter((w) => w.transactionStatus === "APPROVED");
    const totalApprovedWithdrawals = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalNetAssetValue = wallets.reduce((sum, w) => sum + w.netAssetValue, 0);
    const totalFeesCollected = wallets.reduce((sum, w) => sum + w.totalFees, 0);

    const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
    const pendingUsers = users.filter((u) => u.status === "PENDING").length;

    const totalPortfolioValue = userPortfolios.reduce((sum, up) => sum + up.portfolioValue, 0);

    // Net cash flow
    const netCashFlow = totalApprovedDeposits - totalApprovedWithdrawals;

    // Growth metrics (if date range provided)
    let growthMetrics = null;
    if (dateFilter) {
      const previousPeriodDeposits = await db.deposit.aggregate({
        _sum: { amount: true },
        where: {
          transactionStatus: "APPROVED",
          createdAt: {
            lt: dateFilter.gte,
            gte: dateFilter.gte ? new Date(dateFilter.gte.getTime() - (dateFilter.lte!.getTime() - dateFilter.gte.getTime())) : undefined,
          },
        },
      });

      const previousPeriodWithdrawals = await db.withdrawal.aggregate({
        _sum: { amount: true },
        where: {
          transactionStatus: "APPROVED",
          createdAt: {
            lt: dateFilter.gte,
            gte: dateFilter.gte ? new Date(dateFilter.gte.getTime() - (dateFilter.lte!.getTime() - dateFilter.gte.getTime())) : undefined,
          },
        },
      });

      const previousDeposits = previousPeriodDeposits._sum.amount || 0;
      const previousWithdrawals = previousPeriodWithdrawals._sum.amount || 0;

      growthMetrics = {
        depositGrowth: previousDeposits > 0 ? ((totalApprovedDeposits - previousDeposits) / previousDeposits) * 100 : null,
        withdrawalGrowth: previousWithdrawals > 0 ? ((totalApprovedWithdrawals - previousWithdrawals) / previousWithdrawals) * 100 : null,
      };
    }

    const report = {
      overview: {
        reportPeriod: {
          startDate: startDate || "All time",
          endDate: endDate || "Present",
        },
        generatedAt: new Date().toISOString(),
      },
      financialSummary: {
        deposits: {
          total: totalDeposits,
          totalFormatted: formatCurrency(totalDeposits),
          approved: totalApprovedDeposits,
          approvedFormatted: formatCurrency(totalApprovedDeposits),
          count: deposits.length,
          approvedCount: approvedDeposits.length,
        },
        withdrawals: {
          total: totalWithdrawals,
          totalFormatted: formatCurrency(totalWithdrawals),
          approved: totalApprovedWithdrawals,
          approvedFormatted: formatCurrency(totalApprovedWithdrawals),
          count: withdrawals.length,
          approvedCount: approvedWithdrawals.length,
        },
        netCashFlow: {
          amount: netCashFlow,
          amountFormatted: formatCurrency(netCashFlow),
          status: netCashFlow >= 0 ? "POSITIVE" : "NEGATIVE",
        },
        fees: {
          total: totalFeesCollected,
          totalFormatted: formatCurrency(totalFeesCollected),
        },
      },
      walletMetrics: {
        totalWallets: wallets.length,
        totalBalance: totalWalletBalance,
        totalBalanceFormatted: formatCurrency(totalWalletBalance),
        totalNetAssetValue: totalNetAssetValue,
        totalNetAssetValueFormatted: formatCurrency(totalNetAssetValue),
        averageBalance: wallets.length > 0 ? totalWalletBalance / wallets.length : 0,
        activeWallets: wallets.filter((w) => w.status === "ACTIVE").length,
        inactiveWallets: wallets.filter((w) => w.status === "INACTIVE").length,
        frozenWallets: wallets.filter((w) => w.status === "FROZEN").length,
      },
      userMetrics: {
        totalUsers: users.length,
        activeUsers,
        pendingUsers,
        suspendedUsers: users.filter((u) => u.status === "SUSPENDED").length,
        usersByRole: {
          superAdmin: users.filter((u) => u.role === "SUPER_ADMIN").length,
          admin: users.filter((u) => u.role === "ADMIN").length,
          manager: users.filter((u) => u.role === "MANAGER").length,
          user: users.filter((u) => u.role === "USER").length,
        },
      },
      portfolioMetrics: {
        totalPortfolios: portfolios.length,
        totalAssets: assets.length,
        totalUserPortfolios: userPortfolios.length,
        totalPortfolioValue,
        totalPortfolioValueFormatted: formatCurrency(totalPortfolioValue),
      },
      growthMetrics,
      keyInsights: generateKeyInsights({
        netCashFlow,
        activeUsers,
        pendingUsers,
        totalDeposits,
        totalWithdrawals,
        totalWalletBalance,
      }),
    };

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("getComprehensiveFinancialReport error:", error);
    return res.status(500).json({ error: "Failed to generate comprehensive financial report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. TRANSACTION TRENDS REPORT
   ───────────────────────────────────────────────────────────────────────────── */

export async function getTransactionTrendsReport(req: Request, res: Response) {
  try {
    const { period = "daily", limit = "30" } = req.query as { period?: string; limit?: string };

    const limitNum = parseInt(limit, 10) || 30;

    // Get deposits and withdrawals for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - limitNum);

    const [deposits, withdrawals] = await Promise.all([
      db.deposit.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "asc" },
      }),
      db.withdrawal.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Group by period
    const getGroupKey = (date: Date): string => {
      if (period === "weekly") {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split("T")[0];
      } else if (period === "monthly") {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      return date.toISOString().split("T")[0]; // daily
    };

    const trends: Record<string, { date: string; deposits: number; withdrawals: number; netFlow: number; depositCount: number; withdrawalCount: number }> = {};

    deposits.forEach((d) => {
      const key = getGroupKey(d.createdAt);
      if (!trends[key]) trends[key] = { date: key, deposits: 0, withdrawals: 0, netFlow: 0, depositCount: 0, withdrawalCount: 0 };
      trends[key].deposits += d.amount;
      trends[key].depositCount++;
    });

    withdrawals.forEach((w) => {
      const key = getGroupKey(w.createdAt);
      if (!trends[key]) trends[key] = { date: key, deposits: 0, withdrawals: 0, netFlow: 0, depositCount: 0, withdrawalCount: 0 };
      trends[key].withdrawals += w.amount;
      trends[key].withdrawalCount++;
    });

    // Calculate net flow
    Object.values(trends).forEach((t) => {
      t.netFlow = t.deposits - t.withdrawals;
    });

    const trendData = Object.values(trends).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate statistics
    const totalDeposits = trendData.reduce((sum, t) => sum + t.deposits, 0);
    const totalWithdrawals = trendData.reduce((sum, t) => sum + t.withdrawals, 0);
    const avgDailyDeposits = totalDeposits / trendData.length || 0;
    const avgDailyWithdrawals = totalWithdrawals / trendData.length || 0;

    // Find peak days
    const peakDepositDay = trendData.reduce((max, t) => (t.deposits > max.deposits ? t : max), trendData[0]);
    const peakWithdrawalDay = trendData.reduce((max, t) => (t.withdrawals > max.withdrawals ? t : max), trendData[0]);

    return res.status(200).json({
      success: true,
      data: {
        period,
        trends: trendData,
        statistics: {
          totalDeposits,
          totalWithdrawals,
          netFlow: totalDeposits - totalWithdrawals,
          averageDeposits: avgDailyDeposits,
          averageWithdrawals: avgDailyWithdrawals,
          peakDepositDay,
          peakWithdrawalDay,
          dataPoints: trendData.length,
        },
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getTransactionTrendsReport error:", error);
    return res.status(500).json({ error: "Failed to generate transaction trends report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
   ───────────────────────────────────────────────────────────────────────────── */

function generateKeyInsights(metrics: {
  netCashFlow: number;
  activeUsers: number;
  pendingUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWalletBalance: number;
}): string[] {
  const insights: string[] = [];

  if (metrics.netCashFlow > 0) {
    insights.push(`Positive net cash flow of ${formatCurrency(metrics.netCashFlow)}`);
  } else if (metrics.netCashFlow < 0) {
    insights.push(`Negative net cash flow of ${formatCurrency(Math.abs(metrics.netCashFlow))} - monitor withdrawal patterns`);
  }

  if (metrics.pendingUsers > 10) {
    insights.push(`${metrics.pendingUsers} users pending verification - consider expediting onboarding`);
  }

  if (metrics.totalDeposits > metrics.totalWithdrawals * 1.5) {
    insights.push("Strong deposit activity - healthy inflow trend");
  }

  if (metrics.totalWithdrawals > metrics.totalDeposits) {
    insights.push("Withdrawal volume exceeds deposits - monitor liquidity");
  }

  return insights;
}