
"use client";
import { FoodPhoto } from "@/types";
import PhotoCard from "./PhotoCard";

interface Props { photos: FoodPhoto[]; onPhotoClick: (p: FoodPhoto) => void; }

export default function PhotoGrid({ photos, onPhotoClick }: Props) {
  if (photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No photos match your filters
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {photos.map((photo) => (
          <PhotoCard
            key={`${photo.country}-${photo.seq}`}
            photo={photo}
            onClick={onPhotoClick}
          />
        ))}
      </div>
    </div>
  );
}
