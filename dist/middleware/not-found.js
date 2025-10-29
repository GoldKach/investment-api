export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.path} not found`,
    });
};
