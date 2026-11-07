export type Position = [number, number];

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: Position[][];
};

export type LandFeature = {
  type: "Feature";
  id: string;
  properties: {
    mode: string;
  };
  geometry: PolygonGeometry;
};

export type SavedParcel = {
  _id: string;
  name: string;
  pricePerSquareFoot?: number;
  geometry: PolygonGeometry;
  area: {
    squareMeters: number;
    squareFeet: number;
  };
};