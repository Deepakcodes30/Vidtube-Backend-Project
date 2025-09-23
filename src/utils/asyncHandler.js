// based on promise
const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

/*higherorder function passing another function as paramter and then returning it const asyncHandler = (func) => {()=>{}}
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      // sending a json object for the frontend dev to understand the error part
      success: false,
      message: error.message,
    });
  }
}; */

export { asyncHandler };
