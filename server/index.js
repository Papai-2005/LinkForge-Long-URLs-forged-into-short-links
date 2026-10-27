import express from "express";
import cors from "cors";
import {createClient} from "redis";
import dotenv from "dotenv";
import {fileURLToPath} from "node:url";
import {encodeBase62} from "./services/base_62_service.js";

dotenv.config({path: fileURLToPath(new URL("./.env", import.meta.url))});

const app = express();

//initialize redis client
const redisClient = createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6379"
})

redisClient.on('connect', ()=>{
    console.log("Redis client connected");
});

redisClient.on('error', ()=>{
    console.log("Redis client not connected");
});


app.use(cors());
app.use(express.json());


//Shorten a long url
app.post(['/shortUrl', '/api/shortUrl'], async(req, res)=>{
    const originalUrl = req.body.originalUrl; 

    if(!originalUrl){
        res.json({
            "status": false,
            error: "Please provide a long URL",
        });
    }
        else{
            try {
        const id = await redisClient.incr('global_counter');
        console.log(id);
        const shortUrlId = encodeBase62(id);
        console.log(shortUrlId);

        await redisClient.hSet('urls', shortUrlId, originalUrl);

        res.json({
            "status": true,
            data: shortUrlId,
        });
    }catch (error){
        console.log(error);
        res.json({
            status: false,
            error: "Something went wrong",
        })
    }
        }
});


//get a long url from a short url

app.get("/:shortUrlId", async(req, res)=>{
    const shortUrlId = req.params.shortUrlId;
    const originalUrl = await redisClient.hGet('urls', shortUrlId);
    if(!originalUrl){
        return res.status(404).json({
            status: false,
            error: "Short URL not found",
        });
    }
    res.json({
        "status": true,
        data: originalUrl,
    });
});

app.use((req, res)=>{
    res.status(404).json({
        status: false,
        error: "Route not found",
    });
});

app.use((error, req, res, next)=>{
    if(error instanceof SyntaxError && error.status === 400 && "body" in error){
        return res.status(400).json({
            status: false,
            error: "Request body must be valid JSON",
        });
    }
    next(error);
});

const port = Number(process.env.PORT ?? 3001);

app.listen(port, async ()=>{
    try{
        await redisClient.connect();
        console.log(`Server is running on port ${port}`);
    }catch (error){
        console.log(error);
    }
})