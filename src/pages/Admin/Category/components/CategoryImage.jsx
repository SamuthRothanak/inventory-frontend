import { FiImage } from "react-icons/fi";

export default function CategoryImage({ image, name, large = false }) {
  const sizeClass = large
    ? "h-40 w-full rounded-2xl"
    : "h-14 w-14 rounded-2xl";

  if (image) {
    return (
      <img
        src={image}
        alt={name || "Category"}
        className={`${sizeClass} object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-red-500/10 ${sizeClass}`}
    >
      <FiImage className={large ? "text-5xl text-red-500" : "text-2xl text-red-500"} />
    </div>
  );
}