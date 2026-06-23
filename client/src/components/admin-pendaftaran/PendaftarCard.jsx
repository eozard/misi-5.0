import { CheckCircle, Clock } from "lucide-react";

const DIVISI_OPTIONS = [
  "Networking",
  "Software Engineer",
  "Multimedia",
  "Artificial Intelligence",
  "Data Analyst",
];

const PendaftarCard = ({
  item,
  index,
  editingId,
  editDivisi,
  setEditDivisi,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onView,
}) => {
  const isEditing = editingId === item.id;
  const isAssigned = !!item.assigned_divisi;
  const isPriority = index <= 30;

  if (isEditing) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <select
          className="w-full text-sm border-gray-300 rounded-md mb-2 py-1.5"
          value={editDivisi}
          onChange={(e) => setEditDivisi(e.target.value)}
        >
          <option value="">-- Pilih Divisi --</option>
          {DIVISI_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(item.id)}
            className="flex-1 bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-indigo-700"
          >
            Simpan
          </button>
          <button
            onClick={onCancelEdit}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          isPriority
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {index}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{item.nama}</h3>
          <span className="text-xs text-gray-500 font-mono">{item.nim}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mb-1.5">{item.email}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {isAssigned ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              {item.assigned_divisi}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">
              <Clock className="w-3 h-3" />
              Belum di-assign
            </span>
          )}
          <button
            onClick={() => onEdit(item)}
            className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors"
          >
            {isAssigned ? "Ganti" : "Set Divisi"}
          </button>
          <button
            onClick={() => onView(item)}
            className="text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100 px-2 py-0.5 rounded transition-colors"
          >
            Lihat
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendaftarCard;
