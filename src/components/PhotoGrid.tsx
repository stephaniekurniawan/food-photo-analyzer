"use client";
import { FoodPhoto } from "@/types";
import { useState } from "react";
function DiamondPhoto({ photo, onClick }: { photo: FoodPhoto; onClick: () => void }) {
  const [err, setErr] = useState(false);
  return (
    <div onClick={onClick} style={{ width:80,height:80,flexShrink:0,transform:"rotate(45deg)",overflow:"hidden",borderRadius:4,cursor:"pointer",transition:"transform 0.15s" }}
      onMouseEnter={e=>(e.currentTarget.style.transform="rotate(45deg) scale(1.08)")}
      onMouseLeave={e=>(e.currentTarget.style.transform="rotate(45deg) scale(1)")}>
      {!err
        ? <img src={photo.photoUrl} alt="" onError={()=>setErr(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",transform:"rotate(-45deg) scale(1.5)"}} />
        : <div style={{width:"100%",height:"100%",background:photo.colors[0]||"#ddd"}} />}
    </div>
  );
}
export default function PhotoGrid({ photos, onPhotoClick }: { photos: FoodPhoto[]; onPhotoClick: (p: FoodPhoto) => void }) {
  return (
    <div className="flex-1 overflow-hidden bg-[#f0ebe4]" style={{display:"flex",flexWrap:"wrap",gap:4,padding:16,alignContent:"flex-start",justifyContent:"center"}}>
      {photos.map(p => <DiamondPhoto key={`${p.country}-${p.seq}`} photo={p} onClick={() => onPhotoClick(p)} />)}
      {photos.length === 0 && <div className="flex items-center justify-center w-full h-48 text-gray-400 text-sm">No photos match filters</div>}
    </div>
  );
}
