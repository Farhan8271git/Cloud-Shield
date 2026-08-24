// authorized based user assigned role

const authorize = (...allowedRoles) => {
    return (req, res, next) => {

        // user exists or not
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
    
        }

        // user role allowed or not
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "User action not allowed.",
            });
        }

        // required role for user
        next();

    };
};

export default authorize;