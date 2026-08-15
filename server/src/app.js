import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";


const app = express();

// security middleware
app.use(helmet());


// logging
app.use(morgan("dev"));


//parse json
app.use(express.json());

//Parse URL encoded data
app.use(express.urlencoded({extended: true}));


//parse cookies  time used is 15 mins
app.use(cookieParser());


//Enable CORS

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;

