import { FiImage } from "react-icons/fi";

export default function CategoryImage({
  image,
  name = "Category",
  size = "normal",
  fit = "cover",
}) {
  const sizeClass =
    size === "hero"
      ? "h-[220px] w-full rounded-[24px] sm:h-[280px] sm:rounded-[28px]"
      : size === "large"
        ? "h-44 w-full rounded-2xl"
        : "h-14 w-14 rounded-2xl";

  const objectClass = fit === "contain" ? "object-contain" : "object-cover";

  if (image) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-[#202024] ${size === "normal" ? "table-icon-3d" : ""} ${sizeClass}`}
      >
        <img
          src={image}
          alt={name || "Category"}
          className={`h-full w-full ${objectClass}`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-zinc-200 bg-red-500/10 dark:border-white/10 ${size === "normal" ? "table-icon-3d" : ""} ${sizeClass}`}
    >
      <FiImage
        className={
          size === "hero" || size === "large"
            ? "text-5xl text-red-500"
            : "text-2xl text-red-500"
        }
      />
    </div>
  );
}
