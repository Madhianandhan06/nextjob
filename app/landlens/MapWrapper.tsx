
"use client";

import { APIProvider, AdvancedMarker, Map, Polygon } from "@vis.gl/react-google-maps";

import PropertyMarkers from "./PropertyMarkers";
import MapDrawingController from "./MapDrawingController";
import type { SavedParcel } from "@/types/landlens";
import { Fragment } from "react";

type MapWrapperProps = {
  className?: string;
  maxPrice: number;
  drawingActive: boolean;
  onBoundaryChange: (features: unknown[]) => void;
  parcels: SavedParcel[];
};

export default function MapWrapper({
  className = "h-full w-full",
  maxPrice,
  drawingActive,
  onBoundaryChange,
  parcels,
}: MapWrapperProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID!;

  return (
    <APIProvider apiKey={apiKey}>
      <div className={className}>
        <Map
          defaultCenter={{ lat: 11.6643, lng: 78.1460 }}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={mapId}
        >
          <PropertyMarkers maxPrice={maxPrice} />

      {parcels.map((parcel) => {
        const ring = parcel.geometry.coordinates[0] ?? [];
        const points = ring.slice(0, -1); // omit the repeated closing point

        const markerPosition =
          points.length > 0
            ? {
                lat: points.reduce((sum, [, lat]) => sum + lat, 0) / points.length,
                lng: points.reduce((sum, [lng]) => sum + lng, 0) / points.length,
              }
            : null;

        return (
          <Fragment key={parcel._id}>
            <Polygon
              paths={parcel.geometry.coordinates.map((polygonRing) =>
                polygonRing.map(([lng, lat]) => ({ lat, lng }))
              )}
              fillColor="red"
              fillOpacity={0.25}
              strokeColor="red"
              strokeWeight={2}
              clickable
            />

            {parcel.pricePerSquareFoot != null && markerPosition && (
              <AdvancedMarker position={markerPosition}>
                <div className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg">
                  ₹{parcel.pricePerSquareFoot}/sqft
                </div>
              </AdvancedMarker>
            )}
          </Fragment>
        );
      })}

          <MapDrawingController
            active={drawingActive}
            onBoundaryChange={onBoundaryChange}
          />
        </Map>
      </div>
    </APIProvider>
  );
}
