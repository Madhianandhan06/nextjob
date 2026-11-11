
"use client";

import { APIProvider, AdvancedMarker, Map, Polygon } from "@vis.gl/react-google-maps";
import MapDrawingController from "./MapDrawingController";
import type { SavedParcel } from "@/types/landlens";
import { Fragment, useEffect, useRef, useState } from "react";

type MapWrapperProps = {
  className?: string;
  maxPrice: number;
  drawingActive: boolean;
  onBoundaryChange: (features: unknown[]) => void;
  parcels: SavedParcel[];
  clearDrawingRequest: number;
};

export default function MapWrapper({
  className = "h-full w-full",
  maxPrice,
  drawingActive,
  onBoundaryChange,
  parcels,
  clearDrawingRequest,
}: MapWrapperProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID!;

  const [selectedParcel, setSelectedParcel] = useState<SavedParcel | null>(null);
  const parcelDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedParcel) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !parcelDetailsRef.current?.contains(event.target)
      ) {
        setSelectedParcel(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedParcel(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedParcel]);

  console.log(selectedParcel)
  
  return (
    <APIProvider apiKey={apiKey}>
      <div className={className}>
        <Map
          style={{ width: "100%", height: "100%" }}
          defaultCenter={{ lat: 11.6643, lng: 78.1460 }}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={mapId}
        >

      {parcels
      .filter(
        (property) =>
          property.pricePerSquareFoot != null &&
          property.pricePerSquareFoot <= maxPrice
      )
      .map((parcel) => {
        const ring = parcel.geometry.coordinates[0] ?? [];
        const points = ring.slice(0, -1); // omit the repeated closing point

        const markerPosition = points.length > 0 ? {
                lat: points.reduce((sum, [, lat]) => sum + lat, 0) / points.length,
                lng: points.reduce((sum, [lng]) => sum + lng, 0) / points.length,
              } : null;

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
              onClick={() => {
                setSelectedParcel(parcel);
                console.log("Parcel clicked:", parcel);
              }}
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
            clearDrawingRequest={clearDrawingRequest}
          />
        </Map>

        {selectedParcel && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex items-end justify-center p-3 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:justify-end sm:p-0">
            <div
              ref={parcelDetailsRef}
              role="dialog"
              aria-modal="false"
              aria-label="Land details"
              className="pointer-events-auto max-h-[40dvh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-4 text-gray-900 shadow-lg sm:max-h-[70dvh] sm:p-6"
            >
              <button
                type="button"
                aria-label="Close land details"
                onClick={() => setSelectedParcel(null)}
                className="float-right ml-4 text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
              <h3 className="mb-2 text-lg font-bold">Land Details</h3>
              <p>{selectedParcel.name}</p>
              <span>
                Price:{" "} {selectedParcel.pricePerSquareFoot != null
                  ? `₹${(
                      (selectedParcel.pricePerSquareFoot * selectedParcel.area.squareFeet) /
                      10_000_000
                    ).toFixed(2)} Cr`
                  : "Not available"
                }
              </span>
              <p>Area: {selectedParcel.area.squareFeet} sqft</p>

              <span className="text-xs text-red-500">
                Note: Land Prices are subject to change, This is approximate estimations
              </span>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
