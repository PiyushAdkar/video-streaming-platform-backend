import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if(!name || !name.trim()) throw new ApiError(400, "Playlist name is necessary");
    if(!description || !description.trim()) throw new ApiError(400, "Playlist description is necessary");

    const playlist = await Playlist.create({
        description: description.trim(),
        name: name.trim(),
        owner: req.user._id,
        videos: []  
    });

    if(!playlist) throw new ApiError(500, "Error while creating a playlist");

    return res
    .status(201)
    .json(new ApiResponse(201, playlist,"Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if(!userId) throw new ApiError(400, "User-Id is necessary");

    if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user id");

    const playlists = await Playlist.find({owner: userId}).sort({createdAt: -1});

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "All playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if(!playlistId) throw new ApiError(400, "Playlist-Id is necessary");

    if(!mongoose.Types.ObjectId.isValid(playlistId)) throw new ApiError(400, "Invalid playlist id");

    const playlist = await Playlist.findById(playlistId).populate("videos");
    if(!playlist) throw new ApiError(404, "Playlist not found");

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if(!playlistId) throw new ApiError(400, "Playlist-id is necessary");
    if(!videoId) throw new ApiError(400, "Video-id is necessary");

    if(!mongoose.Types.ObjectId.isValid(playlistId)) throw new ApiError(400, "Invalid playlist id");
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400, "Invalid video id");

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId, 
            owner: req.user?._id
        },
        {
            $addToSet: { videos: videoId }
        },
        {
            new: true
        }
    );

    if(!playlist) throw new ApiError(404, "Playlist not found or unauthorized");

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if(!playlistId) throw new ApiError(400, "Playlist-id is necessary");
    if(!videoId) throw new ApiError(400, "Video-id is necessary");

    if(!mongoose.Types.ObjectId.isValid(playlistId)) throw new ApiError(400, "Invalid playlist id");
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400, "Invalid video id");

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId, 
            owner: req.user?._id
        },
        {
            $pull: { videos: videoId }
        },
        {
            new: true
        }
    );

    if(!playlist) throw new ApiError(404, "Playlist not found or unauthorized");

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if(!playlistId) throw new ApiError(400, "Playlist-id is necessary");

    if(!mongoose.Types.ObjectId.isValid(playlistId)) throw new ApiError(400, "Invalid playlist id");

    const deletedPlaylist = await Playlist.findOneAndDelete({
       $and: [{owner: req.user?._id}, {_id: playlistId}]
    });

    if(!deletedPlaylist) throw new ApiError(404, "Playlist not found or unauthorized request");

    return res
    .status(200)
    .json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if(!playlistId) throw new ApiError(400, "Playlist-id is necessary");
    if(!mongoose.Types.ObjectId.isValid(playlistId)) throw new ApiError(400, "Invalid playlist id");
    
    const updatedInfo = {};
    if((!name || !name.trim()) && (!description || !description.trim())) throw new ApiError(400, "Either playlist name or description is to be updated");

    if(name && name.trim()) updatedInfo.name = name.trim();
    if(description && description.trim()) updatedInfo.description = description.trim();

    const updatedPlaylist = await Playlist.findOneAndUpdate({_id: playlistId, owner: req.user?._id},
        {
            $set: updatedInfo
        },
        {
            new: true
        }
    );

    if(!updatedPlaylist) throw new ApiError(404, "Playlist not found or unauthorized request");

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
});

export { createPlaylist, getPlaylistById, getUserPlaylists, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist }