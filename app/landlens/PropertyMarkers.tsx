"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";

export const properties = [
  {
    id: 1,
    title: "Residential Plot",
    lat: 11.6643,
    lng: 78.1460,
    price: 3200,
  },
  {
    id: 2,
    title: "Agricultural Land",
    lat: 11.6700,
    lng: 78.1500,
    price: 850,
  },
  {
    id: 3,
    title: "Commercial Plot",
    lat: 11.6580,
    lng: 78.1400,
    price: 4500,
  },
];

type PropertyMarkersProps = {
  maxPrice: number;
};

export default function PropertyMarkers({ maxPrice }: PropertyMarkersProps) {
  return (
    <>
      {properties
        .filter((property) => property.price <= maxPrice)
        .map((property) => (
        <AdvancedMarker
          key={property.id}
          position={{
            lat: property.lat,
            lng: property.lng,
          }}
        >
          <div className="bg-emerald-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-bold">
            ₹{property.price}/sqft
          </div>
        </AdvancedMarker>
      ))}
    </>
  );
}