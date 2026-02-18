import { ApiError } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweets.model.js";
import  mongoose  from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId) throw new ApiError(400, "Video-Id is necessary");

    const existVideo = await Video.findById(videoId);
    if(!existVideo) throw new ApiError(404, "Video not found");

    const like = await Like.findOne({video: videoId, likedBy: req.user?._id});

    if(!like) {
        const newLike = await Like.create({
            video: videoId,
            comment: null,
            tweet: null,
            likedBy: req.user?._id
        });

        if(!newLike) throw new ApiError(500, "Error while creating a like document");

        return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Video liked successfully"));
    }
    else {
        const deleteLike = await Like.deleteOne({video: videoId, likedBy: req.user?._id});

        if(deleteLike.deletedCount === 0) throw new ApiError(500, "Error while deleting a like document");

        return res
        .status(200)
        .json(new ApiResponse(200, {liked: false}, "Video disliked successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if(!commentId) throw new ApiError(400, "Comment-Id is necessary");

    const existComment = await Comment.findById(commentId);
    if(!existComment) throw new ApiError(404, "Comment not found");

    const like = await Like.findOne({comment: commentId, likedBy: req.user?._id});

    if(!like) {
        const newLike = await Like.create({
            video: null,
            comment: commentId,
            tweet: null,
            likedBy: req.user?._id
        });

        if(!newLike) throw new ApiError(500, "Error while creating a like document");

        return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Comment liked successfully"));
    }
    else {
        const deleteLike = await Like.deleteOne({comment: commentId, likedBy: req.user?._id});

        if(deleteLike.deletedCount === 0) throw new ApiError(500, "Error while deleting a like document");

        return res
        .status(200)
        .json(new ApiResponse(200, {liked: false}, "Comment disliked successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!tweetId) throw new ApiError(400, "Tweet-Id is necessary");

    const existTweet = await Tweet.findById(tweetId);
    if(!existTweet) throw new ApiError(404, "Tweet not found");

    const like = await Like.findOne({tweet: tweetId, likedBy: req.user?._id});

    if(!like) {
        const newLike = await Like.create({
            video: null,
            comment: null,
            tweet: tweetId,
            likedBy: req.user?._id
        });

        if(!newLike) throw new ApiError(500, "Error while creating a like document");

        return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
    }
    else {
        const deleteLike = await Like.deleteOne({tweet: tweetId, likedBy: req.user?._id});

        if(deleteLike.deletedCount === 0) throw new ApiError(500, "Error while deleting a like document");

        return res
        .status(200)
        .json(new ApiResponse(200, {liked: false}, "Tweet disliked successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if(!userId) throw new ApiError(400, "Unauthorizedd request");
    
    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                comment: null,
                tweet: null
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoData",
            }
        },
        {
            $addFields: {
                videoData: {
                    $first: "$videoData"
                }
            }
        },
        {
            $project: {
                comment: 0,
                tweet: 0,
                "videoData.videoFilePublicId": 0,
                "videoData.thumbnailPublicId": 0,
                createdAt: 0,
                updatedAt: 0
            }
        }
    ]);

    if(videos.length === 0) throw new ApiError(404, "Liked videos not found");

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
});

export { toggleCommentLike, toggleVideoLike, toggleTweetLike, getLikedVideos }