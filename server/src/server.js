import dotenv from "dotenv";
import app from"./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` cloud shield Server running on port ${PORT}`);
});