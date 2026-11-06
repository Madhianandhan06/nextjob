
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
