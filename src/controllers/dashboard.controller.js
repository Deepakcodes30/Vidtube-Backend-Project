import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js"; // if you track comments
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Channel not found");
  }

  const totalVideos = await Video.countDocuments({ owner: channelId });

  const viewsAgg = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);
  const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const likesAgg = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    { $unwind: "$videoDetails" },
    {
      $match: {
        "videoDetails.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    { $count: "totalLikes" },
  ]);
  const totalLikes = likesAgg.length > 0 ? likesAgg[0].totalLikes : 0;

  const commentsAgg = await Comment.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    { $unwind: "$videoDetails" },
    {
      $match: {
        "videoDetails.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    { $count: "totalComments" },
  ]);
  const totalComments =
    commentsAgg.length > 0 ? commentsAgg[0].totalComments : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes,
        totalComments,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Channel not found");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const videos = await Video.find({ owner: channelId })
    .sort({ [sortBy]: sortType === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(limitNum);

  const totalVideos = await Video.countDocuments({ owner: channelId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          total: totalVideos,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalVideos / limitNum),
        },
      },
      "Channel videos fetched successfully"
    )
  );
});

export { getChannelStats, getChannelVideos };
