import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { QUINTILE_COLORS } from "./rsiModel";
import { SegmentResult } from "./types";

const NONE_COLOR = "#adb5bd";

// 3개 구를 한 화면에 담는 초기 중심/줌. OSM 무료 타일 사용 정책상 출처 표기 필수.
const INITIAL_CENTER: [number, number] = [37.585, 126.93];
const INITIAL_ZOOM = 12;

interface MapViewProps {
  results: SegmentResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapView({ results, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    results.forEach((r) => {
      const radius = 4 + Math.sqrt(r.segment.treeCount) * 0.6;
      const color = r.quintile ? QUINTILE_COLORS[r.quintile] : NONE_COLOR;
      const isSelected = r.segment.id === selectedId;

      const marker = L.circleMarker([r.segment.lat, r.segment.lng], {
        radius,
        color: isSelected ? "#1c1c1c" : "#ffffff",
        weight: isSelected ? 2.5 : 1,
        fillColor: color,
        fillOpacity: 0.85,
      });

      marker.bindTooltip(`${r.segment.gu} ${r.segment.roadName}`, { direction: "top" });
      marker.on("click", () => onSelectRef.current(r.segment.id));
      marker.addTo(layerGroup);
    });
  }, [results, selectedId]);

  return <div ref={containerRef} className="leaflet-map" />;
}
