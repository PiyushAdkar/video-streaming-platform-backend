import { Router } from "express";
import { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle-video-like/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle-comment-like/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggle-tweet-like/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/getAllVideos").get(verifyJWT, getLikedVideos);

export default router