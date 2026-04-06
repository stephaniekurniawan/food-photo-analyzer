"use client";
import { FoodPhoto } from "@/types";
import Image from "next/image";
interface Props { photo: FoodPhoto; onClick: (p: FoodPhoto) => void; index: number; size?: number; }
export default function PhotoCard({ photo, onClick, index, size = 70 }: Props) {
  if (!photo.photoUrl) return null;
  return (
    <button onClick={() => onClick(photo)} className="group relative transform rotate-45 overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer flex-shrink-0" style={{ width:`${size}px`, height:`${size}px` }}>
      <div className="absolute inset-0 transform -rotate-45 scale-[1.42]">
        <Image src={photo.photoUrl} alt={photo.description||''} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes={`${Math.round(size*1.42)}px`} unoptimized />
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </button>
  );
}
