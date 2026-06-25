import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Mail, User2, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const resolveFileUrl = (rawUrl) => {
  const url = String(rawUrl || "");
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/uploads/")) {
    try {
      const origin = new URL(API_URL).origin;
      return `${origin}${url}`;
    } catch {
      return url;
    }
  }

  return url;
};

const pickAttachments = (item) => {
  const candidates = [
    { key: "cv_url", label: "CV" },
    { key: "transkrip_url", label: "Transkrip nilai" },
    { key: "surat_persetujuan_url", label: "Surat persetujuan" },
    { key: "krs_url", label: "KRS" },
    { key: "portfolio_url", label: "Portofolio" },
  ];

  return candidates
    .map((c) => ({
      label: c.label,
      url: resolveFileUrl(item?.[c.key]),
      key: c.key,
    }))
    .filter((x) => !!x.url);
};

const isLikelyPdf = (url) => {
  const u = String(url || "").toLowerCase();
  return u.includes(".pdf") || u.includes("application/pdf") || u.includes("pdf");
};

const PendaftarDetailModal = ({ open, item, onClose }) => {
  if (!open) return null;

  const attachments = useMemo(() => pickAttachments(item), [item]);
  const [activeKey, setActiveKey] = useState(null);

  useEffect(() => {
    if (!open) return;
    setActiveKey(attachments[0]?.key || null);
  }, [open, item?.id, attachments]);

  const activeAttachment = useMemo(
    () => attachments.find((a) => a.key === activeKey) || attachments[0] || null,
    [attachments, activeKey]
  );

  const assigned = item?.assigned_divisi || "-";
  const preferred =
    item?.divisi ||
    item?.divisi_pilihan ||
    item?.pilihan_divisi ||
    item?.pilihan ||
    "-";
  const assignedBy = item?.admin_nama || item?.assigned_by || item?.updated_by || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-bold text-gray-900">Detail pendaftar</p>
            </div>
            <p className="mt-1 truncate text-xs text-gray-500">
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

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-bold text-gray-900">Info</p>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Nama</p>
                <p className="mt-1 truncate font-semibold text-gray-900">
                  {item?.nama || "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <p className="mt-1 truncate font-semibold text-gray-900">
                  {item?.email || "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">NIM</p>
                <p className="mt-1 truncate font-mono font-semibold text-gray-900">
                  {item?.nim || "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Divisi pilihan</p>
                <p className="mt-1 truncate font-semibold text-gray-900">
                  {preferred}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Divisi assigned</p>
                <p className="mt-1 truncate font-semibold text-gray-900">
                  {assigned}
                </p>
              </div>
              {assignedBy && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Oleh</p>
                  <p className="mt-1 truncate font-semibold text-gray-900">
                    {assignedBy}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-bold text-gray-900">Preview berkas</p>
              </div>
              {activeAttachment?.url && (
                <a
                  href={activeAttachment.url}
                  download
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Unduh
                </a>
              )}
            </div>

            {attachments.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Tidak ada link berkas yang tersimpan.
              </p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((a) => {
                    const active = a.key === (activeAttachment?.key || attachments[0]?.key);
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => setActiveKey(a.key)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  {activeAttachment?.url ? (
                    <iframe
                      key={activeAttachment.key}
                      title={activeAttachment.label}
                      src={
                        isLikelyPdf(activeAttachment.url)
                          ? `${activeAttachment.url}#toolbar=1&navpanes=0`
                          : activeAttachment.url
                      }
                      className="h-[620px] w-full bg-white"
                    />
                  ) : (
                    <div className="flex h-[620px] items-center justify-center">
                      <p className="text-sm text-gray-500">Tidak ada preview</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendaftarDetailModal;
