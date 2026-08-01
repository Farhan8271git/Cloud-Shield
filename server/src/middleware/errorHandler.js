const errorHandler = (err, req, res, next) => {
    console.error(err);

     const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

     res.status(statusCode).json({
        successs: false,
        message: err.message || "Internal server error",
    });

};

export default errorHandler;