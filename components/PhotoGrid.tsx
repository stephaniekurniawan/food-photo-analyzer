
"use client";
import { FoodPhoto } from "@/types";
import { Lang } from "@/lib/i18n";

const COUNTRY_COLORS: Record<string, string> = {
  JP: "#1D9E75", SG: "#E8493F", MY: "#BA7517", ID: "#378ADD", PH: "#7F77DD",
};

interface Props {
  photos: FoodPhoto[];
  lang: Lang;
  onSelect: (p: FoodPhoto) => void;
}

export default function PhotoGrid({ photos, lang, onSelect }: Props) {
  if (!photos.length) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8">
      No photos match the current filters.
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap justify-center p-2" style={{gap: "6px"}}>
        {photos.map((photo) => {
          if (!photo.photoUrl) return null;
          const color = COUNTRY_COLORS[photo.country] || "#999";
          return (
            <div
              key={photo.seq}
              onClick={() => onSelect(photo)}
              title={photo.description || ""}
              className="relative cursor-pointer group flex-shrink-0"
              style={{
                width: 110,
                height: 110,
                transform: "rotate(45deg)",
                overflow: "hidden",
                borderRadius: "4px",
              }}
            >
              <img
                src={photo.photoUrl}
                alt={photo.description || ""}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%) rotate(-45deg)",
                  width: "160px",
                  height: "160px",
                  objectFit: "cover",
                  transition: "transform 0.25s ease",
                }}
                className="group-hover:scale-110"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Country color indicator */}
              <div style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 9,
                height: 9,
                borderRadius: "50%",
                backgroundColor: color,
                transform: "rotate(-45deg)",
                border: "1.5px solid rgba(255,255,255,0.9)",
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
