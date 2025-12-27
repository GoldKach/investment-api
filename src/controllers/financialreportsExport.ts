import { Request, Response } from "express";
import { db } from "@/db/db";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

/* ─────────────────────────────────────────────────────────────────────────────
   EXCEL EXPORT SERVICE FOR FINANCIAL REPORTS
   ───────────────────────────────────────────────────────────────────────────── */

const EXPORTS_DIR = path.join(process.cwd(), "exports");

// Ensure exports directory exists
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

interface DateFilter {
  gte?: Date;
  lte?: Date;
}

const parseDateFilters = (startDate?: string, endDate?: string): DateFilter | undefined => {
  if (!startDate && !endDate) return undefined;
  const filter: DateFilter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return filter;
};

const formatCurrency = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

const applyHeaderStyle = (row: ExcelJS.Row) => {
  row.eachCell((cell:any) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  row.height = 25;
};

const applyCurrencyFormat = (cell: ExcelJS.Cell) => {
  cell.numFmt = '#,##0.00 "UGX"';
};

const applyDataStyle = (row: ExcelJS.Row) => {
  row.eachCell((cell:any) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    cell.alignment = { vertical: "middle" };
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   1. EXPORT DEPOSITS REPORT TO EXCEL
   ───────────────────────────────────────────────────────────────────────────── */

export async function exportDepositsToExcel(req: Request, res: Response) {
  try {
    const { startDate, endDate, status } = req.query as { startDate?: string; endDate?: string; status?: string };

    const dateFilter = parseDateFilters(startDate, endDate);
    const where: any = {};
    if (dateFilter) where.createdAt = dateFilter;
    if (status) where.transactionStatus = status;

    const deposits = await db.deposit.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        wallet: { select: { accountNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GoldKach Financial System";
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary", { properties: { tabColor: { argb: "FF1E3A5F" } } });
    
    const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
    const pending = deposits.filter((d) => d.transactionStatus === "PENDING");
    const approved = deposits.filter((d) => d.transactionStatus === "APPROVED");
    const rejected = deposits.filter((d) => d.transactionStatus === "REJECTED");

    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 25 },
    ];

    const summaryData = [
      { metric: "Report Generated", value: new Date().toLocaleString() },
      { metric: "Report Period", value: `${startDate || "All time"} to ${endDate || "Present"}` },
      { metric: "", value: "" },
      { metric: "Total Deposits", value: deposits.length },
      { metric: "Total Amount (UGX)", value: formatCurrency(totalAmount) },
      { metric: "Average Deposit (UGX)", value: formatCurrency(deposits.length > 0 ? totalAmount / deposits.length : 0) },
      { metric: "", value: "" },
      { metric: "Pending Deposits", value: pending.length },
      { metric: "Pending Amount (UGX)", value: formatCurrency(pending.reduce((sum, d) => sum + d.amount, 0)) },
      { metric: "Approved Deposits", value: approved.length },
      { metric: "Approved Amount (UGX)", value: formatCurrency(approved.reduce((sum, d) => sum + d.amount, 0)) },
      { metric: "Rejected Deposits", value: rejected.length },
      { metric: "Rejected Amount (UGX)", value: formatCurrency(rejected.reduce((sum, d) => sum + d.amount, 0)) },
    ];

    summaryData.forEach((data) => summarySheet.addRow(data));
    applyHeaderStyle(summarySheet.getRow(1));

    // Details Sheet
    const detailsSheet = workbook.addWorksheet("Deposits Details", { properties: { tabColor: { argb: "FF28A745" } } });
    
    detailsSheet.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "Date", key: "date", width: 20 },
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Account No", key: "accountNo", width: 20 },
      { header: "Amount (UGX)", key: "amount", width: 18 },
      { header: "Method", key: "method", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Transaction ID", key: "transactionId", width: 25 },
      { header: "Reference No", key: "referenceNo", width: 20 },
      { header: "Approved By", key: "approvedBy", width: 20 },
    ];

    deposits.forEach((deposit, index) => {
      const row = detailsSheet.addRow({
        id: deposit.id.slice(-8).toUpperCase(),
        date: deposit.createdAt.toLocaleString(),
        customerName: `${deposit.user.firstName} ${deposit.user.lastName}`,
        email: deposit.user.email,
        phone: deposit.user.phone,
        accountNo: deposit.wallet.accountNumber,
        amount: formatCurrency(deposit.amount),
        method: deposit.method || "N/A",
        status: deposit.transactionStatus,
        transactionId: deposit.transactionId || "N/A",
        referenceNo: deposit.referenceNo || "N/A",
        approvedBy: deposit.ApprovedBy || "N/A",
      });

      applyDataStyle(row);
      applyCurrencyFormat(row.getCell("amount"));

      // Color code status
      const statusCell = row.getCell("status");
      if (deposit.transactionStatus === "APPROVED") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
      } else if (deposit.transactionStatus === "PENDING") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
      } else if (deposit.transactionStatus === "REJECTED") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } };
      }
    });

    applyHeaderStyle(detailsSheet.getRow(1));

    // Auto-filter
    detailsSheet.autoFilter = {
      from: "A1",
      to: `L${deposits.length + 1}`,
    };

    const filename = `deposits_report_${new Date().toISOString().split("T")[0]}.xlsx`;
    const filepath = path.join(EXPORTS_DIR, filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error("Download error:", err);
      // Clean up file after download
      setTimeout(() => fs.unlinkSync(filepath), 60000);
    });
  } catch (error) {
    console.error("exportDepositsToExcel error:", error);
    return res.status(500).json({ error: "Failed to export deposits report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. EXPORT WITHDRAWALS REPORT TO EXCEL
   ───────────────────────────────────────────────────────────────────────────── */

export async function exportWithdrawalsToExcel(req: Request, res: Response) {
  try {
    const { startDate, endDate, status } = req.query as { startDate?: string; endDate?: string; status?: string };

    const dateFilter = parseDateFilters(startDate, endDate);
    const where: any = {};
    if (dateFilter) where.createdAt = dateFilter;
    if (status) where.transactionStatus = status;

    const withdrawals = await db.withdrawal.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        wallet: { select: { accountNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GoldKach Financial System";
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary", { properties: { tabColor: { argb: "FF1E3A5F" } } });
    
    const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const pending = withdrawals.filter((w) => w.transactionStatus === "PENDING");
    const approved = withdrawals.filter((w) => w.transactionStatus === "APPROVED");
    const rejected = withdrawals.filter((w) => w.transactionStatus === "REJECTED");

    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 25 },
    ];

    const summaryData = [
      { metric: "Report Generated", value: new Date().toLocaleString() },
      { metric: "Report Period", value: `${startDate || "All time"} to ${endDate || "Present"}` },
      { metric: "", value: "" },
      { metric: "Total Withdrawals", value: withdrawals.length },
      { metric: "Total Amount (UGX)", value: formatCurrency(totalAmount) },
      { metric: "Average Withdrawal (UGX)", value: formatCurrency(withdrawals.length > 0 ? totalAmount / withdrawals.length : 0) },
      { metric: "", value: "" },
      { metric: "Pending Withdrawals", value: pending.length },
      { metric: "Pending Amount (UGX)", value: formatCurrency(pending.reduce((sum, w) => sum + w.amount, 0)) },
      { metric: "Approved Withdrawals", value: approved.length },
      { metric: "Approved Amount (UGX)", value: formatCurrency(approved.reduce((sum, w) => sum + w.amount, 0)) },
      { metric: "Rejected Withdrawals", value: rejected.length },
      { metric: "Rejected Amount (UGX)", value: formatCurrency(rejected.reduce((sum, w) => sum + w.amount, 0)) },
    ];

    summaryData.forEach((data) => summarySheet.addRow(data));
    applyHeaderStyle(summarySheet.getRow(1));

    // Details Sheet
    const detailsSheet = workbook.addWorksheet("Withdrawals Details", { properties: { tabColor: { argb: "FFDC3545" } } });
    
    detailsSheet.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "Date", key: "date", width: 20 },
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Wallet Account", key: "walletAccount", width: 20 },
      { header: "Amount (UGX)", key: "amount", width: 18 },
      { header: "Bank Name", key: "bankName", width: 20 },
      { header: "Bank Account", key: "bankAccount", width: 20 },
      { header: "Branch", key: "branch", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Reference No", key: "referenceNo", width: 20 },
    ];

    withdrawals.forEach((withdrawal) => {
      const row = detailsSheet.addRow({
        id: withdrawal.id.slice(-8).toUpperCase(),
        date: withdrawal.createdAt.toLocaleString(),
        customerName: `${withdrawal.user.firstName} ${withdrawal.user.lastName}`,
        email: withdrawal.user.email,
        phone: withdrawal.user.phone,
        walletAccount: withdrawal.wallet.accountNumber,
        amount: formatCurrency(withdrawal.amount),
        bankName: withdrawal.bankName,
        bankAccount: withdrawal.bankAccountName,
        branch: withdrawal.bankBranch,
        status: withdrawal.transactionStatus,
        referenceNo: withdrawal.referenceNo,
      });

      applyDataStyle(row);
      applyCurrencyFormat(row.getCell("amount"));

      const statusCell = row.getCell("status");
      if (withdrawal.transactionStatus === "APPROVED") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
      } else if (withdrawal.transactionStatus === "PENDING") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
      } else if (withdrawal.transactionStatus === "REJECTED") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } };
      }
    });

    applyHeaderStyle(detailsSheet.getRow(1));

    detailsSheet.autoFilter = {
      from: "A1",
      to: `L${withdrawals.length + 1}`,
    };

    const filename = `withdrawals_report_${new Date().toISOString().split("T")[0]}.xlsx`;
    const filepath = path.join(EXPORTS_DIR, filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error("Download error:", err);
      setTimeout(() => fs.unlinkSync(filepath), 60000);
    });
  } catch (error) {
    console.error("exportWithdrawalsToExcel error:", error);
    return res.status(500).json({ error: "Failed to export withdrawals report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. EXPORT COMPREHENSIVE FINANCIAL REPORT TO EXCEL
   ───────────────────────────────────────────────────────────────────────────── */

export async function exportComprehensiveReportToExcel(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const dateFilter = parseDateFilters(startDate, endDate);
    const createdAtFilter = dateFilter ? { createdAt: dateFilter } : {};

    const [deposits, withdrawals, wallets, users, portfolios, userPortfolios] = await Promise.all([
      db.deposit.findMany({
        where: createdAtFilter,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      db.withdrawal.findMany({
        where: createdAtFilter,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      db.wallet.findMany({ include: { user: { select: { firstName: true, lastName: true } } } }),
      db.user.findMany({ select: { id: true, firstName: true, lastName: true, status: true, role: true } }),
      db.portfolio.findMany({ include: { assets: { include: { asset: true } } } }),
      db.userPortfolio.findMany(),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GoldKach Financial System";
    workbook.created = new Date();

    // ═══════════════════════════════════════════════════════════════════════
    // EXECUTIVE SUMMARY SHEET
    // ═══════════════════════════════════════════════════════════════════════
    const summarySheet = workbook.addWorksheet("Executive Summary", {
      properties: { tabColor: { argb: "FF1E3A5F" } },
    });

    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
    const approvedDeposits = deposits.filter((d) => d.transactionStatus === "APPROVED");
    const totalApprovedDeposits = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);

    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const approvedWithdrawals = withdrawals.filter((w) => w.transactionStatus === "APPROVED");
    const totalApprovedWithdrawals = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalNetAssetValue = wallets.reduce((sum, w) => sum + w.netAssetValue, 0);
    const totalFees = wallets.reduce((sum, w) => sum + w.totalFees, 0);
    const netCashFlow = totalApprovedDeposits - totalApprovedWithdrawals;

    summarySheet.columns = [
      { header: "Category", key: "category", width: 35 },
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 25 },
    ];

    const executiveSummary = [
      { category: "REPORT INFORMATION", metric: "", value: "" },
      { category: "", metric: "Generated At", value: new Date().toLocaleString() },
      { category: "", metric: "Period", value: `${startDate || "All time"} - ${endDate || "Present"}` },
      { category: "", metric: "", value: "" },
      { category: "DEPOSITS", metric: "", value: "" },
      { category: "", metric: "Total Deposits Count", value: deposits.length },
      { category: "", metric: "Total Deposits Amount", value: formatCurrency(totalDeposits) },
      { category: "", metric: "Approved Deposits", value: approvedDeposits.length },
      { category: "", metric: "Approved Amount", value: formatCurrency(totalApprovedDeposits) },
      { category: "", metric: "", value: "" },
      { category: "WITHDRAWALS", metric: "", value: "" },
      { category: "", metric: "Total Withdrawals Count", value: withdrawals.length },
      { category: "", metric: "Total Withdrawals Amount", value: formatCurrency(totalWithdrawals) },
      { category: "", metric: "Approved Withdrawals", value: approvedWithdrawals.length },
      { category: "", metric: "Approved Amount", value: formatCurrency(totalApprovedWithdrawals) },
      { category: "", metric: "", value: "" },
      { category: "CASH FLOW", metric: "", value: "" },
      { category: "", metric: "Net Cash Flow", value: formatCurrency(netCashFlow) },
      { category: "", metric: "Flow Status", value: netCashFlow >= 0 ? "POSITIVE" : "NEGATIVE" },
      { category: "", metric: "", value: "" },
      { category: "WALLET METRICS", metric: "", value: "" },
      { category: "", metric: "Total Wallets", value: wallets.length },
      { category: "", metric: "Total Balance", value: formatCurrency(totalWalletBalance) },
      { category: "", metric: "Total Net Asset Value", value: formatCurrency(totalNetAssetValue) },
      { category: "", metric: "Total Fees Collected", value: formatCurrency(totalFees) },
      { category: "", metric: "", value: "" },
      { category: "USER METRICS", metric: "", value: "" },
      { category: "", metric: "Total Users", value: users.length },
      { category: "", metric: "Active Users", value: users.filter((u) => u.status === "ACTIVE").length },
      { category: "", metric: "Pending Users", value: users.filter((u) => u.status === "PENDING").length },
      { category: "", metric: "", value: "" },
      { category: "PORTFOLIO METRICS", metric: "", value: "" },
      { category: "", metric: "Total Portfolios", value: portfolios.length },
      { category: "", metric: "User Portfolios", value: userPortfolios.length },
      { category: "", metric: "Total Portfolio Value", value: formatCurrency(userPortfolios.reduce((sum, up) => sum + up.portfolioValue, 0)) },
    ];

    executiveSummary.forEach((data, index) => {
      const row = summarySheet.addRow(data);
      if (data.category && data.category !== "") {
        row.getCell("category").font = { bold: true, size: 12 };
        row.getCell("category").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E8E8" } };
      }
    });

    applyHeaderStyle(summarySheet.getRow(1));

    // ═══════════════════════════════════════════════════════════════════════
    // DEPOSITS SHEET
    // ═══════════════════════════════════════════════════════════════════════
    const depositsSheet = workbook.addWorksheet("Deposits", { properties: { tabColor: { argb: "FF28A745" } } });

    depositsSheet.columns = [
      { header: "Date", key: "date", width: 20 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Amount (UGX)", key: "amount", width: 18 },
      { header: "Method", key: "method", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Reference", key: "reference", width: 20 },
    ];

    deposits.forEach((d) => {
      const row = depositsSheet.addRow({
        date: d.createdAt.toLocaleString(),
        customer: `${d.user.firstName} ${d.user.lastName}`,
        amount: formatCurrency(d.amount),
        method: d.method || "N/A",
        status: d.transactionStatus,
        reference: d.referenceNo || "N/A",
      });
      applyDataStyle(row);
      applyCurrencyFormat(row.getCell("amount"));
    });

    applyHeaderStyle(depositsSheet.getRow(1));

    // ═══════════════════════════════════════════════════════════════════════
    // WITHDRAWALS SHEET
    // ═══════════════════════════════════════════════════════════════════════
    const withdrawalsSheet = workbook.addWorksheet("Withdrawals", { properties: { tabColor: { argb: "FFDC3545" } } });

    withdrawalsSheet.columns = [
      { header: "Date", key: "date", width: 20 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Amount (UGX)", key: "amount", width: 18 },
      { header: "Bank", key: "bank", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Reference", key: "reference", width: 20 },
    ];

    withdrawals.forEach((w) => {
      const row = withdrawalsSheet.addRow({
        date: w.createdAt.toLocaleString(),
        customer: `${w.user.firstName} ${w.user.lastName}`,
        amount: formatCurrency(w.amount),
        bank: w.bankName,
        status: w.transactionStatus,
        reference: w.referenceNo,
      });
      applyDataStyle(row);
      applyCurrencyFormat(row.getCell("amount"));
    });

    applyHeaderStyle(withdrawalsSheet.getRow(1));

    // ═══════════════════════════════════════════════════════════════════════
    // WALLETS SHEET
    // ═══════════════════════════════════════════════════════════════════════
    const walletsSheet = workbook.addWorksheet("Wallets", { properties: { tabColor: { argb: "FF17A2B8" } } });

    walletsSheet.columns = [
      { header: "Account Number", key: "accountNumber", width: 20 },
      { header: "Owner", key: "owner", width: 25 },
      { header: "Balance (UGX)", key: "balance", width: 18 },
      { header: "Net Asset Value", key: "nav", width: 18 },
      { header: "Total Fees", key: "fees", width: 15 },
      { header: "Status", key: "status", width: 12 },
    ];

    wallets.forEach((w) => {
      const row = walletsSheet.addRow({
        accountNumber: w.accountNumber,
        owner: `${w.user.firstName} ${w.user.lastName}`,
        balance: formatCurrency(w.balance),
        nav: formatCurrency(w.netAssetValue),
        fees: formatCurrency(w.totalFees),
        status: w.status,
      });
      applyDataStyle(row);
      applyCurrencyFormat(row.getCell("balance"));
      applyCurrencyFormat(row.getCell("nav"));
      applyCurrencyFormat(row.getCell("fees"));
    });

    applyHeaderStyle(walletsSheet.getRow(1));

    // ═══════════════════════════════════════════════════════════════════════
    // PORTFOLIOS SHEET
    // ═══════════════════════════════════════════════════════════════════════
    const portfoliosSheet = workbook.addWorksheet("Portfolios", { properties: { tabColor: { argb: "FF6F42C1" } } });

    portfoliosSheet.columns = [
      { header: "Portfolio Name", key: "name", width: 25 },
      { header: "Risk Tolerance", key: "risk", width: 15 },
      { header: "Time Horizon", key: "horizon", width: 15 },
      { header: "Assets Count", key: "assetCount", width: 12 },
      { header: "Total Cost", key: "totalCost", width: 18 },
      { header: "Close Value", key: "closeValue", width: 18 },
      { header: "Gain/Loss", key: "gainLoss", width: 18 },
    ];

    portfolios.forEach((p) => {
      const totalCost = p.assets.reduce((sum, a) => sum + a.costPrice, 0);
      const closeValue = p.assets.reduce((sum, a) => sum + a.closeValue, 0);
      const gainLoss = p.assets.reduce((sum, a) => sum + a.lossGain, 0);

      const row = portfoliosSheet.addRow({
        name: p.name,
        risk: p.riskTolerance,
        horizon: p.timeHorizon,
        assetCount: p.assets.length,
        totalCost: formatCurrency(totalCost),
        closeValue: formatCurrency(closeValue),
        gainLoss: formatCurrency(gainLoss),
      });
      applyDataStyle(row);

      // Color code gain/loss
      const glCell = row.getCell("gainLoss");
      if (gainLoss > 0) {
        glCell.font = { color: { argb: "FF28A745" } };
      } else if (gainLoss < 0) {
        glCell.font = { color: { argb: "FFDC3545" } };
      }
    });

    applyHeaderStyle(portfoliosSheet.getRow(1));

    const filename = `comprehensive_financial_report_${new Date().toISOString().split("T")[0]}.xlsx`;
    const filepath = path.join(EXPORTS_DIR, filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error("Download error:", err);
      setTimeout(() => fs.unlinkSync(filepath), 60000);
    });
  } catch (error) {
    console.error("exportComprehensiveReportToExcel error:", error);
    return res.status(500).json({ error: "Failed to export comprehensive financial report." });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. EXPORT WALLETS REPORT TO EXCEL
   ───────────────────────────────────────────────────────────────────────────── */

export async function exportWalletsToExcel(req: Request, res: Response) {
  try {
    const { status } = req.query as { status?: string };

    const where: any = {};
    if (status) where.status = status;

    const wallets = await db.wallet.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, status: true } },
        _count: { select: { deposits: true, withdrawals: true } },
      },
      orderBy: { balance: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GoldKach Financial System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Wallets Report", { properties: { tabColor: { argb: "FF17A2B8" } } });

    sheet.columns = [
      { header: "Account Number", key: "accountNumber", width: 22 },
      { header: "Owner Name", key: "ownerName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Balance (UGX)", key: "balance", width: 18 },
      { header: "Net Asset Value", key: "nav", width: 18 },
      { header: "Bank Fee", key: "bankFee", width: 12 },
      { header: "Transaction Fee", key: "txFee", width: 15 },
      { header: "Total Fees", key: "totalFees", width: 12 },
      { header: "Deposits", key: "deposits", width: 10 },
      { header: "Withdrawals", key: "withdrawals", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Created", key: "created", width: 18 },
    ];

    wallets.forEach((w) => {
      const row = sheet.addRow({
        accountNumber: w.accountNumber,
        ownerName: `${w.user.firstName} ${w.user.lastName}`,
        email: w.user.email,
        phone: w.user.phone,
        balance: formatCurrency(w.balance),
        nav: formatCurrency(w.netAssetValue),
        bankFee: formatCurrency(w.bankFee),
        txFee: formatCurrency(w.transactionFee),
        totalFees: formatCurrency(w.totalFees),
        deposits: w._count.deposits,
        withdrawals: w._count.withdrawals,
        status: w.status,
        created: w.createdAt.toLocaleDateString(),
      });

      applyDataStyle(row);
      applyCurrencyFormat(row.getCell("balance"));
      applyCurrencyFormat(row.getCell("nav"));
    });

    applyHeaderStyle(sheet.getRow(1));

    // Add summary at bottom
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalNav = wallets.reduce((sum, w) => sum + w.netAssetValue, 0);

    sheet.addRow({});
    const summaryRow = sheet.addRow({
      accountNumber: "TOTALS",
      balance: formatCurrency(totalBalance),
      nav: formatCurrency(totalNav),
    });
    summaryRow.font = { bold: true };

    const filename = `wallets_report_${new Date().toISOString().split("T")[0]}.xlsx`;
    const filepath = path.join(EXPORTS_DIR, filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error("Download error:", err);
      setTimeout(() => fs.unlinkSync(filepath), 60000);
    });
  } catch (error) {
    console.error("exportWalletsToExcel error:", error);
    return res.status(500).json({ error: "Failed to export wallets report." });
  }
}