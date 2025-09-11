// import { v2 as cloudinary } from "cloudinary";

// cloudinary.config({ 
//         cloud_name: 'dgcefobew', 
//         api_key: '856251496779771', 
//         api_secret: 'ftXh6law6Wz3gGHseEHU6fAnXhg' // Click 'View API Keys' above to copy your API secret
//     });
// export default cloudinary;
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

export default cloudinary;
