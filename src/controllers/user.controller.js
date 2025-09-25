import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { fullName, username, email, password } = req.body;
  console.log("email:", email);

  //validation - not empty
  // this is a method for single single if condition check
  // if (fullname === "") {
  //   throw new ApiError(400, "FullName is required");
  // }

  //this is to check multiple condition in a single if statement
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exists - username and email
  const existeduser = User.findOne({
    //using operator that can check multiple fields at once
    $or: [{ email }, { username }],
  });
  if (existeduser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //check for images, check for avatar
  //upload them to cloudinary, avatar check
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  //we have already setup multer for file handing it has feature of files which gives us access to the file data
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  //create user object - to send the user data in mongodb - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //remove password and refresh token field from response
  //user should be used to find not User
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check for user creation - if created or not
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  //return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User is created"));
});

export { registerUser };
