
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Parcel from "../../models/Parcel";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { name, geometry, area, pricePerSquareFoot } = body;

    if (!name || !geometry || !area) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      typeof pricePerSquareFoot !== "number" ||
      !Number.isFinite(pricePerSquareFoot) ||
      pricePerSquareFoot < 0.01
    ) {
      return NextResponse.json(
        { message: "Price per square foot must be at least 0.01" },
        { status: 400 }
      );
    }

    const parcel = await Parcel.create({
      name,
      ownerId: "temporary-user",
      pricePerSquareFoot,
      geometry,
      area,
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
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function GET() {
    try {
        await connectDB();

        const parcels = await Parcel.find({ ownerId: "temporary-user" })
            .select("_id name geometry area pricePerSquareFoot")
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