"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import { FoodPhoto } from "@/types";
import PhotoCard from "./PhotoCard";
interface Props { photos: FoodPhoto[]; onPhotoClick: (p: FoodPhoto) => void; }
export default function PhotoGrid({ photos, onPhotoClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  useEffect(() => {
    const update = () => { if (containerRef.current) setContainerSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight }); };
    update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update);
  }, []);
  const { size, step, cols } = useMemo(() => {
    const count = photos.length;
    let s = count<=20?120:count<=50?100:count<=100?80:count<=200?65:count<=350?55:48;
    const maxSize = Math.floor((containerSize.w-20)/4.5);
    s = Math.max(32, Math.min(s, maxSize));
    const st = s+4;
    const c = Math.max(4, Math.floor((containerSize.w-s)/st));
    return { size: s, step: st, cols: c };
  }, [photos.length, containerSize]);
  const positions = useMemo(() => {
    const result: { x:number; y:number; photo:FoodPhoto }[] = [];
    let row=0, idx=0; const pad=size/2, vStep=step*0.5;
    while (idx < photos.length) {
      const isOffset = row%2===1;
      const itemsInRow = isOffset?cols-1:cols;
      for (let col=0; col<itemsInRow && idx<photos.length; col++) {
        result.push({ x:pad+col*step+(isOffset?step/2:0), y:pad+row*vStep, photo:photos[idx] });
        idx++;
      }
      row++;
    }
    return { items: result, rows: row };
  }, [photos, size, step, cols]);
  const pad=size/2, totalHeight=pad+positions.rows*(step*0.5)+size+pad, totalWidth=pad+cols*step+pad;
  return (
    <div ref={containerRef} className="flex-1 overflow-auto">
      <div className="relative mx-auto transition-all duration-300" style={{ width:`${totalWidth}px`, height:`${totalHeight}px` }}>
        {positions.items.map(({ x, y, photo }, i) => (
          <div key={`${photo.country}-${photo.seq}`} className="absolute transition-all duration-300" style={{ left:`${x}px`, top:`${y}px`, width:`${size}px`, height:`${size}px` }}>
            <PhotoCard photo={photo} onClick={onPhotoClick} index={i} size={size} />
          </div>
        ))}
      </div>
    </div>
  );
}
