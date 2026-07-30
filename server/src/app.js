import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";


const app = express();

// security middleware
app.use(helmet());


// logging
app.use(morgan("dev"));


//parse json
app.use(express.json());

//Parse URL encoded data
app.use(express.urlencoded({extended: true}));


//parse cookies
app.use(cookieParser());


//Enable CORS

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// here i can use temprory route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: " welcome farhan's Cloud-Shield API"
    });
});

export default app;
