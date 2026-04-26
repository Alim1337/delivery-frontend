export default function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PREPARING: "bg-blue-100 text-blue-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}