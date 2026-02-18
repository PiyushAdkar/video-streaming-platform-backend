import connectDB from './db/index.js';
import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config({ path: "./.env" });

connectDB()
.then(()=> {
    app.on('error', (error)=>{
        console.log("Error while connecting express app: ", error);
        throw error;
    });
    const port = process.env.PORT || 8000;
    app.listen(port, ()=> {
        console.log(`App is listening on the port: ${port}`);
    });
})
.catch((error)=>{
    console.log(`MongoDB connection failed: ${error}`);
})










/*
import express from 'express';
const app = express();

;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("Error: ", error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR: ",error);
    }
})()
*/