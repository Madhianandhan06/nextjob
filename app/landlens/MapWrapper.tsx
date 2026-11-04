"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import PropertyMarkers from "./PropertyMarkers";

type MapWrapperProps = {
  maxPrice: number;
};

export default function MapWrapper({ maxPrice }: MapWrapperProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID!;
  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-full w-full">
        <Map
          defaultCenter={{ lat: 11.6643, lng: 78.1460 }}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={mapId}
        >
            <PropertyMarkers maxPrice={maxPrice} />
        </Map>
      </div>
    </APIProvider>
  );
}