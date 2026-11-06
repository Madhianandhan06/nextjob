
"use client";

import { APIProvider, Map, Polygon } from "@vis.gl/react-google-maps";

import PropertyMarkers from "./PropertyMarkers";
import MapDrawingController from "./MapDrawingController";
import type { SavedParcel } from "@/types/landlens";

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

          {parcels.map((parcel) => (
            <Polygon
              key={parcel._id}
              paths={parcel.geometry.coordinates.map((ring) =>
                ring.map(([lng, lat]) => ({ lat, lng }))
              )}
              fillColor="red"
              fillOpacity={0.25}
              strokeColor="red"
              strokeWeight={2}
              clickable={true}
            />
          ))}

          <MapDrawingController
            active={drawingActive}
            onBoundaryChange={onBoundaryChange}
          />
        </Map>
      </div>
    </APIProvider>
  );
}
