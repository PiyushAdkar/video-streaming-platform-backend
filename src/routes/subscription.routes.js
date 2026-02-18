import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, toggleSubscription, getUserChannelSubscribers } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/toggle-subscription/:channelId").post(verifyJWT, toggleSubscription);
router.route("/All-subscribers/:channelId").get(verifyJWT, getUserChannelSubscribers);
router.route("/subscribedTo/:subscriberId").get(verifyJWT, getSubscribedChannels);

export default router