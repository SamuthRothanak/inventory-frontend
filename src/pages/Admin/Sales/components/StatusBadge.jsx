export default function StatusBadge({ status, label, getStatusClass, getStatusIcon }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
    >
      {getStatusIcon(status)}
      {label ?? status}
    </span>
  );
}


