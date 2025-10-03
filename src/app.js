import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//accepting json directly using express
app.use(express.json({ limit: "16kb" }));

//accepting data from URL where the urlencodd converts and encods URL
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//accepting files and data
app.use(express.static("public"));

//setting up cookie parser to store secure cookies in browser
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import healthCheckRouter from "./routes/healthCheck.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//routes declaration - this is basically fixed route that when client goes on users the route is activated and then further routing will working from /users
//routes will pass the control further - basically prefix for users route
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };
