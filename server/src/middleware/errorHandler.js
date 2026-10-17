const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Handle invalid MongoDB ObjectId and schema casting errors.
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid resource ID.",
        });
    }

    // Preserve application-defined error responses.
    const statusCode = err.statusCode || 500;
    const message =
        statusCode === 500
            ? "Internal Server Error"
            : err.message;

    return res.status(statusCode).json({
        success: false,
        message,
    });
};

export default errorHandler;