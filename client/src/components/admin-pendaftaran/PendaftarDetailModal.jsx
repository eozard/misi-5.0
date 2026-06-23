import { ExternalLink, FileText, Mail, User2, X } from "lucide-react";

const pickAttachments = (item) => {
  const candidates = [
    { key: "cv_url", label: "CV" },
    { key: "transkrip_url", label: "Transkrip" },
    { key: "surat_persetujuan_url", label: "Surat persetujuan" },
    { key: "krs_url", label: "KRS" },
    { key: "portfolio_url", label: "Portofolio" },
  ];

  return candidates
    .map((c) => ({
      label: c.label,
      url: item?.[c.key],
      key: c.key,
    }))
    .filter((x) => !!x.url);
};

const PendaftarDetailModal = ({ open, item, onClose }) => {
  if (!open) return null;

  const attachments = pickAttachments(item);
  const assigned = item?.assigned_divisi || "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
              Detail pendaftar
            </p>
            <h3 className="mt-1 truncate text-lg font-extrabold tracking-tight text-gray-900">
              {item?.nama || "Pendaftar"}
            </h3>
            <p className="mt-1 truncate text-sm text-gray-500">
              {item?.nim || "-"} · {item?.email || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-bold text-gray-900">Identitas</p>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Nama</span>
                <span className="max-w-[65%] truncate font-semibold text-gray-900">
                  {item?.nama || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">NIM</span>
                <span className="max-w-[65%] truncate font-mono font-semibold text-gray-900">
                  {item?.nim || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Divisi</span>
                <span className="max-w-[65%] truncate font-semibold text-gray-900">
                  {assigned}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-bold text-gray-900">Kontak</p>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Email</span>
                <span className="max-w-[65%] truncate font-semibold text-gray-900">
                  {item?.email || "-"}
                </span>
              </div>
              {item?.no_hp && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">No HP</span>
                  <span className="max-w-[65%] truncate font-semibold text-gray-900">
                    {item?.no_hp}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-bold text-gray-900">Berkas</p>
            </div>

            {attachments.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Tidak ada link berkas yang tersimpan.
              </p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {attachments.map((a) => (
                  <a
                    key={a.key}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    <span className="truncate">{a.label}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400 transition group-hover:text-gray-700" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendaftarDetailModal;

