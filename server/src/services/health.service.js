const getHealthStatus  = () => {
    return{
        staus: "OK",
        message: "server is running smoothly",
        timestamp: new Date().toDateString(),
        environment: process.env.NODE_ENV || "development",
    };
};

export default {
    getHealthStatus,
};