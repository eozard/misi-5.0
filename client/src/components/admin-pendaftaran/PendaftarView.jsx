import { Loader2, Search, SlidersHorizontal, Users } from "lucide-react";
import Pagination from "./Pagination";
import PendaftarCard from "./PendaftarCard";

const PendaftarView = ({
  loading,
  priority,
  filteredPriority,
  paginatedPriority,
  priorityPage,
  setPriorityPage,
  priorityTotalPages,
  excess,
  filteredExcess,
  paginatedExcess,
  excessPage,
  setExcessPage,
  excessTotalPages,
  itemsPerPage,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterDivisi,
  setFilterDivisi,
  divisiOptions,
  totalFiltered,
  editingId,
  editDivisi,
  setEditDivisi,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onView,
}) => {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Daftar pendaftar
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-50/80">
              Cari dan saring data, lalu kelola pendaftar per 5 data dalam satu halaman.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white">
            <SlidersHorizontal className="h-4 w-4 text-emerald-200" />
            {totalFiltered} data cocok
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIM, atau email"
              className="w-full rounded-2xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-emerald-200/70 focus:ring-4 focus:ring-emerald-200/10"
            />
          </label>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/95 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="all">Semua status</option>
            <option value="assigned">Sudah di-assign</option>
            <option value="unassigned">Belum di-assign</option>
          </select>

          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/95 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="all">Semua divisi</option>
            {divisiOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setFilterDivisi("all");
            }}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-gray-900">Daftar prioritas</h2>
            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
              {filteredPriority.length}
            </span>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
            30 awal
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500">Memuat data...</p>
          </div>
        ) : filteredPriority.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Tidak ada data yang cocok</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {paginatedPriority.map((item, idx) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <PendaftarCard
                    item={item}
                    index={item.orderNumber ?? (priorityPage - 1) * itemsPerPage + idx + 1}
                    editingId={editingId}
                    editDivisi={editDivisi}
                    setEditDivisi={setEditDivisi}
                    onEdit={onEdit}
                    onSave={onSave}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                    onView={onView}
                  />
                </div>
              ))}
            </div>
            <Pagination
              currentPage={priorityPage}
              totalPages={priorityTotalPages}
              onPageChange={setPriorityPage}
              totalItems={filteredPriority.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </section>

      {excess.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-gray-900">List tambahan</h2>
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                {filteredExcess.length}
              </span>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 shadow-sm">
              setelah 30
            </span>
          </div>

          {filteredExcess.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Tidak ada data yang cocok</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedExcess.map((item, idx) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <PendaftarCard
                      item={item}
                      index={item.orderNumber ?? 30 + (excessPage - 1) * itemsPerPage + idx + 1}
                      editingId={editingId}
                      editDivisi={editDivisi}
                      setEditDivisi={setEditDivisi}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancelEdit={onCancelEdit}
                      onDelete={onDelete}
                      onView={onView}
                    />
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={excessPage}
                totalPages={excessTotalPages}
                onPageChange={setExcessPage}
                totalItems={filteredExcess.length}
                itemsPerPage={itemsPerPage}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default PendaftarView;
