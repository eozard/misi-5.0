/*
 * Admin dashboard: stats, users, devices, attendance, reports, izin actions.
 * Handles admin-only operations like create user, reset password, delete user.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Users,
  BarChart3,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Trash2,
  Calendar,
} from "lucide-react";
import axiosInstance from "../utils/axios";
import ToastStack from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Sidebar from "../components/Sidebar";
import { Menu, PanelLeftClose, PanelLeftOpen, LayoutDashboard, BookOpen, Smartphone, Users as UsersIcon, FileText, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "../hooks/useToast";

const AdminDashboard = () => {
  // State utama untuk tab dan data dashboard
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [devices, setDevices] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  // State form buat user baru
  const [newUser, setNewUser] = useState({
    nama: "",
    password: "",
    role: "mahasiswa",
    kelompok: "machine learning",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  // State reset password user
  const [resetUserId, setResetUserId] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  // State laporan absensi
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    kelompok: "all",
    nama: "all",
  });
  // State daftar izin
  const [izinList, setIzinList] = useState([]);
  const [izinLoading, setIzinLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  // State tanggal merah / libur
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ tanggal: "", keterangan: "" });
  const [addingHoliday, setAddingHoliday] = useState(false);
  // State logbook
  const [logbookList, setLogbookList] = useState([]);
  const [logbookLoading, setLogbookLoading] = useState(false);
  const [logbookFilter, setLogbookFilter] = useState({
    status: "all",
    fromDate: "",
    toDate: "",
    nama: "",
  });
  // Notifikasi toast untuk feedback users
  const { toasts, pushToast, dismissToast } = useToast();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: "stats", label: "Dashboard", icon: LayoutDashboard },
    { id: "logbook", label: "Logbook", icon: BookOpen },
    { id: "devices", label: "Devices", icon: Smartphone },
    { id: "students", label: "Kelola User", icon: UsersIcon },
    { id: "report", label: "Report", icon: FileText },
    { id: "holidays", label: "Holidays", icon: CalendarIcon },
  ];

  const kelompokOptions = [
    "machine learning",
    "software engineering",
    "jaringan",
    "desain komunikasi visual",
  ];
  const filteredReportStudents =
    reportFilters.kelompok === "all"
      ? students
      : students.filter(
          (student) => student.kelompok === reportFilters.kelompok,
        );
  const studentRoleByName = Object.fromEntries(
    (students || []).map((student) => [student.nama, student.role]),
  );
  // Ambil semua data dashboard admin sekaligus
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, attendanceRes, studentsRes, devicesRes, usersRes, holidaysRes] =
        await Promise.all([
          axiosInstance.get("/admin/stats"),
          axiosInstance.get("/admin/attendance-today"),
          axiosInstance.get("/admin/students"),
          axiosInstance.get("/admin/devices"),
          axiosInstance.get("/admin/users"),
          axiosInstance.get("/holidays"),
        ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (attendanceRes.data.success)
        setAttendanceToday(attendanceRes.data.data || []);
      if (studentsRes.data.success)
        setStudents(studentsRes.data.students || []);
      if (devicesRes.data.success) setDevices(devicesRes.data.devices || []);
      if (usersRes.data.success) setAllUsers(usersRes.data.users || []);
      if (holidaysRes.data.success) setHolidays(holidaysRes.data.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cek login admin saat pertama kali masuk
  useEffect(() => {
    // Check auth
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    console.log("🔐 Admin Dashboard - Token check:", {
      hasToken: !!token,
      tokenLength: token?.length,
      user: user?.nama,
      role: user?.role,
    });

    if (!token || !user || user.role !== "admin") {
      console.warn("⚠️ Redirecting to login - auth failed");
      navigate("/absen");
      return;
    }

    const timer = setTimeout(() => {
      console.log("📡 Starting to fetch admin data...");
      fetchAllData();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Auto-fetch saat tab report/izin dibuka
  useEffect(() => {
    if (activeTab === "report") {
      fetchReportData();
      fetchIzinData(); // Fetch izin data juga saat report dibuka
    } else if (activeTab === "logbook") {
      fetchLogbookData();
    }
  }, [activeTab]);

  const fetchLogbookData = async () => {
    setLogbookLoading(true);
    try {
      const params = new URLSearchParams();
      if (logbookFilter.status && logbookFilter.status !== "all") {
        params.append("status", logbookFilter.status);
      }
      if (logbookFilter.fromDate) params.append("from", logbookFilter.fromDate);
      if (logbookFilter.toDate) params.append("to", logbookFilter.toDate);
      if (logbookFilter.nama) params.append("nama", logbookFilter.nama);
      const res = await axiosInstance.get(
        `/admin/logbook?${params.toString()}`,
      );
      if (res.data.success) setLogbookList(res.data.data || []);
    } catch (err) {
      console.error("Fetch logbook error:", err);
      pushToast({
        type: "error",
        title: "Gagal",
        message: "Gagal memuat data logbook",
      });
    } finally {
      setLogbookLoading(false);
    }
  };

  const handleResetLogbook = (item) => {
    setConfirmState({
      title: "Reset logbook ke draft?",
      message: `Logbook ${item.nama} tanggal ${item.tanggal} akan dibuka kembali untuk diedit.`,
      confirmText: "Reset",
      tone: "primary",
      onConfirm: async () => {
        try {
          const res = await axiosInstance.post(
            `/admin/logbook/${item.id}/reset`,
          );
          if (res.data.success) {
            pushToast({
              type: "success",
              title: "Logbook di-reset",
              message: res.data.message,
            });
            fetchLogbookData();
          }
        } catch (err) {
          pushToast({
            type: "error",
            title: "Gagal",
            message:
              err.response?.data?.message || "Gagal reset logbook",
          });
        }
      },
    });
  };

  const handleDeleteLogbookAdmin = (item) => {
    setConfirmState({
      title: "Hapus logbook?",
      message: `Logbook ${item.nama} tanggal ${item.tanggal} akan dihapus permanen.`,
      confirmText: "Hapus",
      tone: "danger",
      onConfirm: async () => {
        try {
          const res = await axiosInstance.delete(
            `/admin/logbook/${item.id}`,
          );
          if (res.data.success) {
            pushToast({
              type: "success",
              title: "Logbook dihapus",
              message: res.data.message,
            });
            fetchLogbookData();
          }
        } catch (err) {
          pushToast({
            type: "error",
            title: "Gagal",
            message:
              err.response?.data?.message || "Gagal hapus logbook",
          });
        }
      },
    });
  };

  const fetchStudentAttendance = async (nama) => {
    if (!nama) return;
    try {
      const response = await axiosInstance.get(`/admin/attendance/${nama}`);
      if (response.data.success) {
        setStudentAttendance(response.data.data || []);
        setStudentSummary(response.data.summary);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleStudentChange = (nama) => {
    setSelectedStudent(nama);
    fetchStudentAttendance(nama);
  };

  const handleLogout = () => {
    // Clear semua data termasuk deviceId untuk unbind device
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("deviceId");
    console.log("🔓 Logout: Device unbound, localStorage cleared");
    navigate("/absen");
  };

  // Buat user baru dari form
  const handleCreateUser = async () => {
    if (!newUser.nama || !newUser.password) {
      pushToast({
        type: "warning",
        title: "Input belum lengkap",
        message: "Nama dan password harus diisi",
      });
      return;
    }

    setCreatingUser(true);
    try {
      const response = await axiosInstance.post("/admin/users", {
        nama: newUser.nama,
        password: newUser.password,
        role: newUser.role,
        kelompok: newUser.kelompok,
      });

      if (response.data.success) {
        pushToast({
          type: "success",
          title: "User dibuat",
          message: "User berhasil dibuat",
        });
        setNewUser({
          nama: "",
          password: "",
          role: "mahasiswa",
          kelompok: "kelompok_1",
        });
        fetchAllData();
      } else {
        pushToast({
          type: "error",
          title: "Gagal",
          message: response.data.message || "Gagal membuat user",
        });
      }
    } catch (error) {
      console.error("Create user error:", error);
      pushToast({
        type: "error",
        title: "Gagal",
        message: error.response?.data?.message || "Gagal membuat user",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Reset password user terpilih
  const handleResetPassword = async () => {
    if (!resetUserId || !resetPassword) {
      pushToast({
        type: "warning",
        title: "Input belum lengkap",
        message: "Pilih user dan isi password baru",
      });
      return;
    }

    setConfirmState({
      title: "Reset password user?",
      message: "Password lama akan diganti dengan yang baru.",
      confirmText: "Reset",
      tone: "danger",
      onConfirm: async () => {
        setResettingPassword(true);
        try {
          const response = await axiosInstance.post(
            `/admin/users/${resetUserId}/reset-password`,
            { password: resetPassword },
          );

          if (response.data.success) {
            pushToast({
              type: "success",
              title: "Reset berhasil",
              message: response.data.message,
            });
            setResetPassword("");
          } else {
            pushToast({
              type: "error",
              title: "Gagal",
              message: response.data.message || "Gagal reset password",
            });
          }
        } catch (error) {
          console.error("Reset password error:", error);
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Gagal reset password",
          });
        } finally {
          setResettingPassword(false);
        }
      },
    });
  };

  // Hapus device dari daftar binding
  const handleDeleteDevice = async (deviceId) => {
    setConfirmState({
      title: "Hapus device?",
      message: "Device ini akan dihapus dari daftar perangkat terikat.",
      confirmText: "Hapus",
      tone: "danger",
      onConfirm: async () => {
        try {
          const response = await axiosInstance.delete(
            `/admin/devices/${deviceId}`,
          );

          if (response.data.success) {
            pushToast({
              type: "success",
              title: "Device dihapus",
              message: "Device berhasil dihapus",
            });
            setDevices(devices.filter((d) => d.device_id !== deviceId));
          } else {
            pushToast({
              type: "error",
              title: "Gagal",
              message: response.data.message || "Gagal menghapus device",
            });
          }
        } catch (error) {
          console.error("Delete device error:", error);
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Gagal menghapus device",
          });
        }
      },
    });
  };

  const handleResetUserDevices = async (user) => {
    setConfirmState({
      title: "Reset device user?",
      message: `Semua device untuk ${user.nama} akan dihapus.`,
      confirmText: "Reset",
      tone: "danger",
      onConfirm: async () => {
        try {
          const response = await axiosInstance.post(
            `/admin/users/${user.id}/reset-devices`,
          );

          if (response.data.success) {
            pushToast({
              type: "success",
              title: "Reset berhasil",
              message: "Device user berhasil direset",
            });
            fetchAllData();
          } else {
            pushToast({
              type: "error",
              title: "Gagal",
              message: response.data.message || "Gagal reset device user",
            });
          }
        } catch (error) {
          console.error("Reset user devices error:", error);
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Gagal reset device user",
          });
        }
      },
    });
  };

  // Hapus user (non-admin) dari sistem
  const handleDeleteUser = async (user) => {
    if (!user?.id) {
      pushToast({
        type: "error",
        title: "Gagal",
        message: "User id tidak ditemukan. Silakan refresh data.",
      });
      return;
    }

    setConfirmState({
      title: "Hapus user?",
      message: `User ${user.nama} akan dihapus permanen.`,
      confirmText: "Hapus",
      tone: "danger",
      onConfirm: async () => {
        try {
          const response = await axiosInstance.delete(
            `/admin/users/${user.id}`,
          );

          if (response.data.success) {
            pushToast({
              type: "success",
              title: "User dihapus",
              message: response.data.message,
            });
            setAllUsers(allUsers.filter((u) => u.id !== user.id));
          } else {
            pushToast({
              type: "error",
              title: "Gagal",
              message: response.data.message || "Gagal menghapus user",
            });
          }
        } catch (error) {
          console.error("Delete user error:", error);
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Gagal menghapus user",
          });
        }
      },
    });
  };

  // Ambil laporan absensi berdasarkan filter
  async function fetchReportData() {
    setReportLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate: reportFilters.fromDate,
        toDate: reportFilters.toDate,
        kelompok: reportFilters.kelompok,
        nama: reportFilters.nama,
      });

      const response = await axiosInstance.get(`/admin/report?${params}`);

      if (response.data.success) {
        setReportData(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch report error:", error);
      pushToast({
        type: "error",
        title: "Gagal",
        message: "Gagal memuat data report",
      });
    } finally {
      setReportLoading(false);
    }
  }

  // Export laporan ke CSV
  const handleExportReport = () => {
    if (reportData.length === 0) {
      pushToast({
        type: "warning",
        title: "Tidak ada data",
        message: "Tidak ada data untuk diekspor",
      });
      return;
    }

    let csv =
      "\ufeffNama;Role;Jurusan;Tanggal;Sesi;Jam Masuk;Status;Keterangan\r\n";
    reportData.forEach((row) => {
      const tanggal = new Date(row.tanggal).toLocaleDateString("id-ID");
      const tanggalText = `'${tanggal}`;
      const keterangan = row.status === "izin" ? row.keterangan || "" : "";
      const role = studentRoleByName[row.nama] || "-";
      const approvalStatus = (row.status_approval || "pending").toLowerCase();
      const izinLabel =
        approvalStatus === "approved"
          ? "Izin Diterima"
          : approvalStatus === "rejected"
            ? "Izin Ditolak"
            : "Izin Pending";
      const sesiText = row.status === "izin" ? izinLabel : row.sesi;
      const statusText = row.status === "izin" ? izinLabel : row.status;
      csv += `"${row.nama}";"${role}";"${row.kelompok}";"${tanggalText}";"${sesiText}";"${row.jam_masuk}";"${statusText}";"${keterangan}"\r\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `report-absensi-${reportFilters.fromDate}-to-${reportFilters.toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    pushToast({
      type: "success",
      title: "Export siap",
      message: "File report berhasil dibuat",
    });
  };

  // Ambil daftar izin untuk approval
  async function fetchIzinData() {
    setIzinLoading(true);
    try {
      const response = await axiosInstance.get("/admin/izin");
      if (response.data.success) {
        setIzinList(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch izin error:", error);
    } finally {
      setIzinLoading(false);
    }
  }

  // Setujui / tolak izin
  const handleUpdateIzin = async (id, status) => {
    const confirmMsg =
      status === "approved" ? "Setujui izin ini?" : "Tolak izin ini?";

    setConfirmState({
      title: status === "approved" ? "Setujui izin?" : "Tolak izin?",
      message: confirmMsg,
      confirmText: status === "approved" ? "Setujui" : "Tolak",
      tone: status === "approved" ? "primary" : "danger",
      onConfirm: async () => {
        try {
          const response = await axiosInstance.put(`/admin/izin/${id}`, {
            status,
          });
          if (response.data.success) {
            pushToast({
              type: "success",
              title: "Berhasil",
              message: response.data.message,
            });
            fetchIzinData();
          }
        } catch (error) {
          const msg = error.response?.data?.message || "Gagal update izin";
          pushToast({
            type: "error",
            title: "Gagal",
            message: msg,
          });
        }
      },
    });
  };

  // Tambah tanggal merah
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.tanggal || !newHoliday.keterangan) return;
    setAddingHoliday(true);
    try {
      const response = await axiosInstance.post("/admin/holidays", newHoliday);
      if (response.data.success) {
        pushToast({ type: "success", title: "Berhasil", message: response.data.message });
        setHolidays([...holidays, response.data.data].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)));
        setNewHoliday({ tanggal: "", keterangan: "" });
      }
    } catch (error) {
      pushToast({
        type: "error",
        title: "Gagal",
        message: error.response?.data?.message || "Gagal menambah libur",
      });
    } finally {
      setAddingHoliday(false);
    }
  };

  // Hapus tanggal merah
  const handleDeleteHoliday = (holiday) => {
    setConfirmState({
      title: "Hapus Libur?",
      message: `Hapus tanggal merah ${holiday.tanggal} (${holiday.keterangan})?`,
      confirmText: "Hapus",
      tone: "danger",
      onConfirm: async () => {
        try {
          const response = await axiosInstance.delete(`/admin/holidays/${holiday.id}`);
          if (response.data.success) {
            pushToast({ type: "success", title: "Berhasil", message: response.data.message });
            setHolidays(holidays.filter(h => h.id !== holiday.id));
          }
        } catch (error) {
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Gagal hapus libur",
          });
        }
      },
    });
  };

  // Export rekap absensi hari ini ke CSV
  const handleExport = () => {
    let csv = "\ufeffNama;Kelompok;Pagi;Sore;Status\r\n";
    attendanceToday.forEach((row) => {
      const pagiTime = row.pagi?.jam_masuk || "-";
      const soreTime = row.sore?.jam_masuk || "-";
      const status = row.pagi?.status || row.sore?.status || "Belum absen";
      csv += `"${row.nama}";"${row.kelompok}";"${pagiTime}";"${soreTime}";"${status}"\r\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAttendance = attendanceToday.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelompok.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "hadir") {
      return (
        matchesSearch &&
        (item.pagi?.status === "hadir" || item.sore?.status === "hadir")
      );
    }
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden text-slate-100">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        tone={confirmState?.tone}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          if (action) await action();
        }}
      />
      
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
            title="Sistem Absensi"
            subtitle="Dashboard Admin"
            user={{ nama: "Admin", role: "admin" }}
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

            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
        {/* Stats Tab */}
        {activeTab === "stats" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Total Mahasiswa</p>
                  <p className="text-3xl font-bold">{stats.totalMahasiswa}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Total Anak SMK</p>
                  <p className="text-3xl font-bold">{stats.totalAnakSmk}</p>
                </div>
                <Users className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Hadir Hari Ini</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.hadirToday}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Izin Hari Ini</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.izinToday}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* Logbook Tab */}
        {activeTab === "logbook" && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">🔍 Filter Logbook</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={logbookFilter.status}
                    onChange={(e) =>
                      setLogbookFilter({
                        ...logbookFilter,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="all">Semua</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama</label>
                  <input
                    type="text"
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    placeholder="Cari nama..."
                    value={logbookFilter.nama}
                    onChange={(e) =>
                      setLogbookFilter({
                        ...logbookFilter,
                        nama: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={logbookFilter.fromDate}
                    onChange={(e) =>
                      setLogbookFilter({
                        ...logbookFilter,
                        fromDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={logbookFilter.toDate}
                    onChange={(e) =>
                      setLogbookFilter({
                        ...logbookFilter,
                        toDate: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  onClick={fetchLogbookData}
                  disabled={logbookLoading}
                  className="btn-primary flex items-center justify-center"
                >
                  {logbookLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    "Filter"
                  )}
                </button>
              </div>
            </div>

            {/* List Logbook */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  📓 Daftar Logbook ({logbookList.length})
                </h2>
              </div>

              {logbookLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                </div>
              ) : logbookList.length === 0 ? (
                <p className="text-center text-white/60 py-6">
                  Belum ada logbook
                </p>
              ) : (
                <div className="space-y-3">
                  {logbookList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg ${
                        item.status === "submitted"
                          ? "border-green-200 bg-green-50/30"
                          : "border-yellow-200 bg-yellow-50/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-white">
                            {item.nama}
                          </p>
                          <p className="text-xs text-white/60">
                            {item.kelompok && (
                              <span className="capitalize mr-2">
                                {item.kelompok}
                              </span>
                            )}
                            {new Date(item.tanggal).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                          <span
                            className={
                              item.status === "submitted"
                                ? "badge-green mt-1 inline-block"
                                : "badge-yellow mt-1 inline-block"
                            }
                          >
                            {item.status === "submitted"
                              ? "Submitted"
                              : "Draft"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {item.status === "submitted" && (
                            <button
                              onClick={() => handleResetLogbook(item)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded"
                              title="Buka kembali untuk diedit"
                            >
                              Reset ke Draft
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLogbookAdmin(item)}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap mb-1">
                        <strong>Kegiatan:</strong> {item.kegiatan}
                      </p>
                      {item.kendala && (
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          <strong>Kendala:</strong> {item.kendala}
                        </p>
                      )}
                      {item.submitted_at && (
                        <p className="text-xs text-white/50 mt-2">
                          Disubmit:{" "}
                          {new Date(item.submitted_at).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === "devices" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">📱 Daftar Device</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Device ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Kelompok
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {devices.length > 0 ? (
                      devices.map((device, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm font-mono text-white break-all">
                            {device.device_id}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {device.user_name}
                          </td>
                          <td className="px-6 py-4 text-sm capitalize">
                            {device.kelompok}
                          </td>
                          <td className="px-6 py-4 text-sm text-white/80">
                            {new Date(device.last_used).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() =>
                                handleDeleteDevice(device.device_id)
                              }
                              className="text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-4 text-center text-white/60"
                        >
                          Belum ada device
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Filter & Search */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Cari nama atau kelompok..."
                    className="input-field pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                >
                  <option value="all">Semua</option>
                  <option value="hadir">Hadir</option>
                </select>

                <button
                  onClick={handleExport}
                  className="btn-success flex items-center whitespace-nowrap"
                >
                  <Download className="w-4 h-4 mr-2" /> Export
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">Absensi Hari Ini</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Kelompok
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase">
                        Pagi
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase">
                        Sore
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAttendance.length > 0 ? (
                      filteredAttendance.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm font-medium">
                            {item.nama}
                          </td>
                          <td className="px-6 py-4 text-sm text-white/80 capitalize">
                            {item.kelompok}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            {item.pagi ? (
                              <span className="badge-green">
                                {item.pagi.jam_masuk}
                              </span>
                            ) : (
                              <span className="text-white/50">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            {item.sore ? (
                              <span className="badge-green">
                                {item.sore.jam_masuk}
                              </span>
                            ) : (
                              <span className="text-white/50">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {item.pagi?.status === "hadir" ||
                            item.sore?.status === "hadir" ? (
                              <span className="badge-green">Hadir</span>
                            ) : (
                              <span className="badge-red">Alpa</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-4 text-center text-white/60"
                        >
                          Tidak ada data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-4">
            {/* Create User Form */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">➕ Buat User Baru</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama</label>
                  <input
                    type="text"
                    placeholder="Nama user"
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={newUser.nama}
                    onChange={(e) =>
                      setNewUser({ ...newUser, nama: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="anak_smk">Anak SMK</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Kelompok
                  </label>
                  <select
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={newUser.kelompok}
                    onChange={(e) =>
                      setNewUser({ ...newUser, kelompok: e.target.value })
                    }
                  >
                    {kelompokOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                  className="btn-success flex items-center justify-center"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membuat
                    </>
                  ) : (
                    "Buat User"
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">🔒 Reset Password User</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">User</label>
                  <select
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={resetUserId}
                    onChange={(e) => setResetUserId(e.target.value)}
                  >
                    <option value="">Pilih user</option>
                    {allUsers.map((user) => (
                      <option key={user.id || user.nama} value={user.id || ""}>
                        {user.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    placeholder="Password baru"
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  className="btn-danger flex items-center justify-center"
                >
                  {resettingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">👥 Daftar Semua User</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Kelompok
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Device Terdaftar (Terpakai/Maks)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allUsers.length > 0 ? (
                      allUsers.map((user) => (
                        <tr
                          key={user.id || user.nama}
                          className="hover:bg-white/5"
                        >
                          <td className="px-6 py-4 text-sm font-medium">
                            {user.nama}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={
                                user.role === "admin"
                                  ? "badge-purple"
                                  : user.role === "mentor"
                                    ? "badge-yellow"
                                    : user.role === "mahasiswa"
                                      ? "badge-blue"
                                      : "badge-green"
                              }
                            >
                              {user.role === "admin"
                                ? "Admin"
                                : user.role === "mentor"
                                  ? "Mentor"
                                  : user.role === "mahasiswa"
                                    ? "Mahasiswa"
                                    : "Anak SMK"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm capitalize">
                            {user.kelompok || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {(user.role === "admin" || user.role === "mentor")
                              ? "-"
                              : `${user.devices_count ?? 0}/${user.max_devices ?? 0}`}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {user.role === "admin" ? (
                              <span className="text-white/50">-</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                                title="Hapus user"
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Hapus
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-4 text-center text-white/60"
                        >
                          Belum ada user
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Old Attendance History Section (if needed) */}
            {selectedStudent && (
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
                <h2 className="text-xl font-bold mb-4">
                  Riwayat Absensi {selectedStudent}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                          Tanggal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                          Sesi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                          Jam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentAttendance.length > 0 ? (
                        studentAttendance.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 text-sm">
                              {new Date(item.tanggal).toLocaleDateString(
                                "id-ID",
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm capitalize font-medium">
                              {item.sesi}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {item.jam_masuk}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={
                                  item.status === "hadir"
                                    ? "badge-green"
                                    : item.status === "izin_approved"
                                      ? "badge-yellow"
                                      : "badge-red"
                                }
                              >
                                {item.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-white/80">
                              {isIzin ? item.keterangan || "-" : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-4 text-center text-white/60"
                          >
                            Belum ada riwayat absensi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Izin Tab */}
        {/* Report Tab */}
        {activeTab === "report" && (
          <div className="space-y-4">
            {/* Filter Card */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">🔍 Filter Absensi</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dari Tanggal
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                    <input
                      type="date"
                      className="input-field pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                      value={reportFilters.fromDate}
                      onChange={(e) =>
                        setReportFilters({
                          ...reportFilters,
                          fromDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sampai Tanggal
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                    <input
                      type="date"
                      className="input-field pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                      value={reportFilters.toDate}
                      onChange={(e) =>
                        setReportFilters({
                          ...reportFilters,
                          toDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Kelompok
                  </label>
                  <select
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={reportFilters.kelompok}
                    onChange={(e) => {
                      const nextKelompok = e.target.value;
                      const nextStudents =
                        nextKelompok === "all"
                          ? students
                          : students.filter(
                              (student) => student.kelompok === nextKelompok,
                            );
                      const namaStillValid =
                        reportFilters.nama === "all" ||
                        nextStudents.some(
                          (student) => student.nama === reportFilters.nama,
                        );

                      setReportFilters({
                        ...reportFilters,
                        kelompok: nextKelompok,
                        nama: namaStillValid ? reportFilters.nama : "all",
                      });
                    }}
                  >
                    <option value="all">Semua Kelompok</option>
                    {kelompokOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Siswa
                  </label>
                  <select
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={reportFilters.nama}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        nama: e.target.value,
                      })
                    }
                  >
                    <option value="all">Semua Siswa</option>
                    {filteredReportStudents.map((student) => (
                      <option key={student.nama} value={student.nama}>
                        {student.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={fetchReportData}
                  disabled={reportLoading}
                  className="btn-primary flex items-center justify-center"
                >
                  {reportLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Filter
                    </>
                  ) : (
                    "Filter"
                  )}
                </button>
              </div>
            </div>

            {/* Report Data Card */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  📋 Data Absensi ({reportData.length})
                </h2>
                <button
                  onClick={handleExportReport}
                  disabled={reportData.length === 0}
                  className="btn-success flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" /> Export Excel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Jurusan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Sesi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Jam Masuk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Keterangan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.length > 0 ? (
                      reportData.map((item, idx) => {
                        const normalizedApproval = (item.status_approval || "")
                          .toLowerCase()
                          .trim();
                        const isIzin = item.status === "izin";
                        const approvalLabel =
                          normalizedApproval === "approved"
                            ? "Izin Disetujui"
                            : normalizedApproval === "rejected"
                              ? "Izin Ditolak"
                              : normalizedApproval === "cancelled"
                                ? "Izin Dibatalkan"
                                : "Izin Pending";

                        return (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-6 py-4 text-sm font-medium">
                              {item.nama}
                            </td>
                            <td className="px-6 py-4 text-sm capitalize">
                              {studentRoleByName[item.nama] || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm capitalize">
                              {item.kelompok}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {new Date(item.tanggal).toLocaleDateString(
                                "id-ID",
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm capitalize font-medium">
                              {item.sesi}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {item.jam_masuk}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={
                                  isIzin
                                    ? normalizedApproval === "approved"
                                      ? "badge-green"
                                      : normalizedApproval === "rejected"
                                        ? "badge-red"
                                        : normalizedApproval === "cancelled"
                                          ? "badge-blue"
                                          : "badge-yellow"
                                    : item.status === "hadir"
                                      ? "badge-green"
                                      : "badge-red"
                                }
                              >
                                {isIzin
                                  ? approvalLabel
                                  : item.status.charAt(0).toUpperCase() +
                                    item.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {item.keterangan || "-"}
                            </td>
                            <td className="px-6 py-4">
                              {item.status === "izin" ? (
                                normalizedApproval === "approved" ||
                                normalizedApproval === "rejected" ||
                                normalizedApproval === "cancelled" ? (
                                  <span className="text-sm text-white/60">
                                    {item.approved_by
                                      ? `oleh ${item.approved_by}`
                                      : "-"}
                                  </span>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateIzin(item.id, "approved")
                                      }
                                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                                      title="Setujui"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Setujui
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateIzin(item.id, "rejected")
                                      }
                                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                                      title="Tolak"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Tolak
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="text-sm text-white/50">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-4 text-center text-white/60"
                        >
                          Klik "Filter" untuk menampilkan data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Holidays Tab */}
        {activeTab === "holidays" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-red-600" />
                Tambah Tanggal Merah
              </h2>
              <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/90">Tanggal</label>
                  <input
                    type="date"
                    required
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={newHoliday.tanggal}
                    onChange={(e) => setNewHoliday({ ...newHoliday, tanggal: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/90">Keterangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hari Kemerdekaan"
                    className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                    value={newHoliday.keterangan}
                    onChange={(e) => setNewHoliday({ ...newHoliday, keterangan: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={addingHoliday}
                    className="btn-primary w-full h-[42px] flex items-center justify-center"
                  >
                    {addingHoliday ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tambah"}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">Daftar Tanggal Merah</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-y">
                      <th className="px-6 py-4 text-sm font-semibold text-white/80">Tanggal</th>
                      <th className="px-6 py-4 text-sm font-semibold text-white/80">Keterangan</th>
                      <th className="px-6 py-4 text-sm font-semibold text-white/80">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {holidays.length > 0 ? (
                      holidays.map((holiday) => (
                        <tr key={holiday.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm text-red-600 font-medium">
                            {new Date(holiday.tanggal).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">{holiday.keterangan}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteHoliday(holiday)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-white/60">
                          Belum ada tanggal merah yang ditambahkan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
