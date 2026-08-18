import crypto from "crypto";

//generate refresh token
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex")
};

//hash refresh token
const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export{
    generateRefreshToken,
    hashRefreshToken,
};