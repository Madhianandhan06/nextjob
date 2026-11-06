
"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from "terra-draw";

import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter";

type Props = {
  active: boolean;
  onBoundaryChange: (features: unknown[]) => void;
};


export default function MapDrawingController({
  active,
  onBoundaryChange,
}: Props) {
  const map = useMap();
  const drawRef = useRef<TerraDraw | null>(null);
  const activeRef = useRef(active);

  // Initialize Terra Draw once the Google Map is available
  useEffect(() => {
    if (!map) return;

    const mapElement = map.getDiv();
    let draw: TerraDraw | null = null;

    const startDrawing = () => {
      if (
        draw ||
        !mapElement.querySelector('div[style*="z-index: 3;"]')
      ) {
        return;
      }

      observer.disconnect();

      draw = new TerraDraw({
        adapter: new TerraDrawGoogleMapsAdapter({
          map,
          lib: (window as any).google.maps,
          coordinatePrecision: 9,
        }),

        modes: [
          new TerraDrawSelectMode(),

          new TerraDrawPolygonMode({
            styles: {
              fillColor: "#10b981",
              fillOpacity: 0.3,
              outlineColor: "#059669",
              outlineWidth: 3,
            },
          }),
        ],
      });

      drawRef.current = draw;

      draw.on("ready", () => {
        draw?.setMode(activeRef.current ? "polygon" : "select");
      });

      draw.on("change", () => {
        if (draw) onBoundaryChange(draw.getSnapshot());
      });

      draw.start();
    };

    const observer = new MutationObserver(startDrawing);
    observer.observe(mapElement, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    });
    startDrawing();

    return () => {
      observer.disconnect();
      draw?.stop();
      if (drawRef.current === draw) drawRef.current = null;
    };
  }, [map, onBoundaryChange]);

  // Switch between drawing and selecting modes
  useEffect(() => {
    activeRef.current = active;
    const draw = drawRef.current;

    if (!draw) return;

    draw.setMode(active ? "polygon" : "select");
  }, [active]);

  return null;
}
