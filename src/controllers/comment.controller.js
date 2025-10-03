import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ownershipCheck } from "../utils/ownershipCheck.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const comments = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
  ]);

  const allComments = await Comment.aggregatePaginate(comments, {
    limit: limitNum,
    page: pageNum,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, allComments, "All Comments Fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video not found");
  }
  if (!content) {
    throw new ApiError(400, "Please enter a comment");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { videoId, commentId } = req.params;
  const { content } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }

  if (!commentId) {
    throw new ApiError(400, "Comment not found");
  }

  if (!content) {
    throw new ApiError(400, "Please enter a comment");
  }

  const existingComment = await Comment.findById(commentId);
  if (!existingComment) {
    throw new ApiError(400, "Comment not found");
  }

  if (existingComment.video.toString() !== videoId.toString()) {
    throw new ApiError(400, "Comment is not related to the video");
  }

  await ownershipCheck(existingComment.owner, req.user._id);

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { videoId, commentId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }

  if (!commentId) {
    throw new ApiError(400, "Comment not found");
  }

  const existingComment = await Comment.findById(commentId);
  if (!existingComment) {
    throw new ApiError(400, "Comment not found");
  }

  if (existingComment.video.toString() !== videoId.toString()) {
    throw new ApiError(400, "Comment is not related to the video");
  }

  await ownershipCheck(existingComment.owner, req.user._id);

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
