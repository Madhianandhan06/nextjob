"use client";

import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { ButtonGroupSplit } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type PriceSliderProps = {
  maxPrice: number;
  onPriceChange: (price: number) => void;
};

type MapSidebarProps = PriceSliderProps & {
  drawingActive: boolean;
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
};

export function PriceSlider({ maxPrice, onPriceChange }: PriceSliderProps) {

  return (
    <div>
      <label className="text-sm text-gray-400 block mb-2">
        Maximum price / sqft
      </label>

      {/* Only this header and input will re-render on drag! */}
      <h1 className="text-lg font-bold">₹{maxPrice.toLocaleString()}</h1>

      <input
        type="range"
        min="100"
        max="10000"
        value={maxPrice}
        className="w-full accent-emerald-400 cursor-pointer"
        onChange={(e) => onPriceChange(Number(e.target.value))}
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>₹100</span>
        <span>₹10,000</span>
      </div>
    </div>
  );
}

export default function MapSidebar({
  maxPrice,
  onPriceChange,
  drawingActive,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,

}: MapSidebarProps) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        aria-controls="landlens-sidebar"
        aria-expanded={open}
        className="fixed right-3 top-3 z-50 rounded-md bg-[#111827] px-3 py-2 text-sm text-white shadow"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "Hide filters" : "Show filters"}
      </button>
      <aside
        id="landlens-sidebar"
        aria-hidden={!open}
        inert={!open}
        className={`absolute left-0 top-0 z-40 flex h-full shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-[#111827] text-white transition-[width,padding,border-color] duration-300 ease-in-out motion-reduce:transition-none md:relative ${
          open
            ? "w-[70%] gap-4 border-b border-white/10 p-4 md:w-80 md:gap-6 md:border-b-0 md:border-r md:p-5"
            : "w-0 gap-0 border-0 p-0"
        }`}
      >
      {/* Branding */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            Land<span className="text-emerald-400">Lens</span>
          </h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Transparent land intelligence
        </p>

        {/* <ButtonGroupSplit className={"bg-orange-600 my-2"}/> */}

        <div className="space-y-2 my-4">
          {!drawingActive ? (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={onStartDrawing}
            >
              Add Property
            </Button>
          ) : (
            <>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={onFinishDrawing}
              >
                Finish Boundary
              </Button>

              <Button
                variant="outline"
                className="w-full text-blue-600"
                onClick={onCancelDrawing}
              >
                Cancel Drawing
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div>
        <label className="text-sm text-gray-300 mb-2 block">
          Search location
        </label>
        <div className="flex items-center gap-2 bg-[#1f2937] rounded-lg px-3 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            placeholder="City, area or survey number"
            className="bg-transparent outline-none text-sm w-full placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} />
          <h2 className="font-semibold">Property filters</h2>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">
            Zoning type
          </label>
          <select className="w-full bg-[#1f2937] rounded-lg p-3 text-sm outline-none">
            <option>All property types</option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Agricultural</option>
          </select>
        </div>

        <PriceSlider maxPrice={maxPrice} onPriceChange={onPriceChange} />
      </div>

      <div>
        <h2><Link href="/dashboard">Dashboard</Link></h2>
      </div>
      {/* Location */}
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin size={16} />
          <span>Explore land opportunities</span>
        </div>
      </div>
      </aside>
    </>
  );
}
