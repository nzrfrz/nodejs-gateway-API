import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import useragent from "express-useragent";
import { readFile } from "fs/promises";
import helmet from "helmet";

import routes from "./routes/index.js";

import cookieParser from "cookie-parser";

const corsOptionsList = JSON.parse(
    await readFile(new URL("./registry/corsOptions.json", import.meta.url))
);

dotenv.config();
const app = express();

let corsOptions = {
    origin: corsOptionsList,
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));
app.use(useragent.express());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", routes);

app.get("/", (req, res) => {
    res.status(200).send({message: "!!! NODEJS MONGODB BACKEND API PLAYGROUND !!!"});
});

app.listen(process.env.PORT, () => {
    console.log(`App Running on: http://localhost:${process.env.PORT}`);
});
