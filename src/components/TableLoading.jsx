import { FiRefreshCw } from "react-icons/fi";

export default function TableLoading({
  theme,
  colSpan = 4,
  text = "Loading data...",
}) {
  return (
    <tr className={`border-t ${theme.row}`}>
      <td colSpan={colSpan} className="px-4 py-20 text-center">
        <div className="flex min-h-[180px] flex-col items-center justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
          >
            <FiRefreshCw className={`animate-spin text-3xl ${theme.muted}`} />
          </div>

          <p className={`mt-5 text-sm font-semibold ${theme.title}`}>
            {text}
          </p>
        </div>
      </td>
    </tr>
  );
}