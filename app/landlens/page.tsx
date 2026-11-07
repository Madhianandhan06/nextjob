
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapSidebar from "../landlens/MapSidebar";
import MapWrapper from "../landlens/MapWrapper";
import PropertyMarkers from "../landlens/PropertyMarkers";

import type { LandFeature, SavedParcel } from "@/types/landlens";

export default function LandLensPage() {
  const [maxPrice, setMaxPrice] = useState(5000);

  // Controls whether the owner can draw a boundary
  const [drawingActive, setDrawingActive] = useState(false);

  // Stores the drawn GeoJSON features
  const [boundary, setBoundary] = useState<LandFeature[]>([]);


  const [parcelSaved, setParcelSaved] = useState(false);


  const [parcels, setParcels] = useState<SavedParcel[]>([]);


  console.log("Current parcels:", parcels);
  const [landprice, setLandprice] = useState("");

  const isLandPriceValid =
    landprice.trim() !== "" &&
    Number.isFinite(Number(landprice)) &&
    Number(landprice) >= 0.01;

  const loadParcels = useCallback(async () => {
    const response = await fetch("/api/parcels");
    if (!response.ok) throw new Error("Could not load parcels");

    const data = (await response.json()) as { parcels: SavedParcel[] };
    setParcels(data.parcels);
  }, []);

  useEffect(() => {
    loadParcels().catch((error) =>
      console.error("Could not load parcels:", error)
    );
  }, [loadParcels]);

  console.log("Current boundary:", boundary);
  const handleBoundaryChange = useCallback(
    (features: unknown[]) => {
      const landFeatures = features as LandFeature[];
      setBoundary(landFeatures);
      console.log("Land boundary:", landFeatures);
    },
    []
  );

  const handleFinishDrawing = () => {
    setDrawingActive(false);
    console.log("Final boundary:", boundary);
  };

  const handleCancelDrawing = () => {
    setDrawingActive(false);
    setBoundary([]);
  };


  const hasFourSidedBoundary = boundary.some((feature) => {
    if (feature.geometry.type !== "Polygon") return false;

    const ring = feature.geometry.coordinates[0] ?? [];
    const vertices = ring.slice(0, -1); // exclude the closing coordinate
    const distinctVertices = new Set(
      vertices.map(([lng, lat]) => `${lng},${lat}`)
    );

    return distinctVertices.size >= 3
  });

  async function handleSaveParcel() {

    const feature = boundary[0];

    if (!feature) {
      alert("Draw a boundary first");
      return;
    }

    if (!isLandPriceValid) return;

    try {
      const response = await fetch("/api/parcels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "My Land",
          pricePerSquareFoot: Number(landprice),
          geometry: feature.geometry,
          area: {
            squareMeters: 223,
            squareFeet: 2403,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Could not save parcel");
      }

      setParcelSaved(true);
      await loadParcels();
    } catch (error) {
      console.error("Could not save parcel:", error);
    }
  }



  console.log(hasFourSidedBoundary)

  return (
    <main className="h-screen w-full flex overflow-hidden bg-[#0b1120]">

      <MapSidebar
        maxPrice={maxPrice}
        onPriceChange={setMaxPrice}
        drawingActive={drawingActive}
        onStartDrawing={() => {
          setParcelSaved(false);
          setLandprice("");
          setDrawingActive(true);
        }}
        onFinishDrawing={handleFinishDrawing}
        onCancelDrawing={handleCancelDrawing}
      />

      <section className="relative flex-1 h-full min-w-0">
        <MapWrapper
          className="h-full w-full relative"
          maxPrice={maxPrice}
          drawingActive={drawingActive}
          onBoundaryChange={handleBoundaryChange}

          parcels={parcels}
        />

        {hasFourSidedBoundary && !parcelSaved && (
          <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-red-600 p-2 shadow-lg">
            <input
              value={landprice}
              onChange={(e) => setLandprice(e.target.value)}
              type="number"
              min="0.01"
              step="any"
              className="w-40 rounded-lg border-none bg-white p-2 focus:outline-none"
              placeholder="Price per square feet"
            />
            <button
              className="rounded-lg px-2.5 py-0.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isLandPriceValid}
              onClick={handleSaveParcel}
            >
              Save
            </button>
          </div>
        )}
      </section>

    </main>
  );
}
