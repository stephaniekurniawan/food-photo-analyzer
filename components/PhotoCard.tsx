
"use client";
import { FoodPhoto } from "@/types";
import Image from "next/image";

const COUNTRY_COLORS: Record<string, string> = {
  JP: "#1D9E75", SG: "#E8493F", MY: "#BA7517", ID: "#378ADD", PH: "#7F77DD",
};

interface Props { photo: FoodPhoto; onClick: (p: FoodPhoto) => void; }

export default function PhotoCard({ photo, onClick }: Props) {
  if (!photo.photoUrl) return null;
  const color = COUNTRY_COLORS[photo.country] || "#666";
  return (
    <button
      onClick={() => onClick(photo)}
      className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] cursor-pointer bg-gray-100 w-full"
      style={{ aspectRatio: "1 / 1" }}
    >
      <Image
        src={photo.photoUrl}
        alt={photo.description || ""}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="300px"
        unoptimized
      />
      {/* Country tag */}
      <span
        className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full text-white shadow"
        style={{ background: color }}
      >
        {photo.country}
      </span>
      {/* Cuisine tag */}
      {photo.cuisineType && (
        <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
          {photo.cuisineType}
        </span>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex flex-col justify-end p-2">
        <p className="text-white text-[11px] font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
          {photo.description}
        </p>
      </div>
      {/* Color strip */}
      {photo.colors.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          {photo.colors.slice(0, 5).map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
      )}
    </button>
  );
}
