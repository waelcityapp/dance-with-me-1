import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON request body parsing
  app.use(express.json());

  // Configure cloudinary if env vars are present
  if (process.env.VITE_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  // API routes go here FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/delete-media", async (req, res) => {
    const { url, resourceType } = req.body;
    if (!url || !url.includes("cloudinary.com")) {
      return res.status(400).json({ error: "Invalid Cloudinary URL" });
    }

    if (!process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: "Cloudinary API Secret not configured on server" });
    }

    try {
      // Extract public ID from the URL
      // Example URL: https://res.cloudinary.com/cloudname/image/upload/v1234567890/folder/filename.jpg
      const urlParts = url.split("/");
      const uploadIndex = urlParts.findIndex(p => p === "upload");
      if (uploadIndex === -1) {
         return res.status(400).json({ error: "Could not parse public ID from URL" });
      }
      
      const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/");
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ""); // remove extension
      
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType || 'image' });
      res.json({ success: true, result });
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
