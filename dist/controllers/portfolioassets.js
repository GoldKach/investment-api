import { db } from "../db/db";
/* helpers */
const toNum = (v, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};
const calcLossGain = (costPrice, closeValue, stock) => (closeValue - costPrice) * stock;
/** POST /portfolioassets */
export async function createPortfolioAsset(req, res) {
    try {
        const { portfolioId, assetId } = req.body;
        if (!portfolioId || !assetId) {
            return res.status(400).json({ error: "portfolioId and assetId are required." });
        }
        // optional numeric fields
        const stock = toNum(req.body.stock, 0);
        const costPrice = toNum(req.body.costPrice, 0);
        // default closeValue to Asset.closePrice if not provided
        let closeValue = req.body.closeValue;
        if (closeValue === undefined || closeValue === null || closeValue === "") {
            const a = await db.asset.findUnique({ where: { id: assetId }, select: { closePrice: true } });
            if (!a)
                return res.status(404).json({ error: "Asset not found." });
            closeValue = a.closePrice;
        }
        closeValue = toNum(closeValue, 0);
        // existence checks
        const [p, a] = await Promise.all([
            db.portfolio.findUnique({ where: { id: portfolioId }, select: { id: true } }),
            db.asset.findUnique({ where: { id: assetId }, select: { id: true } }),
        ]);
        if (!p)
            return res.status(404).json({ error: "Portfolio not found." });
        if (!a)
            return res.status(404).json({ error: "Asset not found." });
        const lossGain = calcLossGain(costPrice, closeValue, stock);
        const row = await db.portfolioAsset.create({
            data: { portfolioId, assetId, stock, costPrice, closeValue, lossGain },
            include: {
                asset: { select: { id: true, symbol: true, description: true, sector: true, costPerShare: true, closePrice: true } },
                portfolio: { select: { id: true, name: true } },
            },
        });
        return res.status(201).json({ data: row });
    }
    catch (e) {
        if (e?.code === "P2002") {
            // @@unique([portfolioId, assetId])
            return res.status(409).json({ error: "Asset already exists in this portfolio." });
        }
        console.error("createPortfolioAsset error:", e);
        return res.status(500).json({ error: "Failed to create portfolio asset." });
    }
}
/** GET /portfolioassets?portfolioId=... */
export async function listPortfolioAssets(req, res) {
    try {
        const { portfolioId } = req.query;
        const where = portfolioId ? { portfolioId } : undefined;
        const rows = await db.portfolioAsset.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                asset: { select: { id: true, symbol: true, description: true, sector: true, costPerShare: true, closePrice: true } },
                portfolio: { select: { id: true, name: true } },
            },
        });
        return res.status(200).json({ data: rows });
    }
    catch (e) {
        console.error("listPortfolioAssets error:", e);
        return res.status(500).json({ error: "Failed to load portfolio assets." });
    }
}
/** GET /portfolioassets/:id */
export async function getPortfolioAssetById(req, res) {
    try {
        const { id } = req.params;
        const row = await db.portfolioAsset.findUnique({
            where: { id },
            include: {
                asset: { select: { id: true, symbol: true, description: true, sector: true, costPerShare: true, closePrice: true } },
                portfolio: { select: { id: true, name: true } },
            },
        });
        if (!row)
            return res.status(404).json({ error: "Portfolio asset not found." });
        return res.status(200).json({ data: row });
    }
    catch (e) {
        console.error("getPortfolioAssetById error:", e);
        return res.status(500).json({ error: "Failed to load portfolio asset." });
    }
}
/** PATCH /portfolioassets/:id */
export async function updatePortfolioAsset(req, res) {
    try {
        const { id } = req.params;
        const current = await db.portfolioAsset.findUnique({ where: { id } });
        if (!current)
            return res.status(404).json({ error: "Portfolio asset not found." });
        const stock = req.body.stock !== undefined ? toNum(req.body.stock, current.stock) : current.stock;
        const costPrice = req.body.costPrice !== undefined ? toNum(req.body.costPrice, current.costPrice) : current.costPrice;
        const closeValue = req.body.closeValue !== undefined ? toNum(req.body.closeValue, current.closeValue) : current.closeValue;
        const lossGain = calcLossGain(costPrice, closeValue, stock);
        const updated = await db.portfolioAsset.update({
            where: { id },
            data: { stock, costPrice, closeValue, lossGain },
            include: {
                asset: { select: { id: true, symbol: true, description: true, sector: true, costPerShare: true, closePrice: true } },
                portfolio: { select: { id: true, name: true } },
            },
        });
        return res.status(200).json({ data: updated });
    }
    catch (e) {
        console.error("updatePortfolioAsset error:", e);
        return res.status(500).json({ error: "Failed to update portfolio asset." });
    }
}
/** DELETE /portfolioassets/:id */
export async function deletePortfolioAsset(req, res) {
    try {
        const { id } = req.params;
        await db.portfolioAsset.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (e) {
        if (e?.code === "P2025")
            return res.status(404).json({ error: "Portfolio asset not found." });
        console.error("deletePortfolioAsset error:", e);
        return res.status(500).json({ error: "Failed to delete portfolio asset." });
    }
}
/** convenience: GET /portfolios/:portfolioId/portfolioassets */
export async function listPortfolioAssetsForPortfolio(req, res) {
    req.query.portfolioId = req.params.portfolioId;
    return listPortfolioAssets(req, res);
}
