import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ownershipCheck } from "../utils/ownershipCheck.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video not found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  await ownershipCheck(existingLike.likedBy, req.user._id);

  let action;

  if (existingLike) {
    await existingLike.delete();
    action = "unliked";
  } else {
    await Like.create({
      likedBy: req.user._id,
      video: videoId,
    });
    action = "liked";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId, action },
        `video was successfully ${action}`
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!commentId || mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  await ownershipCheck(existingLike.likedBy, req.user._id);

  let action;

  if (existingLike) {
    await existingLike.delete();
    action = "unliked";
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    action = "liked";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { commentId, action },
        `Comment was successfully ${action}`
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Tweet not found");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  await ownershipCheck(existingLike.likedBy, req.user._id);

  let action;
  if (existingLike) {
    await existingLike.delete();
    action = "unliked";
  } else {
    await existingLike.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    action = "liked";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tweetId, action },
        `Tweet was successfully ${action}`
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const { userId } = req.params;
  const {
    limit = 10,
    page = 1,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "User not found");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const likedVideos = Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              views: 1,
              duration: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videoDetails: { $first: "$videoDetails" },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
  ]);

  const allLikedVideos = await Like.aggregatePaginate(likedVideos, {
    limit: limitNum,
    page: pageNum,
  });

  if (allLikedVideos.length === 0) {
    throw new ApiError(400, "There are no liked videos");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allLikedVideos,
        "All liked videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
