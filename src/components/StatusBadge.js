export default function StatusBadge({ status }) {
  const config = {
    PENDING:          { color: "bg-yellow-100 text-yellow-700 border-yellow-200",  dot: "bg-yellow-400" },
    ACCEPTED:         { color: "bg-blue-100 text-blue-700 border-blue-200",        dot: "bg-blue-400" },
    PICKED_UP:        { color: "bg-indigo-100 text-indigo-700 border-indigo-200",  dot: "bg-indigo-400" },
    ON_THE_WAY:       { color: "bg-purple-100 text-purple-700 border-purple-200",  dot: "bg-purple-400", pulse: true },
    DELIVERED:        { color: "bg-green-100 text-green-700 border-green-200",     dot: "bg-green-400" },
    CANCELLED:        { color: "bg-red-100 text-red-700 border-red-200",           dot: "bg-red-400" },
  };
  const c = config[status] || { color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? "animate-pulse" : ""}`} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}