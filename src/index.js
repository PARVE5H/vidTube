import { configDotenv } from "dotenv"
import { app } from "./app.js"
import "dotenv/config"
import connectDB from "./db/index.js"

configDotenv({
    path:"./.env"
})

const PORT=process.env.PORT || 3000

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongodb connection error ",err);
    
})