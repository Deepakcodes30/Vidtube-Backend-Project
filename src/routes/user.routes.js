import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  //injecting middleware - before registering, processing the files like images using
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

//post is basically we are updating the password and re-saving the complete user
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

//get because we are not changing or updating any data, we are just getting the user
router.route("/current-user").get(verifyJWT, getCurrentUser);

//using patch because we need to update only specific data
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);

//using the .single("avatar") because we will update only single file
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

//:username because we are taking this detail from params(url basically) so this is syntax
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);

router.route("/username/watch-history").get(verifyJWT, getWatchHistory);

export default router;
