import { Router } from "express";
import { getChannelVideos, getChannelStats } from "../controllers/dashboard.controller.js";

const router = Router();

router.route("/getChannelVideos/:channelId").get(getChannelVideos);
router.route("/getChannelStats/:channelId").get(getChannelStats);

export default router