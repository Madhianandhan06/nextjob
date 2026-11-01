import OpenAI from "openai";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "An image file is required" }, { status: 400 });
    }

    if (!allowedImageTypes.has(image.type)) {
      return NextResponse.json(
        { error: "Upload a JPEG, PNG, GIF, or WebP image" },
        { status: 400 }
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The image must be 20 MB or smaller" },
        { status: 413 }
      );
    }

    const imageBytes = Buffer.from(await image.arrayBuffer());
    const imageDataUrl = `data:${image.type};base64,${imageBytes.toString("base64")}`;
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: { url: imageDataUrl },
        },
      ],
    });

    const result = response.results?.[0];
    if (!result) {
      return NextResponse.json({ error: "No moderation result returned" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Image moderation failed:", error);
    return NextResponse.json(
      { error: "Image moderation failed" },
      { status: 500 }
    );
  }
}