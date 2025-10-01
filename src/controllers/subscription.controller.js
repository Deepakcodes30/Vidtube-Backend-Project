import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!channelId) {
    throw new ApiError(400, "Channel not found");
  }

  //jabh bhi koi subscibe karega tabh 1 user add hoga humare subscriber ki list me
  //jabh bhi koi unsubscribe karega toh woh user delete ho jaayga humari subscriber ki list se

  const userId = req.user._id;

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "unsubscribed successfully"));
  } else {
    const subscriberAdded = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, subscriberAdded, "subscribed successfully"));
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // controller to return subscriber list of a channel

  if (!channelId) {
    throw new ApiError(400, "Channel not found");
  }

  const channel = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
    { $unwind: "$subscriber" },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel[0]?.subscriber,
        "Subscribers fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "Subscriber not found");
  }

  const subscriber = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
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
    { $unwind: "$subscribedTo" },
    // Convert subscribedTo array to a single object
    {
      $addFields: {
        subscribedTo: { $first: "$subscribedTo" },
      },
    },
    // Optionally, remove unnecessary fields
    {
      $project: {
        _id: 0,
        channel: 0,
        subscriber: 0,
      },
    },
  ]);

  //to extract the list of channels
  const subscribedChannels = subscriber.map((s) => s.subscribedTo);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Channel subscribed to fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
