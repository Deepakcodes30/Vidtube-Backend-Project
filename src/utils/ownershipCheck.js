import { ApiError } from "./ApiError.js";

const ownershipCheck = async (resourceOwnerId, loggedInUserId) => {
  if (resourceOwnerId.toString() !== loggedInUserId.toString()) {
    throw new ApiError(400, "Unauthorized Access");
  }
};

export { ownershipCheck };
