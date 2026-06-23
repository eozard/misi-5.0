import { RefreshCw, Shield, UserCircle2 } from "lucide-react";
import StatsCard from "./StatsCard";

const DashboardView = ({
  admin,
  totalPendaftar,
  priorityCount,
  excessCount,
  assignedCount,
  unassignedCount,
  onRefresh,
  refreshing,
}) => {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-100">
              <Shield className="h-3.5 w-3.5 text-emerald-300" />
              dashboard
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Kelola antrean pendaftar secara bertahap
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-blue-50/80">
              Pantau antrean prioritas, cek berkas, lalu tetapkan divisi dari satu
              dashboard.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100/70">
                Admin aktif
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-base font-bold">
                  {admin?.nama?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {admin?.nama || "Admin"}
                  </p>
                  <p className="truncate text-xs text-blue-100/75">
                    @{admin?.username || "admin"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100/70">
                Aksi cepat
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh data
                </button>
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Kembali ke beranda
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total pendaftar" value={totalPendaftar} icon="users" color="blue" />
        <StatsCard title="Prioritas (30 awal)" value={priorityCount} icon="check" color="emerald" />
        <StatsCard title="Belum di-assign" value={unassignedCount} icon="clock" color="amber" />
        <StatsCard title="Tambahan" value={excessCount} icon="clock" color="amber" />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Sudah di-assign</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600">
            {assignedCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">Siap masuk distribusi divisi</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Belum di-assign</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-amber-600">
            {unassignedCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">Perlu dipilihkan divisi</p>
        </div>
      </section>
    </div>
  );
};

export default DashboardView;

