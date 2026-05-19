import {
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import CategoryImage from "./CategoryImage";

export default function CategoryTable({
  categories,
  isLoading,
  isError,
  error,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-12 text-center text-zinc-400">
        Loading categories...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-12 text-center text-red-400">
        {error?.response?.data?.message || "Failed to load categories."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-sm">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-base font-semibold text-white">Category List</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Showing {categories.length} categories
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Category
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Description
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                Status
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((item) => (
              <tr
                key={item.id}
                className="border-t border-white/10 text-zinc-200 transition hover:bg-white/[0.04]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CategoryImage image={item.image} name={item.name} />

                    <div>
                      <p className="text-sm font-semibold leading-5">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        ID: {item.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="max-w-[520px] text-sm leading-6 text-zinc-400">
                    {item.description || "-"}
                  </p>
                </td>

                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {item.status ? <FiCheckCircle /> : <FiXCircle />}
                    {item.status ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      title="Edit category"
                    >
                      <FiEdit2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                      title="Delete category"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {categories.length === 0 && (
              <tr>
                <td colSpan="4" className="px-5 py-12 text-center text-zinc-400">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}