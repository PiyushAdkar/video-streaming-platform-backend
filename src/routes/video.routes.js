import { Router } from "express";
import { publishAVideo, getVideoById, updateVideoDetails, deleteVideo, togglePublishStatus, getAllVideos } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/publish").post(
verifyJWT, 
upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),
publishAVideo);

router.route("/get/:videoId").get(verifyJWT, getVideoById);
router.route("/update-details/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideoDetails);
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);
router.route("/toggleStatus/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/getAll").get(verifyJWT, getAllVideos);

export default router;