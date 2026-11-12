
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapSidebar from "../landlens/MapSidebar";
import MapWrapper from "../landlens/MapWrapper";
import type { LandFeature, SavedParcel } from "@/types/landlens";
import { toast } from "sonner";
import { area } from "@turf/area";

export default function LandLensPage() {
  const [maxPrice, setMaxPrice] = useState(5000);

  // Controls whether the owner can draw a boundary
  const [drawingActive, setDrawingActive] = useState(false);

  // Stores the drawn GeoJSON features
  const [boundary, setBoundary] = useState<LandFeature[]>([]);


  const [parcelSaved, setParcelSaved] = useState(false);


  const [parcels, setParcels] = useState<SavedParcel[]>([]);


  const [clearDrawingRequest, setClearDrawingRequest] = useState(0);


  const [landtype, setLandtype] = useState("residential");

  console.log("Current parcels:", parcels);


  const [landprice, setLandprice] = useState("");

  const [images, setImages] = useState<File[]>([]);

  const hasEnoughImages = images.length >= 3;

  const [loading, setLoading] = useState(false);

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

  const selectedFeature = boundary[0];

  const areaInSquareMeters = selectedFeature
    ? area(selectedFeature)
    : 0;

  const areaInSquareFeet = areaInSquareMeters * 10.7639104167;

  async function handleSaveParcel() {
    setLoading(true);
    const feature = boundary[0];

    if (!feature) {
      alert("Draw a boundary first");
      setLoading(false);
      return;
    }

    if (!isLandPriceValid || !hasEnoughImages) return;

    try {
      const formData = new FormData();
      formData.append("name", "My Land");
      formData.append("pricePerSquareFoot", landprice);
      formData.append("landtype", landtype);

      // Stringify nested objects before appending to FormData
      formData.append("geometry", JSON.stringify(feature.geometry));
      formData.append(
        "area",
        JSON.stringify({
          squareMeters: Number(areaInSquareMeters.toFixed(2)),
          squareFeet: Number(areaInSquareFeet.toFixed(2)),
        })
      );

      // Append each image file under the same key name ("images")
      images.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/parcels", {
        method: "POST",
        // Note: Do NOT set 'Content-Type': 'application/json' here
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message ?? "Could not save parcel");
        return;
      }

      toast.success(result.message ?? "Parcel saved");
      setDrawingActive(false);
      setImages([]); // Reset selected images
      setClearDrawingRequest((request) => request + 1);
      await loadParcels();
      setParcelSaved(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save parcel"
      );
      console.error("Could not save parcel:", error);
    }finally {
      setLoading(false);
    }
  }

  console.log(hasFourSidedBoundary)

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#0b1120] md:flex-row">

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

      <section className="relative min-h-0 min-w-0 flex-1">
        <MapWrapper
          className="absolute inset-0"
          maxPrice={maxPrice}
          drawingActive={drawingActive}
          onBoundaryChange={handleBoundaryChange}
          parcels={parcels}
          clearDrawingRequest={clearDrawingRequest}
        />

        {hasFourSidedBoundary && !parcelSaved && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col space-y-2 rounded-lg bg-orange-600 p-2 text-white shadow-lg">            <input
            value={landprice}
            onChange={(e) => setLandprice(e.target.value)}
            type="number"
            min="0.01"
            step="any"
            className="w-full rounded-lg border-none text-black bg-white p-2 focus:outline-none"
            placeholder="Price per square feet"
          />
            <div className="rounded-lg bg-white p-2 text-black text-sm">
              <p>
                Area: {areaInSquareFeet.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })} sqft
              </p>
            </div>
            <div>
              <div className="flex flex-col gap-2">
                <select
                  value={landtype}
                  onChange={(e) => setLandtype(e.target.value)}
                  className="rounded-lg border-none text-black bg-white p-2 focus:outline-none"
                >
                  <option value="residential" defaultChecked>
                    Residential
                  </option>
                  <option value="commercial">Commercial</option>
                  <option value="agricultural">Agricultural</option>
                </select>
                 {!hasEnoughImages &&(
                  <p className="text-xs font-bold text-center text-white">
                    Minimum Upload 3 Images
                  </p>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      const selectedFiles = Array.from(e.target.files);
                      setImages(selectedFiles);
                    }
                  }}
                  className="rounded-lg border-none text-black bg-white p-2 focus:outline-none"
                />
              </div>
            </div>
            <button
              className="rounded-lg px-2.5 py-0.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isLandPriceValid || !hasEnoughImages || loading}
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
