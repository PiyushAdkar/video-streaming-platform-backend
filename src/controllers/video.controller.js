import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import {Video} from "../models/video.model.js"
import mongoose from "mongoose";


const getVideoById = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    
    if(!videoId) throw new ApiError(400, "Video-Id is necessary");

    const video = await Video.findById(videoId);

    if(!video) throw new ApiError(404, "Video not found");

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body;

    if(!title) throw new ApiError(400, "Video title is necessary");
    if(!description) throw new ApiError(400, "Video description is necessary");

    const existedVideo = await Video.findOne({
        $and: [{title}, {description}]          //Can do better to search if that document already exists
    });
    if(existedVideo) throw new ApiError(400, "Video is already uploaded");

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoFileLocalPath) throw new ApiError(400, "Video file is necessary");
    if(!thumbnailLocalPath) throw new ApiError(400, "Thumbnail image is necessary.");

    const videoFileResponse = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFileResponse) throw new ApiError(500, "Video file uploading error");
    if(!thumbnailResponse) throw new ApiError(500, "Thumbnail image uploading error");

    const video = await Video.create({
        title: title,
        description: description,
        videoFile: videoFileResponse.url,
        thumbnail: thumbnailResponse.url,
        duration: videoFileResponse.duration,
        isPublished: true,
        owner: req.user?._id,
        videoFilePublicId: videoFileResponse.public_id,
        thumbnailPublicId: thumbnailResponse.public_id
    });

    const createdVideo = await Video.findById(video._id).select("-videoFilePublicId -thumbnailPublicId");

    if(!createdVideo) throw new ApiError(500, "Error while creating a new video");

    return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video uploaded successfully!"));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    
    if(!videoId) throw new ApiError(400, "Video Id is necessary");
    
    const oldVid = await Video.findById(videoId);
    if(!oldVid) throw new ApiError(404, "Video not found");

    const { description, title } = req.body || {} ;
    const thumbnailLocalPath = req.file?.path;

    if(!description && !title && !thumbnailLocalPath) throw new ApiError(400, "Atleast one of the title, description or thumbnail needs to be updated");
    
    const updateData = {};
    if (title != null) updateData.title = title;
    if (description != null) updateData.description = description;

    if(thumbnailLocalPath) {
        await deleteFromCloudinary(oldVid.thumbnailPublicId, "image");
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if(!thumbnail) throw new ApiError(500, "Error while uploading thumbnail");
        
        updateData.thumbnailPublicId = thumbnail.public_id;
        updateData.thumbnail = thumbnail.url;
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateData
        },
        {
            new: true
        }
    ).select("-thumbnailPublicId -videoFilePublicId");

    if(!video) throw new ApiError(404, "Video with id does not exist");

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video data updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!videoId) throw new ApiError(400, "Video id is necessary");

    const video = await Video.findById(videoId);

    if(!video) throw new ApiError(404, "Video not found");

    await deleteFromCloudinary(video.thumbnailPublicId, "image");
    await deleteFromCloudinary(video.videoFilePublicId, "video");
    await video.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // Add query too
    if(!userId) throw new ApiError(400, "User-Id is necessary");

    const aggregate = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                isPublished: true
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $project: {
                videoFilePublicId: 0,
                thumbnailPublicId: 0
            }
        }
    ]);

    if(!aggregate) throw new ApiError(500, "Error while collecting all documents");

    const options = {
        page: Number(page),
        limit: Number(limit)
    };

    const videos = await Video.aggregatePaginate(aggregate, options);

    if(!videos) throw new ApiError(500, "Error while paginating");

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId) throw new ApiError(400, "Video id is necessary");

    const video = await Video.findById(videoId).select("-videoFilePublicId -thumbnailPublicId");
    if (!video) throw new ApiError(404, "Video not found");

    video.isPublished = !video.isPublished;
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status toggled successfully"));
});

export { getVideoById, publishAVideo, updateVideoDetails, deleteVideo, togglePublishStatus, getAllVideos }