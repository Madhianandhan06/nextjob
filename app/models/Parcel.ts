
import mongoose, { Schema, models, model } from "mongoose";

export type LandType =
  | "residential"
  | "commercial"
  | "agricultural"
  | "industrial";

type ParcelData = {
  ownerId: string;
  name: string;
  pricePerSquareFoot: number;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  area: {
    squareMeters: number;
    squareFeet: number;
  };
  landtype?: LandType;
  images: string[];
};

const parcelSchema = new Schema<ParcelData>(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    pricePerSquareFoot: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: (value: number) => Number.isFinite(value),
        message: "Price per square foot must be a finite number",
      },
    },

    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },

      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },

    area: {
      squareMeters: {
        type: Number,
        required: true,
      },

      squareFeet: {
        type: Number,
        required: true,
      },
    },
    landtype: {
      type: String,
      enum: ["residential", "commercial", "agricultural", "industrial"],
    },
    // Add this field inside your ParcelSchema definition
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 3,
        message: "At least 3 images are required.",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Enable geographical queries
parcelSchema.index({ geometry: "2dsphere" });

const Parcel =
  (models.Parcel as mongoose.Model<ParcelData> | undefined) ||
  model<ParcelData>("Parcel", parcelSchema);

export default Parcel;
