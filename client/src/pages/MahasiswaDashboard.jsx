/*
 * Mahasiswa dashboard: absensi, riwayat, izin, logbook, WiFi check, and notifications.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  X,
  BookOpen,
  Save,
  Send,
  Trash2,
  Edit3,
  Calendar,
  Award,
  Medal,
  Download,
  GraduationCap,
  FileCheck,
  ListTodo,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
} from "lucide-react";
import axiosInstance from "../utils/axios";
import ToastStack from "../components/Toast";
import Sidebar from "../components/Sidebar";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../hooks/useToast";

const MahasiswaDashboard = () => {
  const bypassMode = import.meta.env.VITE_BYPASS_TIME_CHECK === "true";
  const bypassPagiOnly = import.meta.env.VITE_BYPASS_PAGI_ONLY === "true";

  // State utama untuk user dan data absensi
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [absenLoading, setAbsenLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10 * 60);
  const [canAbsenPagi, setCanAbsenPagi] = useState(false);
  const [canAbsenSore, setCanAbsenSore] = useState(false);
  // State modal dan data izin
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [izinData, setIzinData] = useState({
    keterangan: "",
  });
  const [izinList, setIzinList] = useState([]);
  const [izinLoading, setIzinLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  // Tab navigation
  const [activeTab, setActiveTab] = useState("absensi");
  // State logbook
  const [logbookList, setLogbookList] = useState([]);
  const [logbookToday, setLogbookToday] = useState(null);
  const [logbookForm, setLogbookForm] = useState({
    kegiatan: "",
    kendala: "",
  });
  const [logbookLoading, setLogbookLoading] = useState(false);
  const [editingLogbookId, setEditingLogbookId] = useState(null);
  // State tanggal merah
  const [holidays, setHolidays] = useState([]);
  // State Penilaian
  const [grades, setGrades] = useState([]);
  // State Sertifikat
  const [certificates, setCertificates] = useState([]);
  
  // State Tugas Akhir
  const [tugasAkhirList, setTugasAkhirList] = useState([]);
  const [taForm, setTaForm] = useState({ judul: "", deskripsi: "", file: null });
  const [taLoading, setTaLoading] = useState(false);

  // State Tugas Mingguan
  const [tugasMingguanList, setTugasMingguanList] = useState([]);
  const [selectedTM, setSelectedTM] = useState(null);
  const [tmSubmitForm, setTmSubmitForm] = useState({ catatan_mahasiswa: "", link_url: "", file: null });
  const [tmLoading, setTmLoading] = useState(false);

  // Notifikasi toast untuk feedback user
  const { toasts, pushToast, dismissToast } = useToast();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: "absensi", label: "Absensi", icon: CheckCircle },
    { id: "tugasMingguan", label: "Tugas Mingguan", icon: ListTodo },
    { id: "logbook", label: "Logbook", icon: BookOpen },
    { id: "izin", label: "Izin", icon: FileText },
    { id: "holidays", label: "Libur", icon: Calendar },
    { id: "tugasAkhir", label: "Tugas Akhir", icon: GraduationCap },
    { id: "grades", label: "Penilaian", icon: Award },
    { id: "certificates", label: "Sertifikat", icon: Medal },
  ];

  // Helper: format tanggal hari ini YYYY-MM-DD
  const todayString = () => {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().slice(0, 10);
  };

  // Cek login dan ambil data awal
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/absen");
      return;
    }

    setUser(storedUser);

    console.log("🔐 Dashboard Load:", {
      user: storedUser?.nama,
    });

    setTimeout(() => {
      fetchRiwayat();
      fetchIzin();
      fetchLogbookToday();
      fetchLogbookList();
      fetchHolidays();
      fetchGrades();
      fetchCertificates();
      fetchTugasAkhir();
      fetchTugasMingguan();
    }, 150);
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await axiosInstance.get("/holidays");
      if (res.data.success) {
        setHolidays(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTugasMingguan = async () => {
    try {
      const res = await axiosInstance.get("/tugas-mingguan");
      if (res.data.success) {
        setTugasMingguanList(res.data.data || []);
      }
    } catch (err) {
      console.error("Fetch tugas mingguan error:", err);
    }
  };

  const handleSubmitTugasMingguan = async (e, tugasId) => {
    e.preventDefault();
    if (!tmSubmitForm.file && !tmSubmitForm.link_url.trim() && !tmSubmitForm.catatan_mahasiswa.trim()) {
      pushToast({
        type: "warning",
        title: "Lengkapi Pengumpulan",
        message: "Unggah file, masukkan link pengerjaan, atau tulis catatan pengerjaan",
      });
      return;
    }

    setTmLoading(true);
    try {
      const formData = new FormData();
      if (tmSubmitForm.catatan_mahasiswa) formData.append("catatan_mahasiswa", tmSubmitForm.catatan_mahasiswa);
      if (tmSubmitForm.link_url) formData.append("link_url", tmSubmitForm.link_url);
      if (tmSubmitForm.file) formData.append("file", tmSubmitForm.file);

      const res = await axiosInstance.post(`/tugas-mingguan/${tugasId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        pushToast({
          type: "success",
          title: "Berhasil Dikumpulkan",
          message: "Tugas mingguan berhasil dikirim ke mentor",
        });
        setSelectedTM(null);
        setTmSubmitForm({ catatan_mahasiswa: "", link_url: "", file: null });
        fetchTugasMingguan();
      }
    } catch (error) {
      console.error("Submit tugas mingguan error:", error);
      pushToast({
        type: "error",
        title: "Gagal Mengumpulkan",
        message: error.response?.data?.message || "Gagal mengumpulkan tugas",
      });
    } finally {
      setTmLoading(false);
    }
  };


  // Update status waktu absen setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // PENTING: Hitung waktu dengan timezone Jakarta (UTC+7) berbasis UTC
      // agar tidak double-offset saat device user sudah berada di timezone WIB.
      const hours = (now.getUTCHours() + 7) % 24;
      const minutes = now.getUTCMinutes();
      const seconds = now.getUTCSeconds();

      // Check session times
      const timeInMinutes = hours * 60 + minutes;
      const pagiStart = 8 * 60;
      const pagiEnd = 10 * 60;
      const soreStart = 15 * 60;
      const soreEnd = 17 * 60;

      // DEVELOPMENT: Untuk test/trial and error, gunakan env Vite untuk unlock tombol
      // Backend tetap akan validate dengan BYPASS_TIME_CHECK=true
      if (bypassPagiOnly) {
        // Mode bypass pagi-only: hanya allow absen pagi
        setCanAbsenPagi(true);
        setCanAbsenSore(false);
        console.log("🔄 Frontend bypass mode ON - pagi only");
      } else if (bypassMode) {
        // Mode bypass: selalu allow absen
        setCanAbsenPagi(true);
        setCanAbsenSore(true);
        console.log("🔄 Frontend bypass mode ON - selalu allow absen");
      } else {
        // Mode normal: validasi jam ketat
        setCanAbsenPagi(timeInMinutes >= pagiStart && timeInMinutes <= pagiEnd);
        setCanAbsenSore(timeInMinutes >= soreStart && timeInMinutes <= soreEnd);
      }

      // Calculate time remaining (10 min window)
      const nextHour = hours + 1;
      const nextTime = new Date();
      nextTime.setHours(nextHour, 0, 0);
      const remaining = Math.max(0, Math.floor((nextTime - now) / 1000));
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Ambil riwayat absensi user
  const fetchRiwayat = async () => {
    try {
      const response = await axiosInstance.get("/riwayat");
      if (response.data.success) {
        setHistory(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ambil daftar izin user
  const fetchIzin = async () => {
    try {
      const response = await axiosInstance.get("/izin");
      if (response.data.success) {
        setIzinList(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch izin error:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await axiosInstance.get("/grades");
      if (response.data.success) {
        setGrades(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch grades error:", error);
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await axiosInstance.get("/certificates");
      if (response.data.success) {
        setCertificates(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch certificates error:", error);
    }
  };

  // ====== TUGAS AKHIR FUNCTIONS ======
  const fetchTugasAkhir = async () => {
    try {
      const response = await axiosInstance.get("/tugas-akhir");
      if (response.data.success) {
        setTugasAkhirList(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch tugas akhir error:", error);
    }
  };

  const handleSubmitTA = async (e) => {
    e.preventDefault();
    if (!taForm.judul.trim() || !taForm.file) {
      pushToast({ type: "warning", title: "Form tidak lengkap", message: "Judul dan file proposal wajib diisi" });
      return;
    }

    setTaLoading(true);
    try {
      const formData = new FormData();
      formData.append("judul", taForm.judul);
      formData.append("deskripsi", taForm.deskripsi);
      formData.append("file", taForm.file);

      const res = await axiosInstance.post("/tugas-akhir", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        pushToast({ type: "success", title: "Berhasil", message: "Pengajuan Tugas Akhir berhasil dikirim" });
        setTaForm({ judul: "", deskripsi: "", file: null });
        fetchTugasAkhir();
      }
    } catch (error) {
      console.error("Submit TA error:", error);
      pushToast({ type: "error", title: "Gagal", message: error.response?.data?.message || "Gagal mengirim pengajuan" });
    } finally {
      setTaLoading(false);
    }
  };

  // ====== LOGBOOK FUNCTIONS ======
  const fetchLogbookToday = async () => {
    try {
      const res = await axiosInstance.get("/logbook/today");
      if (res.data.success && res.data.data) {
        setLogbookToday(res.data.data);
        setLogbookForm({
          kegiatan: res.data.data.kegiatan,
          kendala: res.data.data.kendala || "",
        });
      } else {
        setLogbookToday(null);
      }
    } catch (error) {
      console.error("Fetch today logbook error:", error);
    }
  };

  const fetchLogbookList = async () => {
    try {
      const res = await axiosInstance.get("/logbook");
      if (res.data.success) {
        setLogbookList(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch logbook list error:", error);
    }
  };

  const handleSaveLogbook = async (e) => {
    e?.preventDefault?.();
    if (!logbookForm.kegiatan.trim()) {
      pushToast({
        type: "warning",
        title: "Kegiatan kosong",
        message: "Isi kegiatan terlebih dahulu",
      });
      return;
    }
    setLogbookLoading(true);
    try {
      if (editingLogbookId) {
        // Update
        const res = await axiosInstance.put(
          `/logbook/${editingLogbookId}`,
          {
            kegiatan: logbookForm.kegiatan,
            kendala: logbookForm.kendala,
          },
        );
        if (res.data.success) {
          pushToast({
            type: "success",
            title: "Logbook diupdate",
            message: res.data.message,
          });
          setEditingLogbookId(null);
        }
      } else {
        // Create
        const res = await axiosInstance.post("/logbook", {
          kegiatan: logbookForm.kegiatan,
          kendala: logbookForm.kendala,
        });
        if (res.data.success) {
          pushToast({
            type: "success",
            title: "Draft tersimpan",
            message: res.data.message,
          });
        }
      }
      // Reset form kegiatan & kendala, keep tanggal
      setLogbookForm((prev) => ({
        ...prev,
        kegiatan: "",
        kendala: "",
      }));
      fetchLogbookToday();
      fetchLogbookList();
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal menyimpan logbook";
      pushToast({ type: "error", title: "Gagal", message: msg });
    } finally {
      setLogbookLoading(false);
    }
  };

  const handleSubmitLogbook = async (id) => {
    setConfirmState({
      title: "Submit logbook?",
      message:
        "Setelah di-submit, logbook tidak bisa diedit lagi (kecuali admin me-reset).",
      confirmText: "Submit",
      tone: "primary",
      onConfirm: async () => {
        try {
          const res = await axiosInstance.post(`/logbook/${id}/submit`);
          if (res.data.success) {
            pushToast({
              type: "success",
              title: "Logbook submitted",
              message: res.data.message,
            });
            fetchLogbookToday();
            fetchLogbookList();
          }
        } catch (error) {
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Gagal submit logbook",
          });
        }
      },
    });
  };

  const handleEditLogbook = (item) => {
    if (item.status !== "draft") return;
    setEditingLogbookId(item.id);
    setLogbookForm({
      kegiatan: item.kegiatan,
      kendala: item.kendala || "",
    });
    // Scroll ke atas supaya form kelihatan
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEditLogbook = () => {
    setEditingLogbookId(null);
    setLogbookForm((prev) => ({
      ...prev,
      kegiatan: "",
      kendala: "",
    }));
    fetchLogbookToday();
  };

  const handleDeleteLogbook = (item) => {
    setConfirmState({
      title: "Hapus logbook?",
      message: `Logbook tanggal ${item.tanggal} akan dihapus permanen.`,
      confirmText: "Hapus",
      tone: "danger",
      onConfirm: async () => {
        try {
          const res = await axiosInstance.delete(`/logbook/${item.id}`);
          if (res.data.success) {
            pushToast({
              type: "success",
              title: "Logbook dihapus",
              message: res.data.message,
            });
            fetchLogbookToday();
            fetchLogbookList();
          }
        } catch (error) {
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Gagal menghapus logbook",
          });
        }
      },
    });
  };

  // Batalkan izin yang masih pending
  const handleCancelIzin = async (id) => {
    setConfirmState({
      title: "Batalkan izin?",
      message: "Izin ini akan dibatalkan dan tidak bisa dikembalikan.",
      confirmText: "Batalkan",
      tone: "danger",
      onConfirm: async () => {
        try {
          const response = await axiosInstance.delete(`/izin/${id}`);
          if (response.data.success) {
            pushToast({
              type: "success",
              title: "Izin dibatalkan",
              message: response.data.message,
            });
            fetchIzin();
          }
        } catch (error) {
          const msg = error.response?.data?.message || "Gagal membatalkan izin";
          pushToast({
            type: "error",
            title: "Gagal",
            message: msg,
          });
        }
      },
    });
  };

  // Proses absen: cek WiFi, kirim login_time
  const handleAbsen = async (sesi) => {
    setAbsenLoading(true);

    try {
      const deviceId = localStorage.getItem("deviceId") || "device_unknown";
      const now = new Date();

      // Check WiFi sebelum absen
      const wifiCheck = await axiosInstance.get("/check-ip");
      if (!wifiCheck.data?.isWiFiKampus) {
        const msg =
          wifiCheck.data?.message ||
          "Absensi hanya dapat dilakukan dari WiFi Sekolah";
        pushToast({
          type: "warning",
          title: "WiFi tidak sesuai",
          message: msg,
        });
        return;
      }

      const response = await axiosInstance.post("/absen", {
        login_time: now.toISOString(),
        deviceId,
      });

      if (response.data.success) {
        pushToast({
          type: "success",
          title: "Absensi berhasil",
          message: response.data.message,
        });
        fetchRiwayat();

        // Setelah absen sore, ingatkan untuk isi logbook
        if (sesi === "sore") {
          // Tunggu sebentar supaya toast sukses tampil dulu
          setTimeout(() => {
            setConfirmState({
              title: "Jangan lupa isi Logbook hari ini!",
              message:
                "Absen sore sudah selesai. Apakah Anda ingin mengisi logbook kegiatan hari ini sekarang?",
              confirmText: "Ya, Isi Logbook",
              cancelText: "Tidak",
              tone: "primary",
              onConfirm: () => {
                setActiveTab("logbook");
              },
            });
          }, 800);
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Absen gagal";
      pushToast({
        type: "error",
        title: "Absen gagal",
        message: msg,
      });
      console.error("Absen error:", msg);
    } finally {
      setAbsenLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear semua data termasuk deviceId untuk unbind device
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("deviceId");
    console.log("🔓 Logout: Device unbound, localStorage cleared");
    navigate("/absen");
  };

  // Kirim izin baru
  const handleSubmitIzin = async (e) => {
    e.preventDefault();
    setIzinLoading(true);

    try {
      const response = await axiosInstance.post("/izin", izinData);

      if (response.data.success) {
        pushToast({
          type: "success",
          title: "Izin terkirim",
          message: response.data.message,
        });
        setShowIzinModal(false);
        setIzinData({ keterangan: "" });
        fetchIzin();
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal mengajukan izin";
      pushToast({
        type: "error",
        title: "Izin gagal",
        message: msg,
      });
      console.error("Izin error:", msg);
    } finally {
      setIzinLoading(false);
    }
  };

  // Helper untuk menampilkan sesi saat ini
  const getCurrentSession = () => {
    const now = new Date();
    // PENTING: Hitung waktu dengan timezone Jakarta (UTC+7) berbasis UTC
    // agar konsisten lintas timezone client.
    const hours = (now.getUTCHours() + 7) % 24;
    const minutes = now.getUTCMinutes();
    const timeInMinutes = hours * 60 + minutes;

    if (timeInMinutes >= 8 * 60 && timeInMinutes <= 10 * 60) {
      return "Pagi";
    } else if (timeInMinutes >= 15 * 60 && timeInMinutes <= 17 * 60) {
      return "Sore";
    }
    return "Diluar Jam Absen";
  };

  const hadiruTodayPagi = history.some((h) => {
    const hDate = new Date(h.tanggal);
    const today = new Date();
    return (
      hDate.toDateString() === today.toDateString() &&
      h.sesi === "pagi" &&
      h.status === "hadir"
    );
  });

  const hadirTodaySore = history.some((h) => {
    const hDate = new Date(h.tanggal);
    const today = new Date();
    return (
      hDate.toDateString() === today.toDateString() &&
      h.sesi === "sore" &&
      h.status === "hadir"
    );
  });

  // Cek apakah hari ini adalah hari libur
  // todayString() sudah ada sebagai helper: format YYYY-MM-DD WIB
  const todayStr = todayString();
  const todayHolidayInfo = holidays.find((h) => {
    // Normalisasi format tanggal dari DB (bisa berupa string "YYYY-MM-DD" atau Date object)
    const tgl = typeof h.tanggal === "string"
      ? h.tanggal.slice(0, 10)
      : new Date(h.tanggal).toISOString().slice(0, 10);
    return tgl === todayStr;
  });
  const isHolidayToday = !!todayHolidayInfo;

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
            subtitle="Dashboard Mahasiswa"
            user={user || { nama: "Mahasiswa", role: "mahasiswa" }}
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-2xl border border-white/15">
                    <Clock className="w-4 h-4 text-blue-300" />
                    <span className="text-sm font-mono text-white/90">{new Date().toLocaleTimeString("id-ID")}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-2xl border border-white/15">
                    <Users className="w-4 h-4 text-green-300" />
                    <span className="text-sm capitalize text-white/90">{user?.kelompok}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">

        {/* TAB: ABSENSI */}
        {activeTab === "absensi" && (
          <>
            {/* Absensi Card */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md mb-6">
              <h2 className="text-xl font-bold mb-4">Absensi Hari Ini</h2>

              {/* DEBUG INFO */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 text-xs font-mono">
                <p className="font-bold mb-2 text-yellow-900">🔍 DEBUG INFO:</p>
                <div className="grid grid-cols-2 gap-2 text-yellow-800">
                  <div>Jam: {new Date().toLocaleTimeString("id-ID")}</div>
                  <div>
                    Bisa Absen Pagi:{" "}
                    <span
                      className={canAbsenPagi ? "text-green-600" : "text-red-600"}
                    >
                      {canAbsenPagi ? "✅" : "❌"}
                    </span>
                  </div>
                  <div>
                    Bisa Absen Sore:{" "}
                    <span
                      className={canAbsenSore ? "text-green-600" : "text-red-600"}
                    >
                      {canAbsenSore ? "✅" : "❌"}
                    </span>
                  </div>
                  <div>
                    Sudah Absen Pagi:{" "}
                    <span
                      className={
                        hadiruTodayPagi ? "text-green-600" : "text-white/80"
                      }
                    >
                      {hadiruTodayPagi ? "✅" : "❌"}
                    </span>
                  </div>
                  <div>
                    Sudah Absen Sore:{" "}
                    <span
                      className={
                        hadirTodaySore ? "text-green-600" : "text-white/80"
                      }
                    >
                      {hadirTodaySore ? "✅" : "❌"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner Hari Libur */}
              {isHolidayToday && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-400/40 bg-orange-500/20 px-4 py-3 text-orange-200 backdrop-blur-sm">
                  <span className="mt-0.5 text-xl">🎉</span>
                  <div>
                    <p className="font-semibold text-orange-100">Hari Ini Libur</p>
                    <p className="text-sm text-orange-200/90">
                      {todayHolidayInfo?.keterangan || "Hari Libur"} — Absensi tidak tersedia hari ini.
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAbsen("pagi")}
                  disabled={isHolidayToday || !canAbsenPagi || hadiruTodayPagi || absenLoading}
                  title={
                    isHolidayToday
                      ? `Hari ini libur: ${todayHolidayInfo?.keterangan || "Hari Libur"}`
                      : !canAbsenPagi
                        ? "Diluar jam absen pagi"
                        : hadiruTodayPagi
                          ? "Sudah absen pagi"
                          : ""
                  }
                  className={`btn-primary flex items-center justify-center py-3 ${isHolidayToday || hadiruTodayPagi ? "opacity-50" : ""
                    }`}
                >
                  {absenLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {hadiruTodayPagi ? (
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      {hadiruTodayPagi ? "Sudah Absen Pagi" : "Absen Pagi"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleAbsen("sore")}
                  disabled={
                    isHolidayToday ||
                    !canAbsenSore ||
                    !hadiruTodayPagi ||
                    hadirTodaySore ||
                    absenLoading
                  }
                  title={
                    isHolidayToday
                      ? `Hari ini libur: ${todayHolidayInfo?.keterangan || "Hari Libur"}`
                      : !canAbsenSore
                        ? "Diluar jam absen sore"
                        : !hadiruTodayPagi
                          ? "Harus absen pagi dulu"
                          : hadirTodaySore
                            ? "Sudah absen sore"
                            : ""
                  }
                  className={`btn-primary flex items-center justify-center py-3 ${isHolidayToday || hadirTodaySore ? "opacity-50" : ""
                    }`}
                >
                  {absenLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {hadirTodaySore ? (
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      {hadirTodaySore ? "Sudah Absen Sore" : "Absen Sore"}
                    </>
                  )}
                </button>
              </div>

              {/* Tombol Izin */}
              <button
                onClick={() => setShowIzinModal(true)}
                className="btn-secondary w-full flex items-center justify-center py-3 mt-4"
              >
                <FileText className="w-5 h-5 mr-2" />
                Ajukan Izin
              </button>

              <p className="text-xs text-white/60 mt-4 text-center">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                08.00-10.00 | 15.00-17.00
              </p>
            </div>

            {/* Riwayat Absensi */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">Riwayat Absensi</h2>
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
                    {history.length > 0 ? (
                      history.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm">
                            {new Date(item.tanggal).toLocaleDateString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-sm capitalize font-medium">
                            {item.sesi}
                          </td>
                          <td className="px-6 py-4 text-sm">{item.jam_masuk}</td>
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
          </>
        )}

        {/* TAB: LOGBOOK */}
        {activeTab === "logbook" && (
          <div className="space-y-6">
            {/* Form logbook hari ini */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {editingLogbookId ? "Edit Logbook" : "Logbook Hari Ini"}
                </h2>
                {logbookToday && !editingLogbookId && (
                  <span
                    className={
                      logbookToday.status === "submitted"
                        ? "badge-green"
                        : "badge-yellow"
                    }
                  >
                    {logbookToday.status === "submitted"
                      ? "Submitted"
                      : "Draft"}
                  </span>
                )}
              </div>

              {logbookToday && logbookToday.status === "submitted" && !editingLogbookId ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ✅ Logbook hari ini sudah di-submit
                  </p>
                  <div className="space-y-2 text-sm text-white/90">
                    <div>
                      <span className="text-white/60">Tanggal:</span>{" "}
                      <strong>{logbookToday.tanggal}</strong>
                    </div>
                    <div>
                      <span className="text-white/60">Kegiatan:</span>
                      <p className="whitespace-pre-wrap mt-1">
                        {logbookToday.kegiatan}
                      </p>
                    </div>
                    {logbookToday.kendala && (
                      <div>
                        <span className="text-white/60">Kendala:</span>
                        <p className="whitespace-pre-wrap mt-1">
                          {logbookToday.kendala}
                        </p>
                      </div>
                    )}
                    {logbookToday.submitted_at && (
                      <p className="text-xs text-white/50 mt-2">
                        Disubmit:{" "}
                        {new Date(logbookToday.submitted_at).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveLogbook} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div className="text-sm">
                      <span className="text-white/80">Tanggal logbook:</span>{" "}
                      <strong className="text-blue-900">
                        {new Date(
                          logbookToday?.tanggal || todayString(),
                        ).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </strong>
                      <span className="text-xs text-white/60 ml-2">
                        (lock ke hari ini, tidak bisa dipilih)
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Kegiatan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                      rows="5"
                      placeholder="Tuliskan kegiatan yang Anda lakukan hari ini..."
                      value={logbookForm.kegiatan}
                      onChange={(e) =>
                        setLogbookForm({
                          ...logbookForm,
                          kegiatan: e.target.value,
                        })
                      }
                      disabled={logbookLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Kendala <span className="text-white/50">(opsional)</span>
                    </label>
                    <textarea
                      className="input-field bg-white/10 border-white/20 text-white placeholder-white/50 [&>option]:text-gray-900"
                      rows="3"
                      placeholder="Kendala atau hambatan yang dialami (jika ada)..."
                      value={logbookForm.kendala}
                      onChange={(e) =>
                        setLogbookForm({
                          ...logbookForm,
                          kendala: e.target.value,
                        })
                      }
                      disabled={logbookLoading}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn-primary flex items-center"
                      disabled={logbookLoading}
                    >
                      {logbookLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {editingLogbookId ? "Update Draft" : "Simpan Draft"}
                    </button>
                    {editingLogbookId && (
                      <button
                        type="button"
                        onClick={handleCancelEditLogbook}
                        className="btn-secondary"
                        disabled={logbookLoading}
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Daftar Logbook */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">Riwayat Logbook</h2>
              {logbookList.length === 0 ? (
                <p className="text-center text-white/60 py-6">
                  Belum ada logbook. Buat logbook pertama Anda di atas.
                </p>
              ) : (
                <div className="space-y-3">
                  {logbookList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 border-l-4 rounded-lg ${item.status === "submitted"
                          ? "border-green-500 bg-green-50/30"
                          : "border-yellow-500 bg-yellow-50/30"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs text-white/60">
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
                        <div className="flex gap-1">
                          {item.status === "draft" && (
                            <>
                              <button
                                onClick={() => handleEditLogbook(item)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLogbook(item)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {item.status === "draft" && (
                            <button
                              onClick={() => handleSubmitLogbook(item.id)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Submit"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap mb-2">
                        <strong>Kegiatan:</strong> {item.kegiatan}
                      </p>
                      {item.kendala && (
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          <strong>Kendala:</strong> {item.kendala}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: IZIN */}
        {activeTab === "izin" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">Ajukan Izin</h2>
              <button
                onClick={() => setShowIzinModal(true)}
                className="btn-primary w-full flex items-center justify-center py-3"
              >
                <FileText className="w-5 h-5 mr-2" />
                Buat Izin Baru
              </button>
            </div>

            {/* Riwayat Izin */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">Riwayat Izin</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Keterangan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {izinList.length > 0 ? (
                      izinList.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 text-sm">
                            {new Date(item.tanggal).toLocaleDateString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-sm">{item.keterangan}</td>
                          <td className="px-6 py-4">
                            {(() => {
                              const status = (item.status_approval || "")
                                .toLowerCase()
                                .trim();
                              const badgeClass =
                                status === "approved"
                                  ? "badge-green"
                                  : status === "rejected"
                                    ? "badge-red"
                                    : status === "cancelled"
                                      ? "badge-blue"
                                      : "badge-yellow";
                              const label =
                                status === "approved"
                                  ? "Disetujui"
                                  : status === "rejected"
                                    ? "Ditolak"
                                    : status === "cancelled"
                                      ? "Dibatalkan"
                                      : "Pending";
                              return <span className={badgeClass}>{label}</span>;
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {(item.status_approval === "pending" ||
                              !item.status_approval) && (
                                <button
                                  onClick={() => handleCancelIzin(item.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Batalkan
                                </button>
                              )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-4 text-center text-white/60"
                        >
                          Belum ada riwayat izin
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* TAB: HOLIDAYS */}
        {activeTab === "holidays" && (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-red-600" />
              Jadwal Libur Nasional / Tanggal Merah
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-y">
                    <th className="px-6 py-4 text-sm font-semibold text-white/80">Tanggal</th>
                    <th className="px-6 py-4 text-sm font-semibold text-white/80">Keterangan</th>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-6 py-8 text-center text-white/60">
                        Belum ada tanggal merah yang dijadwalkan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-white/60 mt-4">
              * Pada tanggal merah yang tertera di atas, Anda tidak diwajibkan untuk melakukan absensi.
            </p>
          </div>
        )}

        {/* TAB: TUGAS MINGGUAN */}
        {activeTab === "tugasMingguan" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Quick Summary */}
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-lg">
                      <ListTodo className="w-6 h-6" />
                    </div>
                    Tugas Mingguan PKL
                  </h2>
                  <p className="text-sm text-blue-100/80 mt-1">
                    Kerjakan dan kumpulkan tugas mingguan yang diberikan oleh Mentor kelompok Anda tepat waktu.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="bg-black/30 border border-white/10 px-4 py-2 rounded-2xl">
                    <span className="text-xs text-white/60 block">Total Tugas</span>
                    <span className="text-lg font-bold text-white">{tugasMingguanList.length}</span>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 rounded-2xl">
                    <span className="text-xs text-emerald-200 block">Disetujui</span>
                    <span className="text-lg font-bold text-emerald-300">
                      {tugasMingguanList.filter((t) => t.submission_status === "approved").length}
                    </span>
                  </div>
                  <div className="bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-2xl">
                    <span className="text-xs text-amber-200 block">Perlu Revisi</span>
                    <span className="text-lg font-bold text-amber-300">
                      {tugasMingguanList.filter((t) => t.submission_status === "revision").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Weekly Tasks */}
            {tugasMingguanList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-12 text-center backdrop-blur-md">
                <ListTodo className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Belum Ada Tugas Mingguan</h3>
                <p className="text-sm text-white/60">
                  Mentor kelompok Anda belum membagikan tugas mingguan saat ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {tugasMingguanList.map((tm) => {
                  const isDeadlinePassed = new Date(tm.deadline) < new Date();
                  const isSubmitted = !!tm.submission_id;

                  return (
                    <div
                      key={tm.id}
                      className={`rounded-3xl border transition-all duration-300 backdrop-blur-xl overflow-hidden ${
                        tm.submission_status === "approved"
                          ? "border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                          : tm.submission_status === "revision"
                          ? "border-amber-500/40 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                          : isSubmitted
                          ? "border-blue-500/30 bg-white/10 shadow-lg"
                          : isDeadlinePassed
                          ? "border-red-500/30 bg-red-950/15 shadow-lg"
                          : "border-white/20 bg-white/10 shadow-lg hover:border-white/30"
                      }`}
                    >
                      <div className="p-6">
                        {/* Header card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold uppercase tracking-wider">
                              Minggu ke-{tm.minggu_ke}
                            </span>
                            <h3 className="text-lg font-bold text-white">{tm.judul}</h3>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {tm.submission_status === "approved" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                              </span>
                            ) : tm.submission_status === "revision" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <AlertTriangle className="w-3.5 h-3.5" /> Perlu Revisi
                              </span>
                            ) : tm.submission_status === "rejected" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
                                <X className="w-3.5 h-3.5" /> Ditolak
                              </span>
                            ) : isSubmitted ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                <Clock className="w-3.5 h-3.5" /> Menunggu Review
                              </span>
                            ) : isDeadlinePassed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
                                <AlertCircle className="w-3.5 h-3.5" /> Terlewat Deadline
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20">
                                Belum Dikumpulkan
                              </span>
                            )}

                            {tm.nilai !== null && tm.nilai !== undefined && (
                              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md">
                                Nilai: {tm.nilai} / 100
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="bg-black/30 rounded-2xl p-4 border border-white/10 text-sm text-white/90 whitespace-pre-line leading-relaxed mb-4">
                          {tm.deskripsi}
                        </div>

                        {/* Attachment & Info Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/70 border-t border-white/10 pt-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              <span>
                                Deadline:{" "}
                                <strong className="text-white">
                                  {new Date(tm.deadline).toLocaleDateString("id-ID", {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </strong>
                              </span>
                            </div>

                            {tm.file_attachment && (
                              <a
                                href={`/uploads/${tm.file_attachment.replace(/^uploads\//, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition-colors font-medium"
                              >
                                <Paperclip className="w-3.5 h-3.5" /> Lampiran Mentor
                              </a>
                            )}
                          </div>

                          {/* Action Button */}
                          <div>
                            {selectedTM === tm.id ? (
                              <button
                                onClick={() => {
                                  setSelectedTM(null);
                                  setTmSubmitForm({ catatan_mahasiswa: "", link_url: "", file: null });
                                }}
                                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                              >
                                Tutup Form
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedTM(tm.id);
                                  setTmSubmitForm({
                                    catatan_mahasiswa: tm.catatan_mahasiswa || "",
                                    link_url: tm.submission_link || "",
                                    file: null,
                                  });
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                                  isSubmitted
                                    ? "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25"
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {isSubmitted ? "Kirim Ulang / Edit Pengumpulan" : "Kumpulkan Tugas"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Submission details if already submitted */}
                        {isSubmitted && selectedTM !== tm.id && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                              <div className="flex items-center justify-between text-white/60">
                                <span>
                                  Dikumpulkan pada:{" "}
                                  <strong className="text-white/80">
                                    {new Date(tm.submitted_at).toLocaleString("id-ID")}
                                  </strong>
                                </span>
                                {tm.reviewed_at && (
                                  <span>
                                    Diperiksa pada:{" "}
                                    <strong className="text-white/80">
                                      {new Date(tm.reviewed_at).toLocaleString("id-ID")}
                                    </strong>
                                  </span>
                                )}
                              </div>

                              {tm.catatan_mahasiswa && (
                                <p className="text-white/80">
                                  <span className="font-semibold text-white">Catatan Anda:</span>{" "}
                                  {tm.catatan_mahasiswa}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 pt-1">
                                {tm.submission_file && (
                                  <a
                                    href={`/uploads/${tm.submission_file.replace(/^uploads\//, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-blue-300 hover:text-blue-200 underline font-medium"
                                  >
                                    <Download className="w-3.5 h-3.5" /> File Tugas Anda
                                  </a>
                                )}
                                {tm.submission_link && (
                                  <a
                                    href={
                                      tm.submission_link.startsWith("http")
                                        ? tm.submission_link
                                        : `https://${tm.submission_link}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 underline font-medium"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" /> Buka Link Pengerjaan
                                  </a>
                                )}
                              </div>

                              {tm.catatan_mentor && (
                                <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
                                  <span className="font-bold flex items-center gap-1 mb-1">
                                    💬 Catatan & Masukan Mentor ({tm.mentor_nama}):
                                  </span>
                                  <p className="text-xs text-purple-100 whitespace-pre-line">
                                    {tm.catatan_mentor}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Submission Form Modal/Panel */}
                        {selectedTM === tm.id && (
                          <form
                            onSubmit={(e) => handleSubmitTugasMingguan(e, tm.id)}
                            className="mt-5 pt-5 border-t border-white/15 space-y-4 animate-fade-in bg-black/40 p-5 rounded-2xl border border-white/10"
                          >
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <Upload className="w-4 h-4 text-blue-400" />
                              Form Pengumpulan Tugas (Minggu ke-{tm.minggu_ke})
                            </h4>

                            <div>
                              <label className="block text-xs font-medium text-white/80 mb-1">
                                File Tugas / Dokumen / Source Code (PDF, DOCX, ZIP, gambar, dll)
                              </label>
                              <input
                                type="file"
                                onChange={(e) =>
                                  setTmSubmitForm({ ...tmSubmitForm, file: e.target.files[0] })
                                }
                                className="w-full text-xs text-white/70 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition cursor-pointer"
                              />
                              {tm.submission_file && !tmSubmitForm.file && (
                                <p className="text-[11px] text-white/50 mt-1">
                                  File yang sudah ada tersimpan. Pilih file baru jika ingin mengganti.
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-white/80 mb-1">
                                Link Pengerjaan (GitHub / Google Drive / Figma / Website demo)
                              </label>
                              <input
                                type="text"
                                value={tmSubmitForm.link_url}
                                onChange={(e) =>
                                  setTmSubmitForm({ ...tmSubmitForm, link_url: e.target.value })
                                }
                                placeholder="https://github.com/username/project atau https://drive.google.com/..."
                                className="w-full bg-black/30 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-white/80 mb-1">
                                Catatan / Ringkasan Pengerjaan
                              </label>
                              <textarea
                                rows="3"
                                value={tmSubmitForm.catatan_mahasiswa}
                                onChange={(e) =>
                                  setTmSubmitForm({
                                    ...tmSubmitForm,
                                    catatan_mahasiswa: e.target.value,
                                  })
                                }
                                placeholder="Jelaskan apa yang sudah dikerjakan, kendala, atau petunjuk untuk mentor..."
                                className="w-full bg-black/30 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setSelectedTM(null)}
                                className="px-4 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                disabled={tmLoading}
                                className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                              >
                                {tmLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" /> Kumpulkan Sekarang
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: TUGAS AKHIR */}
        {activeTab === "tugasAkhir" && (

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-indigo-500" />
                Pengajuan Judul Tugas Akhir
              </h2>
              <form onSubmit={handleSubmitTA} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Judul Tugas Akhir *</label>
                  <input
                    type="text"
                    required
                    value={taForm.judul}
                    onChange={(e) => setTaForm({ ...taForm, judul: e.target.value })}
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                    placeholder="Masukkan judul tugas akhir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows="3"
                    value={taForm.deskripsi}
                    onChange={(e) => setTaForm({ ...taForm, deskripsi: e.target.value })}
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 resize-none"
                    placeholder="Deskripsi singkat mengenai tugas akhir..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">File Proposal (PDF) *</label>
                  <input
                    type="file"
                    required
                    accept="application/pdf,.pdf"
                    onChange={(e) => setTaForm({ ...taForm, file: e.target.files[0] })}
                    className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={taLoading}
                  className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {taLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Kirim Pengajuan
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-indigo-500" />
                Riwayat Pengajuan
              </h2>
              {tugasAkhirList.length === 0 ? (
                <p className="text-white/60 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">Belum ada riwayat pengajuan tugas akhir.</p>
              ) : (
                <div className="space-y-4">
                  {tugasAkhirList.map((ta) => (
                    <div key={ta.id} className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{ta.judul}</h3>
                          <p className="text-xs text-white/60 mt-1">Diajukan pada {new Date(ta.submitted_at || ta.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ta.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          ta.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                          ta.status === 'revision' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {ta.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 mb-3">{ta.deskripsi}</p>
                      
                      <div className="bg-white/5 rounded-lg p-3 text-sm mb-3 border border-gray-100">
                        <span className="font-semibold text-white/90">Catatan Mentor: </span>
                        <span className="text-white/80">{ta.catatan_mentor || "-"}</span>
                      </div>
                      
                      {ta.file_url && (
                        <a href={`/uploads/${ta.file_url.split('uploads/')[1] || ta.file_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                          <FileCheck className="w-4 h-4" /> Download Proposal
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PENILAIAN */}
        {activeTab === "grades" && (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-500" />
              Penilaian dari Mentor
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Indikator Penilaian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider w-32">
                      Bobot (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider w-32">
                      Nilai (0-100)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {grades.length > 0 ? (
                    grades.map((g, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {g.nama_indikator}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                          {g.bobot}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                          {g.nilai}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-white/60">
                        Belum ada nilai yang diberikan oleh mentor.
                      </td>
                    </tr>
                  )}
                </tbody>
                {grades.length > 0 && (
                  <tfoot className="bg-white/10 font-bold">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white/80 font-semibold" colSpan="2">
                        Total Nilai (Tertimbang):
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-300">
                        {(() => {
                          let total = 0;
                          let totalBobot = 0;
                          grades.forEach(g => {
                            total += (parseFloat(g.nilai) || 0) * ((parseFloat(g.bobot) || 0) / 100);
                            totalBobot += (parseFloat(g.bobot) || 0);
                          });
                          if (totalBobot > 0) {
                            total = (total / totalBobot) * 100;
                          }
                          return total.toFixed(2);
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <p className="text-sm text-white/60 mt-4">
              * Total nilai dihitung berdasarkan bobot masing-masing indikator.
            </p>
          </div>
        )}
        {/* TAB: SERTIFIKAT */}
        {activeTab === "certificates" && (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Medal className="w-6 h-6 text-yellow-500" />
              Sertifikat PKL
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.length > 0 ? (
                certificates.map((cert, idx) => (
                  <div key={idx} className="border border-yellow-200 bg-yellow-50 rounded-lg p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-yellow-800">{cert.judul}</h3>
                        <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded font-mono">
                          {cert.nomor_sertifikat}
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700 mb-4">
                        Diberikan atas penyelesaian Praktik Kerja Lapangan.
                      </p>
                      <div className="text-sm text-yellow-800 mb-1">
                        <strong>Periode:</strong> {cert.periode_mulai ? new Date(cert.periode_mulai).toLocaleDateString('id-ID') : '-'} s/d {cert.periode_selesai ? new Date(cert.periode_selesai).toLocaleDateString('id-ID') : '-'}
                      </div>
                      <div className="text-sm text-yellow-800">
                        <strong>Catatan:</strong> {cert.catatan || '-'}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-yellow-200 flex justify-between items-center">
                      <span className="text-xs text-yellow-600">Terbit: {cert.tanggal_terbit ? new Date(cert.tanggal_terbit).toLocaleDateString('id-ID') : '-'}</span>
                      <div className="flex gap-2 items-center">
                        {cert.file_url ? (
                          <a
                            href={`/uploads/${cert.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-600 flex items-center justify-center hover:bg-yellow-500 hover:text-white transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <button
                            onClick={() => alert('File sertifikat belum tersedia.')}
                            className="w-8 h-8 rounded-full bg-white/15 text-white/60 flex items-center justify-center"
                            title="File tidak tersedia"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <Medal className="w-8 h-8 text-yellow-400 opacity-50" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-white/60 border-2 border-dashed border-gray-200 rounded-lg">
                  <Medal className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  Belum ada sertifikat yang diterbitkan oleh mentor untuk Anda.
                </div>
              )}
            </div>
          </div>
        )}
            </div>
          </main>
        </div>
      </div>

      {/* Modal Izin */}
      {showIzinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Ajukan Izin</h3>
              <button
                onClick={() => setShowIzinModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitIzin} className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  📅 Izin untuk hari ini:{" "}
                  <strong>{new Date().toLocaleDateString("id-ID")}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan Izin
                </label>
                <textarea
                  value={izinData.keterangan}
                  onChange={(e) =>
                    setIzinData({ ...izinData, keterangan: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Alasan izin (sakit, keperluan keluarga, dll.)"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowIzinModal(false)}
                  className="btn-secondary flex-1"
                  disabled={izinLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center"
                  disabled={izinLoading}
                >
                  {izinLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Submit Izin"
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

export default MahasiswaDashboard;