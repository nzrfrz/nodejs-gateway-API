import cors from "cors";
import dotenv from "dotenv";
import express from "express";
// import { createProxyMiddleware } from "http-proxy-middleware";
import useragent from "express-useragent";
import { readFile } from "fs/promises";
import helmet from "helmet";

import routes from "./routes/index.js";

import cookieParser from "cookie-parser";

const corsOptionsList = JSON.parse(
    await readFile(new URL("./registry/corsOptions.json", import.meta.url))
);

// const proxyMiddleware = createProxyMiddleware({
//     target: 'http://localhost',
//     changeOrigin: true,
//     ws: true,
//     router: {
//         "/": "*",
//         "/": 'http://localhost:3000',
//         "/": 'http://localhost:5173'
//     }
// });

dotenv.config();
const app = express();

let corsOptions = {
    // origin: true,
    origin: corsOptionsList,
    credentials: true,
    optionsSuccessStatus: 200,
    // exposedHeaders: ["set-cookie"],
};

app.enable("trust proxy");

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(useragent.express());
app.use(express.urlencoded({ extended: true }));
// app.use(proxyMiddleware);

app.use("/", routes);

app.get("/", (req, res) => {
    res.status(200).send({message: "!!! NODEJS MONGODB BACKEND API PLAYGROUND !!!"});
});

app.listen(process.env.PORT, () => {
    console.log(`App Running on: http://localhost:${process.env.PORT}`);
});
