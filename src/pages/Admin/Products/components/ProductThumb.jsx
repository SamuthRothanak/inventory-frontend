import React from "react";
import { FiPackage } from "react-icons/fi";

export default function ProductThumb({ product }) {
  const image =
    product.imagePath ||
    product.variants?.find((variant) => variant.imagePath)?.imagePath;

  if (image) {
    return (
      <img
        src={image}
        alt={product.name}
        className="h-12 w-12 rounded-2xl object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
      <FiPackage className="text-xl text-red-500" />
    </div>
  );
}