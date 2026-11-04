"use client";

import { useState } from "react";
import MapSidebar from "../landlens/MapSidebar";
import MapWrapper from "../landlens/MapWrapper";

export default function LandLensPage() {
  const [maxPrice, setMaxPrice] = useState(5000);
  console.log("Max Price:", maxPrice); // Log the current maxPrice value
  return (
    <main className="h-screen w-full flex overflow-hidden bg-[#0b1120]">
      <MapSidebar maxPrice={maxPrice} onPriceChange={setMaxPrice} />
      <section className="flex-1 h-full min-w-0">
        <MapWrapper maxPrice={maxPrice} />
      </section>
    </main>
  );
}
