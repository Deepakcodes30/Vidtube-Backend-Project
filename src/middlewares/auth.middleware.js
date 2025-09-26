//it will verify if user exist

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  //basically we are accessing the accessToken from either cookies where we added the tokens or from http header which holds a value called Authorization which holds Bearer <accesstoken> in which we are replacing the Bearer term with empty string so that we are left with just the accessToken
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    //jwt method to verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //the decoded Token has user id so we are accessing the user id from that
    const user = await User.findById(decodedToken?._id).select(
      -password - refreshToken
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    //creating new user object with updated data
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
