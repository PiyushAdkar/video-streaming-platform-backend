import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from 'dotenv';
import { ApiError } from './Apierror.js';

dotenv.config({ path: "./.env" });

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            console.log("Local file path not found!");
            return null;
        }
        const normalizedPath = localFilePath.replace(/\\/g, "/");
        
        //Upload on cloudinary
        const response = await cloudinary.uploader.upload(normalizedPath, {
            resource_type: "auto"
        });
        return response;
    } catch (error) {
        throw error;
    }
    finally {
        fs.unlinkSync(localFilePath); //Remove locally saved temporary file
    }
};

const deleteFromCloudinary = async(public_id, resourceType) => {
    try {
        if(!public_id) throw new ApiError(400, "Public id not found")
        const deleteRes = await cloudinary.uploader.destroy(public_id, {resource_type: `${resourceType}`});
        return deleteRes;
    } catch (error) {
        throw error;
    }
};

export {uploadOnCloudinary, deleteFromCloudinary}