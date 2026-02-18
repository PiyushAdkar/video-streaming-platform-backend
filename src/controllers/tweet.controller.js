import { ApiError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweets.model.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if(!content || !content.trim()) throw new ApiError(400, "Tweet content is necessary");

    const existingTweet = await Tweet.findOne({content, owner: req.user._id});
    if(existingTweet) throw new ApiError(400, "tweet already exists");

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req,res) => {
    const userId = req.user._id;

    const tweets = await Tweet.find({owner: userId}).sort({createdAt: -1});;

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
}); 

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!tweetId) throw new ApiError(400, "Tweet-Id is necessary");

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const { content } = req.body;
    if(!content || !content.trim()) throw new ApiError(400, "Tweet content is necessary");

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId, 
            owner: req.user._id
        },
        {
        $set: {content: content.trim()}
        },
        {
            new: true
        }
    );
    if(!tweet) throw new ApiError(404, "Tweet not found or not authorized to update");

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
}); 

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!tweetId) throw new ApiError(400, "Tweet-Id is necessary");

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const deletedTweet = await Tweet.findOneAndDelete({_id: tweetId, owner: req.user._id});
    if(!deletedTweet) throw new ApiError(404, "Tweet not found or not authorized to delete");

    return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet }