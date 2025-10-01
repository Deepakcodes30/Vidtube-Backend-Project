import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been upload successfully
    // console.log("File uploaded successfully on cloudinary", response.url);
    fs.unlinkSync(localFilePath); //if uploaded we will unlink from cloudinary
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //destroy the video or image from cloudinary
    const response = await cloudinary.uploader.destroy(localFilePath, {
      resource_type: "auto",
    });
    //existing file has been successfully deleted from cloudinary
    console.log("Deleted file response:", response);
    return response;
  } catch (error) {
    throw new ApiError(
      501,
      "there was some technical error while deleting the existing file"
    );
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };
