import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
        as: ownerDetails,
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
    limit: Number(limit),
    page: Number(page),
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
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
