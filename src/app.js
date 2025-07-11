import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import {errorHandler} from "./middlewares/error.middlewares.js"
const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials : true
    })
)



// common middlewear
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())




//import routes
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import postRouter from "./routes/post.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"



//routes
app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/posts", postRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)


app.use(errorHandler)
export { app }