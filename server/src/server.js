import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";

const startServer = async () => {
  try {
    // Connect Database First
    await connectDB();

    // Start Server
    app.listen(env.PORT, () => {
      console.log(
        ` Cloud-Shield Server is running on http://localhost:${env.PORT}`
      );
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error(" Failed to start server.");
    console.error(error);
    process.exit(1);
  }
};

startServer();