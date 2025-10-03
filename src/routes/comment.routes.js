import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/videos/:videoId/get-video-comments").get(getVideoComments);

router.route("/videos/:videoId/add-comment").post(addComment);
router.route("/videos/:videoId/update-comment/:commentId").patch(updateComment);
router
  .route("/videos/:videoId/delete-comment/:commentId")
  .delete(deleteComment);

export default router;
