import { useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";

const DivisiView = ({ pendaftar, divisiOptions, maxPerDivisi = 6 }) => {
  const assigned = (pendaftar || []).filter((p) => p.assigned_divisi);
  const unassigned = (pendaftar || []).filter((p) => !p.assigned_divisi);

  const [expanded, setExpanded] = useState({});

  const grouped = divisiOptions.reduce((acc, divisi) => {
    acc[divisi] = assigned.filter((p) => p.assigned_divisi === divisi);
    return acc;
  }, {});

  const totalCapacity = divisiOptions.length * maxPerDivisi;
  const totalAssigned = assigned.length;
  const fullness = totalCapacity > 0 ? Math.min(100, (totalAssigned / totalCapacity) * 100) : 0;

  const sortedDivisi = useMemo(() => {
    return [...divisiOptions].sort((a, b) => (grouped[b]?.length || 0) - (grouped[a]?.length || 0));
  }, [divisiOptions, grouped]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <div className="space-y-2 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-100">
            <Briefcase className="h-3.5 w-3.5 text-emerald-300" />
            divisi
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Distribusi peserta per divisi
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-blue-50/80">Ringkasan penerimaan per divisi.</p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Assigned:{" "}
                <span className="font-bold tabular-nums">{totalAssigned}</span>{" "}
                <span className="text-white/70">/ {totalCapacity}</span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Belum:{" "}
                <span className="font-bold tabular-nums">{unassigned.length}</span>
              </div>
            </div>
            <div className="text-xs font-semibold text-white/80">
              Terisi <span className="tabular-nums">{Math.round(fullness)}%</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-emerald-300/90"
              style={{ width: `${fullness}%` }}
            />
          </div>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200/40 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          {unassigned.length} peserta belum di-assign
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortedDivisi.map((divisi) => {
          const members = grouped[divisi] || [];
          const percent = Math.min(100, (members.length / maxPerDivisi) * 100);
          const isFull = members.length >= maxPerDivisi;
          const isExpanded = !!expanded[divisi];
          const previewCount = 2;
          const previewMembers = members.slice(0, previewCount);
          const extraCount = Math.max(0, members.length - previewCount);

          return (
            <div
              key={divisi}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900">{divisi}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      <span className="font-semibold tabular-nums text-gray-700">
                        {members.length}
                      </span>{" "}
                      <span className="tabular-nums">/ {maxPerDivisi}</span> peserta
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isFull && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                        penuh
                      </span>
                    )}
                    {members.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [divisi]: !prev[divisi],
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Tutup
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Lihat
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${
                      isFull ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {members.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Users className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                  <p className="text-sm text-gray-500">Belum ada peserta</p>
                </div>
              ) : (
                <div className="px-4 py-3">
                  {!isExpanded ? (
                    <div className="space-y-2">
                      {previewMembers.map((p) => (
                        <div key={p.id} className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {p.nama}
                          </p>
                          <p className="truncate text-xs text-gray-500">{p.nim}</p>
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <p className="pt-1 text-xs font-semibold text-gray-500">
                          +{extraCount} peserta lainnya
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto pr-1">
                      <div className="space-y-2">
                        {members.map((p) => (
                          <div key={p.id} className="min-w-0 rounded-2xl bg-gray-50 px-3 py-2">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {p.nama}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {p.nim} · {p.email}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default DivisiView;
