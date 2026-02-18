import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/Apierror.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats total likes etc.
    const { channelId } = req.params;
    if(!channelId) throw new ApiError(400, "Channel id is necessary");
    if(!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel-Id");

    const user = await User.findById(channelId);
    if(!user) throw new ApiError(404, "Channel does not exist");

    const totalVideos = await Video.countDocuments({isPublished: true, owner: channelId});

    const totalSubscribers = await Subscription.countDocuments({channel: channelId});

    const allVideoLikes = await Video.aggregate([
    {
        $match: { owner: channelId }
    },
    {
        $group: {
        _id: null,
        totalViews: { $sum: "$views" }
        }
    }
    ]);

    const totalViews = allVideoLikes[0]?.totalViews || 0;

    const result = await Like.aggregate([
    {
        $match: {
        video: { $ne: null }
        }
    },
    {
        $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoInfo"
        }
    },
    { $unwind: "$videoInfo" },
    {
        $match: {
        "videoInfo.owner": new mongoose.Types.ObjectId(channelId)
        }
    },
    {
        $group: {
        _id: null,
        totalLikes: { $sum: 1 }
        }
    }
    ]);

    const totalLikes = result[0]?.totalLikes || 0;

    return res
    .status(200)
    .json(new ApiResponse(200, { totalVideos, totalSubscribers, totalViews, totalLikes }, "Channel stats fetched successfully"));

});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;
    if(!channelId) throw new ApiError(400, "Channel id is necessary");
    if(!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel-Id");

    const user = await User.findById(channelId);
    if(!user) throw new ApiError(404, "Channel does not exist");

    const videos = await Video.find({owner: channelId, isPublished: true}).select("-owner -videoFilePublicId -thumbnailPublicId");

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "All channel videos fetched successfully"));
});

export {
    getChannelStats, 
    getChannelVideos
    }