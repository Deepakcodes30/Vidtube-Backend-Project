import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { ownershipCheck } from "../utils/ownershipCheck.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum; // if pageNum 3 then 3 -1 = 2 pages and limit is 10 so 2 x 10 20 = so basically skipping 20 videos
  let match = {};

  if (query) {
    match.title = { $regex: query, $options: "i" }; // search in title (case-insensitive)}
  } //this code will match the videos based on title searched. the options "i" is basically case insensitive search

  if (!userId || !mongoose.Types.ObjectId.isValid(userId.toString())) {
    throw new ApiError(400, "Invalid User ID");
  }

  if (userId) {
    match.owner = userId;
  } // what if someone search by user name

  const videos = await Video.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $unwind: "$ownerDetails", // converts array into object
            pipeline: [
              {
                $match: {
                  $or: [
                    { title: { $regex: query, $options: "i" } },
                    {
                      "ownerDetails.username": { $regex: query, $options: "i" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    },

    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    { $skip: skip },
    { $limit: limitNum },
  ]);

  const fetchedVideos = await Video.aggregatePaginate(videos, {
    limit: limitNum,
    page: pageNum,
  });

  const totalVideos = await Video.countDocuments(match);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fetchedVideos,
        pagination: {
          total: totalVideos,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalVideos / limitNum),
        },
      },
      "All videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title) {
    throw new ApiError(400, "Please enter a video title");
  }

  if (!description) {
    throw new ApiError(400, "Please enter a video description");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video not found");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail not found");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const video = await Video.create({
    title,
    description,
    owner: req.user._id,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
    //need to add views as well
  });

  if (!video) {
    throw new ApiError(
      501,
      "There was some technical issue while uploading the video"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "The video was uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Video not found");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },

    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(400, "video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body; //taking the new title and description from req.body and setting those values into the video object

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Video not found");
  }

  //finding the existing video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await ownershipCheck(video.owner, req.user._id);

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  let newVideoFile = video.videoFile;
  if (videoLocalPath) {
    //delete the existing video
    await deleteFromCloudinary(video.videoFile);
    //upload the new file
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    newVideoFile = videoFile.url;
  }

  let newThumbnail = video.thumbnail;
  if (thumbnailLocalPath) {
    //delete existing thumbnail
    await deleteFromCloudinary(video.thumbnail);
    //uploading new thumbnail
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    newThumbnail = thumbnail.url;
  }

  //as we have found the existing video above , we are directly updating the new data
  video.title = title || video.title;
  video.description = description || video.description;
  video.videoFile = newVideoFile;
  video.thumbnail = newThumbnail;

  //saving the new video with updated details
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"));

  /*another approach to same using aggregate
  const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Video not found");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  // Upload new files if provided
  let newVideoFile, newThumbnail;

  if (videoLocalPath) {
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    newVideoFile = videoFile.url;
  }

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    newThumbnail = thumbnail.url;
  }

  // Build aggregation pipeline
  const updatedVideo = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $set: {
        title: title || "$title",
        description: description || "$description",
        videoFile: newVideoFile || "$videoFile",
        thumbnail: newThumbnail || "$thumbnail",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }],
      },
    },
    {
      $addFields: {
        owner: { $first: "$ownerDetails" },
      },
    },
    { $project: { ownerDetails: 0 } },
    {
      $merge: {
        into: "videos",
        whenMatched: "merge",
        whenNotMatched: "fail",
      },
    },
  ]);

  if (!updatedVideo || updatedVideo.length === 0) {
    throw new ApiError(404, "Video not found or could not be updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo[0], "Video updated successfully"));
});
 */
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) {
    throw new ApiError(400, "video not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  await ownershipCheck(video.owner, req.user._id);

  await deleteFromCloudinary(video.videoFile);
  await deleteFromCloudinary(video.thumbnail);

  await Video.findByIdAndDelete(video._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Video was successfully deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (videoId) {
    throw new ApiError(400, "Bad Request");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  await ownershipCheck(video.owner, req.user._id);

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video publish status toggled"));
  //
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
