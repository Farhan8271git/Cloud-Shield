class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.stauts = '${statusCode}' .startsWith("4") ? "fail"  : "error";

        Error,captureStckTrace(this, this.constructor);
    
    }
}

export default AppError;