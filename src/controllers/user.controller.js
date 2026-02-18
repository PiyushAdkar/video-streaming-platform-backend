import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/Apierror.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const currUser = await User.findById(userId);
        const accessToken = await currUser.generateAccessToken();
        const refreshToken = await currUser.generateRefreshToken();

        currUser.refreshToken = refreshToken;
        await currUser.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens.");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    // Validation (check if empty, correct format)
    // Check if user already exists: username
    // Check for images, check for avator
    // Upload them to cloudinary, check
    // Create user object - new entry in db
    // Remove password and refresh token fields from response
    // Check if user is created successfully
    // Return response


    // Step 1
    const {username, email, fullname, password} = req.body;

    // Step 2
    if(fullname.trim() === "") throw new ApiError(400, "Full name is necessary.");
    if(password.trim() === "") throw new ApiError(400, "Password is necessary.");
    if(email.trim() === "") throw new ApiError(400, "Email is necessary.");
    if(username.trim() === "") throw new ApiError(400, "Username is necessary.");

    // Step 3
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]  //either same username wala shodhnar OR same email wala shodhnar
    });
    if(existedUser) throw new ApiError(409, "User already exists in the database. (Same username or email)");

    // Step 4
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath) throw new ApiError(400, "Avatar image file is required!");
    if(!coverImageLocalPath) throw new ApiError(400, "Cover image file is required!");
    
    // Step 5
    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatarResponse) throw new ApiError(500, "Avatar image file uploading error!");
    if(!coverImageResponse) throw new ApiError(500, "Cover image file uploading error!");

    // Step 6
    const user = await User.create({
        fullname: fullname,
        username: username.toLowerCase(),
        email: email,
        avatar: avatarResponse.url,
        coverImage: coverImageResponse.url,
        password: password
    });

    // Step 7
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // Step 8
    if(!createdUser) throw new ApiError(500, "Error while creating new user.");

    // Step 9
    const responseObject = new ApiResponse(200, createdUser, "User registered successfully!");
    return res.status(200).json(responseObject);

});

const loginUser = asyncHandler(async (req, res) => {
    // Take user data from req.body
    // Find user by username or email.
    // Compare passwords: bcrypt 
    // Generate access and refresh tokens. 
    // Send cookies for tokens.
    // Send successfull response.

     
    // Step 1
    const {email, password, username} = req.body;
    if(!username && !email) throw new ApiError(400, "Username or email is required.");
    if(!password) throw new ApiError(400, "Password is required.");

    // Step 2
    const user = await User.findOne({           //This user referance does not have refreshToken as it is updated later in the code...even if it is updated later still this user wont have refreshToken..you need to take new referance.
        $or: [{username},{email}]
    });

    if(!user) throw new ApiError(404, "User is not registered.");

    // Step 3
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) throw new ApiError(401, "Invalid user credentials.");

    // Step 4
    const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    const options = {
        httpOnly: true,
        secure: true
    }

    // Step 5
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken        //loggedInUser is not a plain JS object, It’s a Mongoose document, which is like a wrapper around the data with lots of extra stuff..
        },
        "User logged in successfully."
    ))
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User logged out successfully."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!oldRefreshToken) throw new ApiError(401, "Unauthorized request.");

    const decodedInfo = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedInfo?._id);

    if(!user) throw new ApiError(401, "Invalid refresh token.");

    if(oldRefreshToken !== user?.refreshToken) throw new ApiError(401, "Invalid refresh token.");

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            accessToken: accessToken,
            refreshToken: refreshToken       
        },
        "Access token refreshed successfully."
    ));
});

const updateUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id).select("-refreshToken");

    const isUser = await user.isPasswordCorrect(oldPassword);

    if(!isUser) throw ApiError(400, "Incorrect password.");

    user.password = newPassword;

    await user.save({validateBeforeSave: false});

    res.status(200).json(new ApiResponse(200, {}, "Password reset successfull."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "Current user returned successfully"
    ))
});

const updateUserDetails = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body;

    if(!email || !fullname) throw new ApiError(400, "Both email and fullname fields are required.");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    if(!user) throw ApiError(400, "Error while finding user during updation of details.");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath) throw new ApiError(400, "Newly uploaded avatar file not found.");

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar) throw new ApiError(500, "Error while uploading avatar.");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Avatar file updated successfully."
    ));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath) throw new ApiError(400, "Newly uploaded cover image file not found.");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage) throw new ApiError(500, "Error while uploading cover image.");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Cover image file updated successfully."
    ));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params;

    if(!username?.trim()) throw new ApiError(400, "Username not found.");

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        }, 
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                createdAt: 1
            }
        }
    ]);

    // console.log("Channel: ", channel);

    if(!channel?.length) throw new ApiError(404, "Channel does not exist.");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channel[0],
        "User Channel details fetched successfully."
    ));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
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
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully."
    ))
});

export {registerUser, loginUser, logoutUser, refreshAccessToken, updateUserPassword, getCurrentUser, updateUserDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory  }