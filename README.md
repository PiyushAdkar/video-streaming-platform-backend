# Video Streaming Platform Backend #

# Overview:
This is the backend for a YouTube-like video streaming platform built with Node.js, Express, and MongoDB. It handles user management, video uploads, likes, comments, subscriptions, playlists, and tweets-like micro posts.
The backend is structured with models, controllers, and middlewares to keep the project modular and scalable.

# Features:
- User Authentication: Register, login, JWT-based access and refresh tokens.
- Video Management: Upload videos with thumbnails, track views, and publish/unpublish status.
- Comments & Likes: Users can comment on videos, like videos, comments, and tweets.
- Subscriptions: Users can subscribe/unsubscribe to channels and see subscriber info.
- Playlists: Users can create playlists, add/remove videos, update details, and delete playlists.
- Tweets (Micro-posts): Users can post short text-based content and interact via likes.
- Healthcheck Endpoint: Simple endpoint to check if backend is running.
- Channel Dashboard: Fetch channel stats like total videos, total likes, views, and subscribers.

# Dependencies:
- "bcrypt": "^6.0.0",
- "cloudinary": "^2.8.0",
- "cookie-parser": "^1.4.7",
- "cors": "^2.8.5",
- "dotenv": "^17.2.3",
- "express": "^5.2.1",
- "jsonwebtoken": "^9.0.3",
- "mongoose": "^9.0.1",
- "mongoose-aggregate-paginate-v2": "^1.1.4",
- "multer": "^2.0.2"
  
"devDependencies": 
- "nodemon": "^3.1.11",
- "prettier": "^3.7.4"


# Models:
1.User
- Fields: username, email, fullname, avatar, coverImage, watchHistory, password, refreshToken.
- Methods: Password hashing, verify password, generate access & refresh tokens.

2.Video
- Fields: videoFile, thumbnail, title, description, duration, views, isPublished, owner, videoFilePublicId, thumbnailPublicId.

3.Comment
- Fields: content, video (ref Video), owner (ref User).
- Supports aggregate pagination.

4.Like
- Fields: video, comment, tweet, likedBy (ref User).
- Users can like videos, comments, and tweets.

5.Playlist
- Fields: name, description, videos (array of Video refs), owner (ref User).

6.Subscription
- Fields: subscriber (User), channel (User).
- Tracks user subscriptions to channels.

7.Tweet
- Fields: content, owner (User).
- Simple micro-posts feature.

# Controllers:
- User Controller: registerUser, loginUser, logoutUser, refreshAccessToken, updateUserPassword, getCurrentUser, updateUserDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory

- Video Controller: getVideoById, publishAVideo, updateVideoDetails, deleteVideo, togglePublishStatus, getAllVideos 

- Comment Controller: getVideoComments, addComment, updateComment, deleteComment

- Like Controller: toggleCommentLike, toggleVideoLike, toggleTweetLike, getLikedVideos

- Playlist Controller: createPlaylist, getPlaylistById, getUserPlaylists, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist

- Subscription Controller: toggleSubscription, getUserChannelSubscribers, getSubscribedChannels

- Tweet Controller: createTweet, getUserTweets, updateTweet, deleteTweet

- Healthcheck Controller: healthcheck: Returns server status.

- Dashboard Controller: getChannelStats, getChannelVideos

# Middleware & Utilities:
- Auth: Protect routes and verify user JWT.
- Multer: Handle file uploads.
- Error Middleware: Catch errors and return consistent API responses.
- asyncHandler: Wrap async functions to handle errors.
- ApiError: Standard error handling class.
- ApiResponse: Standard API success response class.
- cloudinary.js: Uploads and manages media files in Cloudinary.


# Scripts
"scripts": {
  "dev": "nodemon src/index.js"
}

# Setup & Run
1.Clone the repo:
git clone https://github.com/PiyushAdkar/video-streaming-platform-backend.git

2.Install dependencies:
npm install

3.Setup .env file with your MongoDB URI, JWT secrets, and Cloudinary credentials.

4.Run development server:
npm run dev

# API Structure
- /api/users → User registration & login
- /api/videos → Video fetching & stats
- /api/comments → Comment CRUD
- /api/likes → Like/unlike operations
- /api/playlists → Playlist CRUD
- /api/subscriptions → Subscribe/unsubscribe
- /api/tweets → Create/read/update/delete tweets
- /api/healthCheck → Server healthcheck
- /api/dashboard → Channel stats
