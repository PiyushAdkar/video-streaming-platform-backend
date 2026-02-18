import { Router } from "express";
import { addComment, updateComment, deleteComment, getVideoComments } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add/:videoId").post(verifyJWT, addComment);
router.route("/update-comment/:videoId/:commentId").patch(verifyJWT, updateComment);
router.route("/delete/:commentId").delete(verifyJWT, deleteComment);
router.route("/all/:videoId").get(verifyJWT, getVideoComments);

export default router