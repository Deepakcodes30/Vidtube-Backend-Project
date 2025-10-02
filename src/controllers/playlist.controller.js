import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist

  if (!name || !description) {
    throw new ApiError(400, "Please enter the name or description");
  }

  const userId = req.user._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlist = await Playlist.create({
    name,
    description,
    user: userId,
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist could not be created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User Access");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
    {
      $project: {
        name: 1,
        description: 1,
      },
    },
  ]);

  if (playlists.length === 0) {
    throw new ApiError(404, "Playlists not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!playlistId) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const userId = req.user._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } }, // flatten owner object
    {
      $lookup: {
        from: "videos",
        localField: "videos", // array of video ids in playlist
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!playlist || playlist.length === 0) {
    throw new ApiError(400, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (
    !mongoose.Types.isValidObjectId(playlistId) ||
    !mongoose.Types.isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Please provide valid playlist or video Id");
  }

  const existingPlaylist = await Playlist.findById(playlistId);
  if (!existingPlaylist) {
    throw new ApiError(400, "Playlist not found");
  }

  if (existingPlaylist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Unauthorized access to playlist");
  }

  if (existingPlaylist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exist");
  }

  existingPlaylist.videos.push(videoId);

  await existingPlaylist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        existingPlaylist,
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (
    !mongoose.Types.isValidObjectId(playlistId) ||
    !mongoose.Types.isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Please provide valid playlist or video Id");
  }

  const existingPlaylist = await Playlist.findById(playlistId);
  if (!existingPlaylist) {
    throw new ApiError(400, "Playlist not found");
  }

  if (existingPlaylist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Unauthorized access to playlist");
  }

  existingPlaylist.videos.pull(videoId);

  await existingPlaylist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        existingPlaylist,
        "Video deleted from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!mongoose.Types.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Please provide valid playlist Id");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!mongoose.Types.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Please provide valid playlist Id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
