const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  console.log("Testing Cloudinary with Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  try {
    const result = await cloudinary.api.ping();
    console.log("SUCCESS: Cloudinary connection verified!", result);
  } catch (error) {
    console.error("ERROR: Cloudinary connection failed. Please check your credentials.");
    console.error(error.message);
  }
}

testCloudinary();
