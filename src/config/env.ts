import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 8802,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 8802}`,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "school_db"
  }
};
