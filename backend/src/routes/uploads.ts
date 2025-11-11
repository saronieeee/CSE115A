import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import { supabaseService } from "../lib/supabase";

const router = Router();

const BUCKET_NAME = process.env.IMAGE_BUCKET ?? "images";
const ROOT_FOLDER = sanitizeFolder(process.env.IMAGE_BUCKET_ROOT ?? "bucket");
const MAX_BYTES = Number(process.env.IMAGE_UPLOAD_MAX_BYTES ?? 5 * 1024 * 1024); // 5MB default
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// keep files entirely in RAM
// 'storage.upload' call expects a Buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_BYTES
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP or GIF images"));
    }
  }
});

const runUploadMiddleware = upload.single("file");

// POST /api/uploads/images
// 1) multer parses multipart/form-data and gives us 'req.file'
// 2) validate type + size, upload to Supabase, return storage path and public URL for use immediately
router.post(
  "/images",
  (req, res, next) => {
    // Handle Multer errors manually so clients get JSON back.
    runUploadMiddleware(req, res, err => {
      if (!err) return next();
      const message =
        err instanceof multer.MulterError
          ? err.code === "LIMIT_FILE_SIZE"
            ? `File is too large. Max size is ${Math.round(MAX_BYTES / (1024 * 1024))}MB`
            : err.message
          : err.message || "Failed to process upload";
      const status = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      res.status(status).json({ error: message });
    });
  },
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Image file is required (field name: file)." });
    }

    // unique filename in the shared bucket folder 
    // TO DO: fix image bucket folder system and separate by user id 
    const extension = deriveExtension(file);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const objectPath = ROOT_FOLDER ? `${ROOT_FOLDER}/${filename}` : filename;

    const { error: uploadError } = await supabaseService.storage
      .from(BUCKET_NAME)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      const status =
        (uploadError as { statusCode?: number }).statusCode ??
        (uploadError as { status?: number }).status ??
        500;
      return res.status(status).json({ error: uploadError.message });
    }

    // generate public URL
    const { data: publicData } = supabaseService.storage
      .from(BUCKET_NAME)
      .getPublicUrl(objectPath);

    const publicUrl = publicData?.publicUrl ?? null;
    const imagePath = `${BUCKET_NAME}/${objectPath}`;

    return res.status(201).json({
      bucket: BUCKET_NAME,
      path: objectPath,
      image_path: imagePath,
      publicUrl,
      size: file.size,
      contentType: file.mimetype
    });
  }
);

function sanitizeFolder(raw: string): string {
  return raw
    .split("/")
    .map(part => part.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/");
}

function deriveExtension(file: Express.Multer.File): string {
  const fromName = (path.extname(file.originalname || "") || "").toLowerCase();
  if (fromName) return fromName;
  switch (file.mimetype) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

export default router;
