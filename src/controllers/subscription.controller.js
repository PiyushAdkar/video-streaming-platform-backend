import mongoose from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/Apierror.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if(!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user-Id");
    if(!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel-id");

    const deletedSubscription = await Subscription.findOneAndDelete({
        subscriber: userId,
        channel: channelId
    });

    if(!deletedSubscription) {
        const newSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelId
        });
        
        return res
        .status(200)
        .json(new ApiResponse(201, newSubscription, "User subscribed successfully"));
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "User unsubscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if(!channelId) throw new ApiError(400, "Channel-Id is necessary");
    if(!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel-id");

    const user = await User.findById(channelId);
    if(!user) throw new ApiError(404, "User not found");

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberOfChannel",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1,
                            fullname: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriberOfChannel: {
                $first: "$subscriberOfChannel"
            }}
        },
        {
            $project: {
                _id: 0,
                channel: 0,
                createdAt: 0,
                updatedAt: 0,
                subscriber: 0
            }
        }
    ]);
    
    const subscriberCount = await Subscription.countDocuments({
        channel: channelId
    });

    return res
    .status(200)
    .json(new ApiResponse(200, { totalSubscribers: subscriberCount, subscribers }, "Subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if(!subscriberId) throw new ApiError(400, "Subscriber-Id is necessary");
    if(!mongoose.Types.ObjectId.isValid(subscriberId)) throw new ApiError(400, "Invalid subscriber-id");

    const toSubscribed = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedToChannel",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1,
                            fullname: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribedToChannel: {
                $first: "$subscribedToChannel"
            }}
        },
        {
            $project: {
                _id: 0,
                channel: 0,
                createdAt: 0,
                updatedAt: 0,
                subscriber: 0
            }
        }
    ]);
    
    const subscribedToCount = await Subscription.countDocuments({
        subscriber: subscriberId
    });

    return res
    .status(200)
    .json(new ApiResponse(200, { totalSubscribedToChannels: subscribedToCount, toSubscribed }, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}