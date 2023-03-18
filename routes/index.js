import axios from "axios";
import express from "express";
import multer from "multer";
import FormData from "form-data";
import { readFile } from "fs/promises";
import { Readable } from "stream";

const routes = express.Router();

const storage = multer.memoryStorage();

const upload = multer({storage});

const REGISTRY = JSON.parse(
    await readFile(new URL("../registry/registry.json", import.meta.url))
);

routes.all("/:serviceName/:path(*)?", upload.single("file"), async (req, res) => {
    // console.log(req.url.includes("auth"));
    // console.log("HEADERS: \n", req.headers);
    console.log(req.cookies);

    const serviceData = REGISTRY.filter((data) => data.service === req?.params?.serviceName);
    if (req.file !== undefined) {
        let formData = new FormData();
        formData.append("file", Readable.from(req.file.buffer), req.file.originalname);
        try {
            const results = await axios.post(`${req.headers.host.includes("localhost") ? serviceData[0].LOCAL_BASE_PATH : serviceData[0].BASE_PATH}/${req.params.serviceName}/${req.params.path}`, formData, {
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
            res.status(results?.data?.status).send(results?.data);
        } catch (error) {
            res.status(error?.response?.status).send(error?.response?.data);
        }
    } else {
        await axios({
            method: req.method,
            withCredentials: true,
            baseURL: `${req?.headers?.host?.includes("localhost") ? serviceData[0]?.LOCAL_BASE_PATH : serviceData[0]?.BASE_PATH}/${req?.params?.serviceName}/${req?.params?.path}`,
            // passing all headers to service
            headers: {
                authorization: req?.headers?.authorization || null,
                browser: req?.useragent?.browser,
                version: req?.useragent?.version,
                os: req?.useragent?.os,
                platform: req?.useragent?.platform,
                cookies: JSON.stringify(req?.cookies) || null
            },
            // passing all params and query url to service
            params: req.query,
            // passing all data, obejct, or JSON body to service
            data: req?.body,
        })
        .then((results) => {
            // console.log("REFRESH: ", results.data);
            if (results !== undefined && (req.url.includes("v2") && req.url.includes("login"))) {
                res.cookie("refreshToken", results.data.data.refreshToken, { httpOnly: true, secure: true, sameSite: "none", path: "/", domain: undefined, maxAge: 24 * 60 * 60 * 1000 });
                res.status(results.status).send({
                    ...results.data,
                    data: {accessToken: results.data.data.accessToken}
                });
            }
            else if (results !== undefined && (req.url.includes("v2") && req.url.includes("logout"))) {
                res.clearCookie("refreshToken").end();
                console.log("LOGOUT V2");
                res.status(results.status).send(results.data);
            }
            else {
                res.status(results.status).send(results.data);
            }
        })
        .catch((error) => {
            if (error.response !== undefined) {
                res.status(error?.response?.status || 500).send(error?.response?.data || {message: "Something went wrong"});
            }
        })
    }
});

export default routes;