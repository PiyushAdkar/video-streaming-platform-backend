import { Router } from "express";
import { createPlaylist, updatePlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, addVideoToPlaylist, removeVideoFromPlaylist} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/create").post(verifyJWT, createPlaylist);
router.route("/get-playlists/:userId").get(verifyJWT, getUserPlaylists);
router.route("/getOne/:playlistId").get(verifyJWT, getPlaylistById);
router.route("/add-video/:playlistId/:videoId").post(verifyJWT, addVideoToPlaylist);
router.route("/remove-video/:playlistId/:videoId").delete(verifyJWT, removeVideoFromPlaylist);
router.route("/delete/:playlistId").delete(verifyJWT, deletePlaylist);
router.route("/update-details/:playlistId").patch(verifyJWT, updatePlaylist);

export default router 