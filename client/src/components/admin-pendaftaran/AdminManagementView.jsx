import { Loader2, Shield, Trash2, UserCog, X } from "lucide-react";

const AdminManagementView = ({
  admin,
  adminList,
  adminLoading,
  showCreateAdmin,
  setShowCreateAdmin,
  newAdmin,
  setNewAdmin,
  creatingAdmin,
  onCreateAdmin,
  onRequestDeleteAdmin,
}) => {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-100">
              <UserCog className="h-3.5 w-3.5 text-emerald-300" />
              admin
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Kelola akun admin pendaftaran
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-blue-50/80">
              Tambahkan admin baru untuk membantu mengelola pendaftaran. Hindari membagikan password melalui chat.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateAdmin(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            <UserCog className="h-4 w-4" />
            Buat admin baru
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900">Daftar admin</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Total: {adminList.length}
          </p>
        </div>

        {adminLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500">Memuat daftar admin...</p>
          </div>
        ) : adminList.length === 0 ? (
          <div className="py-10 text-center">
            <Shield className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Belum ada admin</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {adminList.map((a) => {
              const isMe = String(admin?.id) === String(a.id);
              return (
                <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-100 font-bold text-indigo-700">
                      {a.nama?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {a.nama}
                        </p>
                        {isMe && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-500">@{a.username}</p>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => onRequestDeleteAdmin(a)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showCreateAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowCreateAdmin(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Buat admin baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAdmin(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onCreateAdmin} className="space-y-3 px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Nama
                </label>
                <input
                  type="text"
                  value={newAdmin.nama}
                  onChange={(e) => setNewAdmin({ ...newAdmin, nama: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Nama admin"
                  required
                  disabled={creatingAdmin}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, username: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="username"
                  required
                  disabled={creatingAdmin}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  disabled={creatingAdmin}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdmin(false)}
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  disabled={creatingAdmin}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  disabled={creatingAdmin}
                >
                  {creatingAdmin ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Membuat...
                    </span>
                  ) : (
                    "Buat"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementView;

