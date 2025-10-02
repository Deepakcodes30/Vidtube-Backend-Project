import { Router } from "express";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-playlist").post(createPlaylist);
router.route("/all-playlists/:userId").get(getUserPlaylists);
router.route("/get-playlist/:playlistId").get(getPlaylistById);
router.route("/:playlistId/add/:videoId").patch(addVideoToPlaylist);
router.route("/:playlistId/remove/:videoId").patch(removeVideoFromPlaylist);
router.route("/delete/:playlistId").delete(deletePlaylist);
router.route("/update-playlist/:playlistId").patch(updatePlaylist);
