import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "../../../lib/db";
import Parcel, { type LandType } from "../../models/Parcel";
import { auth } from "@/auth";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload a File buffer to Cloudinary
async function uploadToCloudinary(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Cloudinary's upload_stream does not return a Promise
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "landlens_parcels", // Organizes uploads in a dedicated Cloudinary folder
        resource_type: "image",
      },
      // runs when the upload finishes
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

function isLandType(value: string): value is LandType {
  return (
    value === "residential" ||
    value === "commercial" ||
    value === "agricultural" ||
    value === "industrial"
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await connectDB();

    // 1. Parse FormData instead of JSON
    const formData = await request.formData();

    const name = session.user.name || "Unnamed Parcel";
    const rawLandtype = formData.get("landtype");
    const rawPrice = formData.get("pricePerSquareFoot");
    const rawGeometry = formData.get("geometry") as string | null;
    const rawArea = formData.get("area") as string | null;

    let landtype: LandType | undefined;
    if (rawLandtype !== null) {
      if (typeof rawLandtype !== "string" || !isLandType(rawLandtype)) {
        return NextResponse.json(
          { message: "Invalid land type" },
          { status: 400 }
        );
      }
      landtype = rawLandtype;
    }

    // 2. Validate required text/JSON fields
    if (!name || !rawGeometry || !rawArea) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const pricePerSquareFoot = Number(rawPrice);
    if (!Number.isFinite(pricePerSquareFoot) || pricePerSquareFoot < 0.01) {
      return NextResponse.json(
        { message: "Price per square foot must be at least 0.01" },
        { status: 400 }
      );
    }

    // Parse stringified JSON objects safely
    let geometry, area;
    try {
      geometry = JSON.parse(rawGeometry);
      area = JSON.parse(rawArea);
    } catch {
      return NextResponse.json(
        { message: "Invalid geometry or area format" },
        { status: 400 }
      );
    }

    // 3. Extract and validate uploaded images
    const imageFiles = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (imageFiles.length < 3) {
      return NextResponse.json(
        { message: "Please upload at least 3 images" },
        { status: 400 }
      );
    }

    // 4. Upload all images to Cloudinary concurrently
    const imageUrls = await Promise.all(
      imageFiles.map((file) => uploadToCloudinary(file))
    );

    // 5. Save parcel with Cloudinary URLs in MongoDB
    const parcel = await Parcel.create({
      name,
      ownerId: session.user.id,
      pricePerSquareFoot,
      geometry,
      area,
      images: imageUrls,
      ...(landtype ? { landtype } : {}),
    });

    return NextResponse.json(
      {
        message: "Parcel saved successfully",
        parcel,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Parcel creation error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Included 'images' and 'landtype' in .select() so your map/frontend receives them
    const parcels = await Parcel.find({ ownerId: session.user.id })
      .select("_id name geometry area pricePerSquareFoot landtype images")
      .lean();

    return NextResponse.json({ parcels });
  } catch (error) {
    console.error("Parcel retrieval error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
