import React from "react";
import { LogOut, User, Building2, PanelLeftClose, X } from "lucide-react";

const Sidebar = ({
  title = "Dashboard",
  subtitle = "Panel Control",
  user,
  menuItems = [],
  activeMenu,
  onMenuClick,
  onLogout,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const sidebarContent = (
    <>
      <div className="border-b border-white/10 p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
              <div className="absolute inset-0 animate-pulse bg-white/20" />
              <Building2 className="relative z-10 h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white drop-shadow-md">
                {title}
              </h1>
              <p className="text-[11px] font-medium text-blue-200">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Tutup sidebar"
              onClick={onToggle}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 xl:flex"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Tutup sidebar"
              onClick={onCloseMobile}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 xl:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-sm font-bold text-white backdrop-blur-md">
            {user?.nama?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white drop-shadow-sm">
              {user?.nama || "User"}
            </p>
            <p className="truncate text-[11px] text-blue-200">
              {user?.role === "admin"
                ? "Administrator"
                : user?.role === "admin_pendaftaran"
                  ? "Admin Pendaftaran"
                  : user?.role === "mentor"
                    ? "Mentor"
                    : "Peserta PKL"}
            </p>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200/70">
          Menu utama
        </p>
        {menuItems.map((item) => {
          const isActive = activeMenu === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onMenuClick(item.id);
                onCloseMobile?.();
              }}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-[13px] font-medium transition-all duration-300 ${
                isActive
                  ? "border-white/20 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white shadow-lg"
                  : "border-transparent text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-blue-300"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-[13px] font-medium text-red-100 transition-all duration-300 hover:bg-red-500/40 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {!collapsed && (
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[248px] flex-shrink-0 flex-col overflow-hidden rounded-[26px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl xl:flex">
          {sidebarContent}
        </aside>
      )}

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Tutup sidebar"
            onClick={onCloseMobile}
            className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm xl:hidden"
          />
          <aside className="fixed inset-y-4 left-4 z-40 flex h-[calc(100vh-2rem)] w-[248px] flex-col overflow-hidden rounded-[26px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl xl:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
