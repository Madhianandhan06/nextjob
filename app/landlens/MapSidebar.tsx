"use client";

import { Search, MapPin, SlidersHorizontal } from "lucide-react";

import { useState, type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline";
};

function Button({ variant: _variant, ...props }: ButtonProps) {
  return <button {...props} />;
}

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

  const [localMaxPrice, setLocalMaxPrice] = useState(false);
  {console.log("localMaxPrice:", localMaxPrice)}
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-2">
        Maximum price / sqft
      </label>

      {/* Only this header and input will re-render on drag! */}

      {localMaxPrice ? (
        <input
          type="number"
          min="100"
          max="10000"
          value={maxPrice}
          autoFocus
          className="border-0 bg-[#1f2937] text-left rounded-lg px-3 py-2 p-1 w-full border-none text-lg font-bold outline-none"
          onChange={(e) => onPriceChange(Number(e.target.value))}
          onBlur={() => setLocalMaxPrice(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setLocalMaxPrice(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setLocalMaxPrice(true)}
          className="bg-[#1f2937] text-left rounded-lg px-3 py-1 p-0 w-full text-lg font-bold"
        >
          ₹{maxPrice.toLocaleString()}
        </button>
      )}
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed right-3 top-3 z-50 flex w-40 flex-col gap-2">
        <Button
          type="button"
          aria-controls="landlens-sidebar"
          aria-expanded={open}
          className="w-full !bg-slate-800 !text-white shadow hover:!bg-slate-700 active:!bg-slate-900"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Hide filters" : "Show filters"}
        </Button>

        {!drawingActive ? (
          <Button
            className="w-full !bg-red-600 !text-white hover:!bg-red-700 active:!bg-red-800"
            onClick={onStartDrawing}
          >
            Add Property
          </Button>
        ) : (
          <>
            <Button
              className="w-full !bg-orange-600 !text-white hover:!bg-orange-700 active:!bg-orange-800"
              onClick={onFinishDrawing}
            >
              Finish Boundary
            </Button>

            <Button
              variant="outline"
              className="w-full !border-slate-500 !bg-slate-800 !text-slate-100 hover:!bg-slate-700 active:!bg-slate-900"
              onClick={onCancelDrawing}
            >
              Cancel Drawing
            </Button>
          </>
        )}
      </div>

      <aside
        id="landlens-sidebar"
        aria-hidden={!open}
        inert={!open}
        className={`absolute left-0 top-0 z-40 flex h-full shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-[#111827] text-white transition-[width,padding,border-color] duration-300 ease-in-out motion-reduce:transition-none ${
          open
            ? "w-[70%] gap-2 border-b border-white/10 px-4 py-3 md:w-80 md:gap-6 md:border-b-0 md:border-r md:p-5"
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

      </div>

      {/* Search */}
      <div>
        <label className="text-lg font-semibold text-gray-300 mb-2 block">
          Search location
        </label>
        <div className="flex items-center gap-2 rounded-lg bg-[#1f2937] px-3 py-2.5 md:py-3">
          <Search size={18} className="text-gray-400" />
          <input
            placeholder="City, area or survey number"
            className="bg-transparent outline-none text-sm w-full placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 md:space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} />
          <h2 className="font-semibold">Property filters</h2>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">
            Zoning type
          </label>
          <select className="w-full rounded-lg bg-[#1f2937] p-2.5 text-sm outline-none md:p-3">
            <option>All property types</option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Agricultural</option>
          </select>
        </div>

        <PriceSlider maxPrice={maxPrice} onPriceChange={onPriceChange} />
      </div>

      <div className="flex justify-around gap-2">
        <button className="bg-gray-600 flex-1 hover:bg-gray-700 text-white py-2 px-4 rounded-lg">
          Clear Filters
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">
          Show Results
        </button>
      </div>
      {/* Location */}
      <div className="mt-auto border-t border-white/10 pt-2 md:pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin size={16} />
          <span>Explore land opportunities</span>
        </div>
      </div>
      </aside>
    </>
  );
}
