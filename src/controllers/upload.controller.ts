import { FastifyRequest, FastifyReply } from "fastify";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadBookFileController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const data = await req.file();
    
    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" });
    }

    // Convert stream to buffer
    const buffer = await data.toBuffer();

    // Clean filename
    const cleanFilename = data.filename
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "school_books",
          public_id: `${Date.now()}-${cleanFilename}`,
        },
        (error, result) => {
          if (error) {
            console.log(error);
            reply.status(500).send({
              error: "Failed to upload file",
              details: error.message,
            });
            return reject(error);
          }

          if (!result) {
            reply.status(500).send({ error: "Upload failed - no result" });
            return reject(new Error("No result from Cloudinary"));
          }

          reply.status(200).send({
            message: "File uploaded successfully",
            fileUrl: result.secure_url,
            publicId: result.public_id,
            filename: cleanFilename,
          });

          resolve(result);
        }
      );

      stream.end(buffer);
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: "Failed to upload file",
      details: error.message,
    });
  }
};
