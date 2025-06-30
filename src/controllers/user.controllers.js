import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        if(!user) {
            throw new ApiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return { accessToken, refreshToken }
    } catch (error) {
        console.error("Error generating tokens:", error)
        throw new ApiError(500, "Failed to generate access and refresh tokens")   
    }
}

const registerUser = asyncHandler( async (req, res)=>{
   const {fullname, email, username, password}=  req.body

   //validation
   if([fullname, email, username, password].some((field)=> field?.trim() === "")){
    throw new ApiError(400, "All fields are required")
   }

   const existedUser = await User.findOne({
    $or: [{username},{email}]
   })
   if(existedUser){
    throw new ApiError(409, "User with email or username already exist.")
   }
   console.warn(req.files)
   const avatarLocalPath = req.files?.avatar?.[0]?.path
   const coverLocalPath = req.files?.coverImage?.[0]?.path

   if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing.")
   }


   /*
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   let coverImage =""
   if (coverLocalPath){
   const coverImage = await uploadOnCloudinary(coverLocalPath)
   }
    */

   let avatar;
   try{
    avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("Uploaded Avatar", avatar);
    
   }catch(error){
    console.log("Error uploading avatar", error)
    throw new ApiError(500, "failed to upload avatar")
   }

   let coverImage;
   if(coverLocalPath){
       try{
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Uploaded cover image", coverImage);
        
       }catch(error){
        console.log("Error uploading cover image", error)
        // Delete already uploaded avatar if cover image fails
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        throw new ApiError(500, "failed to upload cover image")
       }
   }


   try 
   {
    const user = await User.create(
     {
         fullname,
         avatar: avatar.url,
         coverImage: coverImage?.url || "",
         email,
         password,
         username: username.toLowerCase()
     })
 
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
 
    if(!createdUser){
         throw new ApiError(500, "Something went wrong while registering a user.")
    }
 
    return res
    .status(201)
    .json( new ApiResponse(200, createdUser, "User registered successfully"))
 
   } catch (error) {
        console.log("User Creation failed");
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500, "Something went wrong while registering a user and images were deleted.")
   }
});

const loginUser = asyncHandler(async (req, res) => {
    //get data from request body
    const { email, username, password } = req.body;

        //validation
    if ((!email && !username) || !password) {
        throw new ApiError(400, "Email/Username and password are required");
    }

    const user = await User.findOne({ $or: [
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : [])
    ] })
    

    //validation passed, generate access and refresh token

    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid email or password");
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    if (!loggedInUser) {
        throw new ApiError(404, "User not found");
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Set to true in production
    };

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, { user: loggedInUser , accessToken, refreshToken}, "User logged in successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

   try {
    const decodeToken = jwt.verify(
      incomingRefreshToken, 
      process.env.REFRESH_TOKEN_SECRET
    )
   const user = await User.findById(decodeToken?._id)
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }
    
    if(user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token");
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

   const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

   return res
    .status(200)
    .cookie("refreshToken", newRefreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, { user, accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));
}catch(error){
   console.log("Error refreshing access token", error);
   throw new ApiError(500, "Failed to refresh access token");
}
});

const logoutUser = asyncHandler(async (req, res) => {
    // console.log(req.user);

     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
            refreshToken: undefined,
            }
        },
        {new:true}
     )
     const options = {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", // Set to true in production
     };

     return res
     .status(200)
     .clearCookie("refreshToken", options)
     .clearCookie("accessToken", options)
     .json(new ApiResponse(200, null, "User logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldpassword, newPassword} = req.body

    if (!oldpassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(oldpassword)

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullname, email} = req.body
    if(!fullname || !email){
        throw new ApiError(400, "Fullname and email are required")
    }
    const user = await User.findByIdAndUpdate(req.user._id,{
        $set: {
            fullname,
            email: email.toLowerCase()
        }
    },{new:true}).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "User details updated successfully"));   
});

const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath=  req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
  const avatar =  await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(500, "Failed to upload avatar image")    
  }
   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));

});

const updateUserCoverImage = asyncHandler(async(req, res)=>{

const coverImageLocalPath=  req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing")
    }
  const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(500, "Failed to upload cover image")    
  }
   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(200,user, "Cover image updated successfully"));

});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },{
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },{
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: { $size: "$subscribers" },
                    subscribedToCount: { $size: "$subscribedTo" },
                    isSubscribed: {
                        $cond:{
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project:{
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    subscribedToCount: 1,
                    isSubscribed: 1,
                    email: 1
                }
            }
        ]
    )

    if(!channel?.length){
        throw new ApiError(404, "Channel not found");
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"));
})


const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        }
    ])
    if(!user?.length){
        throw new ApiError(404, "User not found or watch history is empty");
    }

    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory || [], "Watch history fetched successfully"));
})


export { 
    registerUser,
    loginUser, 
    refreshAccessToken, 
    logoutUser, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory  
}