
import mongoose, { Schema, models, model } from "mongoose";

const parcelSchema = new Schema(
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
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enable geographical queries
parcelSchema.index({ geometry: "2dsphere" });

const Parcel =
  models.Parcel || model("Parcel", parcelSchema);

export default Parcel;
