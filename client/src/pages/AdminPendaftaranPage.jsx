import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCog,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ConfirmDialog from "../components/ConfirmDialog";
import ToastStack from "../components/Toast";
import { useAdminPendaftaran } from "../hooks/useAdminPendaftaran";
import {
  AdminManagementView,
  DashboardView,
  DivisiView,
  LoginForm,
  PendaftarView,
} from "../components/admin-pendaftaran";

const AdminPendaftaranPage = () => {
  const {
    token,
    admin,
    username,
    setUsername,
    password,
    setPassword,
    loginLoading,
    loginError,
    seeding,
    showSeedButton,
    handleLogin,
    handleLogout,
    handleSeedAdmin,
    activeTab,
    setActiveTab,
    pendaftar,
    priority,
    excess,
    filteredPendaftar,
    filteredPriority,
    filteredExcess,
    totalPendaftar,
    assignedCount,
    unassignedCount,
    loading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterDivisi,
    setFilterDivisi,
    priorityPage,
    setPriorityPage,
    excessPage,
    setExcessPage,
    priorityTotalPages,
    excessTotalPages,
    paginatedPriority,
    paginatedExcess,
    itemsPerPage,
    editingId,
    setEditingId,
    editDivisi,
    setEditDivisi,
    handleSaveDivisi,
    requestDeletePendaftar,
    confirmState,
    setConfirmState,
    confirmDeletePendaftar,
    setSelectedItem,
    fetchPendaftar,
    fetchAdminList,
    adminLoading,
    adminList,
    showCreateAdmin,
    setShowCreateAdmin,
    newAdmin,
    setNewAdmin,
    creatingAdmin,
    handleCreateAdmin,
    confirmDeleteAdmin,
    setConfirmDeleteAdmin,
    handleDeleteAdmin,
    DIVISI_OPTIONS,
    toasts,
    dismissToast,
  } = useAdminPendaftaran();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pendaftar", label: "Pendaftar", icon: Users },
    { id: "divisi", label: "Divisi", icon: Briefcase },
    { id: "admins", label: "Kelola Admin", icon: UserCog },
  ];

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditDivisi(item.assigned_divisi || item.divisi || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDivisi("");
  };

  const handleRefresh = () => {
    if (activeTab === "admins") return fetchAdminList();
    return fetchPendaftar();
  };

  if (!token) {
    return (
      <LoginForm
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        loading={loginLoading}
        error={loginError}
        onSubmit={handleLogin}
        onBack={() => (window.location.href = "/")}
        showSeedButton={showSeedButton}
        seeding={seeding}
        onSeedAdmin={handleSeedAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1380px] items-stretch gap-4">
          <Sidebar
            title="Pendaftaran PKL"
            subtitle="Kontrol distribusi"
            user={{ ...admin, role: "admin_pendaftaran" }}
            menuItems={menuItems}
            activeMenu={activeTab}
            onMenuClick={setActiveTab}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          <main className="min-w-0 flex-1 space-y-4">
            <div className="rounded-3xl border border-white/15 bg-white/10 px-3 py-2 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 xl:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((prev) => !prev)}
                    className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 xl:flex"
                    aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeftOpen className="h-5 w-5" />
                    ) : (
                      <PanelLeftClose className="h-5 w-5" />
                    )}
                  </button>
                  <div className="ml-1 text-sm font-semibold text-white">
                    {menuItems.find((m) => m.id === activeTab)?.label || "Dashboard"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              {activeTab === "dashboard" && (
                <DashboardView
                  admin={admin}
                  totalPendaftar={totalPendaftar}
                  priorityCount={priority.length}
                  excessCount={excess.length}
                  assignedCount={assignedCount}
                  unassignedCount={unassignedCount}
                  onRefresh={handleRefresh}
                  refreshing={loading || adminLoading}
                />
              )}

              {activeTab === "pendaftar" && (
                <PendaftarView
                  loading={loading}
                  priority={priority}
                  filteredPriority={filteredPriority}
                  paginatedPriority={paginatedPriority}
                  priorityPage={priorityPage}
                  setPriorityPage={setPriorityPage}
                  priorityTotalPages={priorityTotalPages}
                  excess={excess}
                  filteredExcess={filteredExcess}
                  paginatedExcess={paginatedExcess}
                  excessPage={excessPage}
                  setExcessPage={setExcessPage}
                  excessTotalPages={excessTotalPages}
                  itemsPerPage={itemsPerPage}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterDivisi={filterDivisi}
                  setFilterDivisi={setFilterDivisi}
                  divisiOptions={DIVISI_OPTIONS}
                  totalFiltered={filteredPendaftar.length}
                  editingId={editingId}
                  editDivisi={editDivisi}
                  setEditDivisi={setEditDivisi}
                  onEdit={handleEdit}
                  onSave={handleSaveDivisi}
                  onCancelEdit={handleCancelEdit}
                  onDelete={requestDeletePendaftar}
                  onView={setSelectedItem}
                />
              )}

              {activeTab === "divisi" && (
                <DivisiView pendaftar={pendaftar} divisiOptions={DIVISI_OPTIONS} />
              )}

              {activeTab === "admins" && (
                <AdminManagementView
                  admin={admin}
                  adminList={adminList}
                  adminLoading={adminLoading}
                  showCreateAdmin={showCreateAdmin}
                  setShowCreateAdmin={setShowCreateAdmin}
                  newAdmin={newAdmin}
                  setNewAdmin={setNewAdmin}
                  creatingAdmin={creatingAdmin}
                  onCreateAdmin={handleCreateAdmin}
                  onRequestDeleteAdmin={setConfirmDeleteAdmin}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmState}
        title="Hapus pendaftar?"
        message={`Hapus pendaftar \"${confirmState?.nama}\"? Data akan dihapus permanen.`}
        confirmText="Hapus"
        cancelText="Batal"
        tone="danger"
        onConfirm={confirmDeletePendaftar}
        onCancel={() => setConfirmState(null)}
      />

      <ConfirmDialog
        open={!!confirmDeleteAdmin}
        title="Hapus admin?"
        message={`Hapus admin \"${confirmDeleteAdmin?.nama || confirmDeleteAdmin?.username}\"? Admin ini tidak bisa login lagi.`}
        confirmText="Hapus"
        cancelText="Batal"
        tone="danger"
        onConfirm={() =>
          handleDeleteAdmin(confirmDeleteAdmin?.id, confirmDeleteAdmin?.username)
        }
        onCancel={() => setConfirmDeleteAdmin(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default AdminPendaftaranPage;
