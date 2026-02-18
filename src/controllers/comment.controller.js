import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId) throw new ApiError(400, "Video-Id is necessary");

    const comments = await Comment.find({
        video: videoId
    });

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "All comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId) throw new ApiError(400, "Video-Id is necessary");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const {content} = req.body;
    if(!content) throw new ApiError(400, "Comment content is necessary");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    if(!videoId) throw new ApiError(400, "Video-Id is necessary");
    if(!commentId) throw new ApiError(400, "Comment-Id is necessary");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const { content } = req.body;
    if(!content?.trim()) throw new ApiError(400, "Comment content is necessary");

    const comment = await Comment.findOneAndUpdate(
        {
        $and: [{_id: commentId} ,{video: videoId}, {owner: req.user?._id}]
        },
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    );

    if(!comment) throw new ApiError(404, "Comment not found");

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if(!commentId) throw new ApiError(400, "Comment-Id is necessary");

    const deletedComment = await Comment.findOneAndDelete({_id: commentId, owner: req.user?._id});
    if(!deletedComment) throw new ApiError(404, "Comment not found");

    return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment } 