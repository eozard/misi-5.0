import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LogOut, Users, BookOpen, Award, Plus, Trash2, Download, Save, Loader2, FileCheck, FileText, ListTodo, CheckCircle2, AlertTriangle, Edit, Eye, Paperclip, ExternalLink, Calendar } from "lucide-react";
import axiosInstance from "../utils/axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MentorDashboard = () => {
  const [activeTab, setActiveTab] = useState("peserta");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Data Peserta
  const [students, setStudents] = useState([]);

  // Penilaian
  const [indicators, setIndicators] = useState([]);
  const [newIndicator, setNewIndicator] = useState({ nama_indikator: "", bobot: "" });
  const [grades, setGrades] = useState([]);
  const [gradesForm, setGradesForm] = useState({});

  // Tugas Mingguan
  const [tugasMingguanList, setTugasMingguanList] = useState([]);
  const [showAddTMModal, setShowAddTMModal] = useState(false);
  const [editingTM, setEditingTM] = useState(null);
  const [tmForm, setTmForm] = useState({
    minggu_ke: 1,
    judul: "",
    deskripsi: "",
    deadline: "",
    file: null,
  });
  const [tmSubmissions, setTmSubmissions] = useState([]);
  const [selectedTMDetail, setSelectedTMDetail] = useState(null);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewForm, setReviewForm] = useState({ nilai: "", status: "approved", catatan_mentor: "" });
  const [tmActionLoading, setTmActionLoading] = useState(false);

  // Sertifikat
  const [certificates, setCertificates] = useState([]);
  const [newCert, setNewCert] = useState({ student_nama: "", judul: "", catatan: "", file: null });

  // Tugas Akhir
  const [tugasAkhirList, setTugasAkhirList] = useState([]);
  const [selectedTA, setSelectedTA] = useState(null);
  const [taCatatan, setTaCatatan] = useState("");

  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: "peserta", label: "Data Peserta", icon: Users },
    { id: "tugasMingguan", label: "Tugas Mingguan", icon: ListTodo },
    { id: "penilaian", label: "Penilaian", icon: BookOpen },
    { id: "tugasAkhir", label: "Tugas Akhir", icon: FileText },
    { id: "sertifikat", label: "Sertifikat", icon: Award },
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (!userData || !token || userData.role !== "mentor") {
      navigate("/mentor-login");
      return;
    }
    setUser(userData);
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === "peserta") {
      fetchStudents();
    } else if (activeTab === "tugasMingguan") {
      fetchTugasMingguan();
    } else if (activeTab === "penilaian") {
      fetchIndicators();
      fetchGrades();
    } else if (activeTab === "sertifikat") {
      fetchCertificates();
    } else if (activeTab === "tugasAkhir") {
      fetchTugasAkhir();
    }
  }, [activeTab]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/mentor-login");
  };

  // --- API Calls ---
  const fetchStudents = async () => {
    try {
      const res = await axiosInstance.get("/mentor/students");
      if (res.data.success) setStudents(res.data.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchIndicators = async () => {
    try {
      const res = await axiosInstance.get("/mentor/indicators");
      if (res.data.success) setIndicators(res.data.data);
    } catch (error) {
      console.error("Error fetching indicators:", error);
    }
  };

  const handleAddIndicator = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/mentor/indicators", newIndicator);
      if (res.data.success) {
        fetchIndicators();
        setNewIndicator({ nama_indikator: "", bobot: "" });
      }
    } catch (error) {
      console.error("Error adding indicator:", error);
    }
  };

  const handleDeleteIndicator = async (id) => {
    try {
      const res = await axiosInstance.delete(`/mentor/indicators/${id}`);
      if (res.data.success) fetchIndicators();
    } catch (error) {
      console.error("Error deleting indicator:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await axiosInstance.get("/mentor/grades");
      if (res.data.success) {
        setGrades(res.data.data);
        // Transform to form state
        const initialForm = {};
        res.data.data.forEach(g => {
          if (!initialForm[g.student_nama]) initialForm[g.student_nama] = {};
          initialForm[g.student_nama][g.indicator_id] = g.nilai;
        });
        setGradesForm(initialForm);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  // ====== TUGAS MINGGUAN HANDLERS ======
  const fetchTugasMingguan = async () => {
    try {
      const res = await axiosInstance.get("/mentor/tugas-mingguan");
      if (res.data.success) {
        setTugasMingguanList(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching tugas mingguan:", error);
    }
  };

  const handleSaveTM = async (e) => {
    e.preventDefault();
    setTmActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("minggu_ke", tmForm.minggu_ke);
      formData.append("judul", tmForm.judul);
      formData.append("deskripsi", tmForm.deskripsi);
      formData.append("deadline", tmForm.deadline);
      if (tmForm.file) formData.append("file", tmForm.file);

      let res;
      if (editingTM) {
        res = await axiosInstance.put(`/mentor/tugas-mingguan/${editingTM.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axiosInstance.post("/mentor/tugas-mingguan", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (res.data.success) {
        alert(editingTM ? "✅ Tugas mingguan berhasil diperbarui!" : "✅ Tugas mingguan berhasil ditambahkan!");
        setShowAddTMModal(false);
        setEditingTM(null);
        setTmForm({ minggu_ke: 1, judul: "", deskripsi: "", deadline: "", file: null });
        fetchTugasMingguan();
      }
    } catch (error) {
      console.error("Error saving tugas mingguan:", error);
      alert("❌ Gagal menyimpan tugas: " + (error.response?.data?.message || error.message));
    } finally {
      setTmActionLoading(false);
    }
  };

  const handleDeleteTM = async (id, judul) => {
    if (!window.confirm(`Hapus tugas mingguan "${judul}"? Semua data pengumpulan mahasiswa terkait tugas ini juga akan terhapus.`)) return;
    try {
      const res = await axiosInstance.delete(`/mentor/tugas-mingguan/${id}`);
      if (res.data.success) {
        alert("✅ Tugas mingguan berhasil dihapus!");
        if (selectedTMDetail?.id === id) {
          setSelectedTMDetail(null);
        }
        fetchTugasMingguan();
      }
    } catch (error) {
      console.error("Error deleting tugas mingguan:", error);
      alert("❌ Gagal menghapus: " + (error.response?.data?.message || error.message));
    }
  };

  const fetchTMSubmissions = async (tm) => {
    setSelectedTMDetail(tm);
    try {
      const res = await axiosInstance.get(`/mentor/tugas-mingguan/${tm.id}/submissions`);
      if (res.data.success) {
        setTmSubmissions(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleSaveSubmissionReview = async (e) => {
    e.preventDefault();
    if (!reviewingSubmission) return;

    setTmActionLoading(true);
    try {
      const res = await axiosInstance.put(`/mentor/tugas-mingguan/submissions/${reviewingSubmission.submission_id}`, {
        nilai: reviewForm.nilai,
        status: reviewForm.status,
        catatan_mentor: reviewForm.catatan_mentor,
      });

      if (res.data.success) {
        alert("✅ Penilaian dan catatan berhasil disimpan!");
        setReviewingSubmission(null);
        if (selectedTMDetail) {
          fetchTMSubmissions(selectedTMDetail);
        }
        fetchTugasMingguan();
      }
    } catch (error) {
      console.error("Error saving submission review:", error);
      alert("❌ Gagal menyimpan evaluasi: " + (error.response?.data?.message || error.message));
    } finally {
      setTmActionLoading(false);
    }
  };

  const handleSaveGrades = async (studentNama) => {
    try {
      const userGrades = gradesForm[studentNama] || {};
      const gradesArray = Object.keys(userGrades)
        .filter(indId => userGrades[indId] !== '' && userGrades[indId] !== null && userGrades[indId] !== undefined)
        .map(indId => ({
          indicator_id: Number(indId),
          student_nama: studentNama,
          nilai: Number(userGrades[indId])
        }));

      if (gradesArray.length === 0) {
        alert('Belum ada nilai yang diisi untuk ' + studentNama + '. Silakan isi nilai terlebih dahulu.');
        return;
      }

      const res = await axiosInstance.post('/mentor/grades', { grades: gradesArray });
      if (res.data.success) {
        alert('\u2705 Nilai untuk ' + studentNama + ' berhasil disimpan!');
        fetchGrades();
      } else {
        alert('\u274c Gagal menyimpan: ' + (res.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      const msg = error?.response?.data?.message || error.message || 'Server error';
      alert('\u274c Gagal menyimpan nilai: ' + msg);
    }
  };

  const handleGradeChange = (studentNama, indId, val) => {
    setGradesForm(prev => ({
      ...prev,
      [studentNama]: {
        ...(prev[studentNama] || {}),
        [indId]: val
      }
    }));
  };

  const fetchTugasAkhir = async () => {
    try {
      const res = await axiosInstance.get("/mentor/tugas-akhir");
      if (res.data.success) {
        setTugasAkhirList(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching tugas akhir:", error);
    }
  };

  const handleUpdateTA = async (id, status) => {
    try {
      const res = await axiosInstance.put(`/mentor/tugas-akhir/${id}`, {
        status,
        catatan_mentor: taCatatan
      });
      if (res.data.success) {
        alert("Status Tugas Akhir berhasil diperbarui!");
        setSelectedTA(null);
        setTaCatatan("");
        fetchTugasAkhir();
      }
    } catch (error) {
      console.error("Error updating tugas akhir:", error);
      alert("Gagal memperbarui status: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteTA = async (id, judul) => {
    if (!window.confirm(`Hapus pengajuan tugas akhir "${judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await axiosInstance.delete(`/mentor/tugas-akhir/${id}`);
      if (res.data.success) {
        alert("✅ Pengajuan tugas akhir berhasil dihapus!");
        fetchTugasAkhir();
      } else {
        alert("❌ Gagal menghapus: " + (res.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting tugas akhir:", error);
      alert("❌ Gagal menghapus: " + (error.response?.data?.message || error.message));
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await axiosInstance.get("/mentor/certificates");
      if (res.data.success) setCertificates(res.data.data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  const handleAddCertificate = async (e) => {
    e.preventDefault();
    if (!newCert.file) {
      alert('Pilih file sertifikat terlebih dahulu!');
      return;
    }
    const formData = new FormData();
    formData.append('student_nama', newCert.student_nama);
    if (newCert.judul) formData.append('judul', newCert.judul);
    if (newCert.catatan) formData.append('catatan', newCert.catatan);
    formData.append('file', newCert.file);

    try {
      const res = await axiosInstance.post('/mentor/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert('\u2705 Sertifikat berhasil diupload!');
        fetchCertificates();
        setNewCert({ student_nama: '', judul: '', catatan: '', file: null });
        const fileInput = document.getElementById('certFileInput');
        if (fileInput) fileInput.value = '';
      } else {
        alert('\u274c Gagal upload sertifikat: ' + (res.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading certificate:', error);
      const msg = error?.response?.data?.message || error.message || 'Server error';
      alert('\u274c Gagal upload sertifikat: ' + msg);
    }
  };

  const handleDeleteCertificate = async (id) => {
    try {
      const res = await axiosInstance.delete(`/mentor/certificates/${id}`);
      if (res.data.success) fetchCertificates();
    } catch (error) {
      console.error("Error deleting certificate:", error);
    }
  };

  const exportGradesPDF = () => {
    const doc = new jsPDF();
    doc.text(`Laporan Penilaian - Kelompok ${user?.kelompok || ''}`, 14, 15);

    // Prepare table headers
    const head = [["Nama Mahasiswa", ...indicators.map(i => `${i.nama_indikator} (${i.bobot}%)`), "Total Nilai"]];

    // Prepare table body
    const body = students.map(student => {
      let total = 0;
      let totalBobot = 0;
      const row = [student.nama];
      indicators.forEach(ind => {
        const gradeInfo = grades.find(g => g.student_nama === student.nama && g.indicator_id === ind.id);
        const nilai = gradeInfo ? gradeInfo.nilai : 0;
        row.push(nilai);
        total += nilai * (ind.bobot / 100);
        totalBobot += parseFloat(ind.bobot);
      });
      // Normalize total if totalBobot is not 100
      if (totalBobot > 0) {
        total = (total / totalBobot) * 100;
      }
      row.push(total.toFixed(2));
      return row;
    });

    autoTable(doc, {
      startY: 25,
      head: head,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 29, 149] } // Purple
    });

    doc.save(`Penilaian_${user?.kelompok || 'PKL'}.pdf`);
  };



  return (
    <div className="min-h-screen overflow-hidden text-slate-100">

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
            subtitle="Dashboard Mentor"
            user={user || { nama: "Mentor", role: "mentor" }}
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
                <div className="px-5 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-white/10 text-sm font-medium flex items-center gap-2 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  {user?.nama || 'Mentor'} - Kelompok <span className="capitalize">{user?.kelompok || '-'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
              {/* --- TAB PESERTA --- */}
              {activeTab === "peserta" && (
                <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4">Daftar Mahasiswa Bimbingan</h2>
                    {students.length === 0 ? (
                      <p className="text-white/50 text-center py-8">Belum ada mahasiswa di kelompok Anda.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {students.map(student => (
                          <div key={student.id} className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-black/30 transition-colors">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-lg">
                              {student.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold">{student.nama}</p>
                              <p className="text-sm text-white/60 capitalize">Role: {student.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB PENILAIAN --- */}
              {activeTab === "penilaian" && (
                <div className="space-y-6">

                  {/* Indikator Penilaian */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4">Indikator Penilaian</h2>

                    <form onSubmit={handleAddIndicator} className="flex gap-4 mb-6 items-end">
                      <div className="flex-1">
                        <label className="block text-sm mb-1 text-white/70">Nama Indikator</label>
                        <input
                          required
                          type="text"
                          value={newIndicator.nama_indikator}
                          onChange={e => setNewIndicator({ ...newIndicator, nama_indikator: e.target.value })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                          placeholder="Contoh: Kedisiplinan, Kualitas Kerja"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm mb-1 text-white/70">Bobot (%)</label>
                        <input
                          required
                          type="number"
                          value={newIndicator.bobot}
                          onChange={e => setNewIndicator({ ...newIndicator, bobot: e.target.value })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                          placeholder="10-100"
                        />
                      </div>
                      <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Tambah
                      </button>
                    </form>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse mb-4">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="py-3 px-4 text-white/70 font-medium">Nama Indikator</th>
                            <th className="py-3 px-4 text-white/70 font-medium text-center">Bobot (%)</th>
                            <th className="py-3 px-4 text-white/70 font-medium text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indicators.map(ind => (
                            <tr key={ind.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4">{ind.nama_indikator}</td>
                              <td className="py-3 px-4 text-center">{ind.bobot}%</td>
                              <td className="py-3 px-4 text-center">
                                <button onClick={() => handleDeleteIndicator(ind.id)} className="text-red-400 hover:text-red-300">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {indicators.length === 0 && <p className="text-white/40 text-sm text-center py-4">Belum ada indikator. Tambahkan di atas.</p>}
                    </div>
                  </div>

                  {/* Form Penilaian */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Beri Nilai Mahasiswa</h2>
                      <button onClick={exportGradesPDF} className="bg-green-600/80 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export PDF
                      </button>
                    </div>

                    {students.length === 0 || indicators.length === 0 ? (
                      <p className="text-white/50 py-4">Pastikan ada mahasiswa dan indikator penilaian terlebih dahulu.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-3 px-4 text-white/70 font-medium">Mahasiswa</th>
                              {indicators.map(ind => (
                                <th key={ind.id} className="py-3 px-4 text-white/70 font-medium text-center">{ind.nama_indikator} ({ind.bobot}%)</th>
                              ))}
                              <th className="py-3 px-4 text-white/70 font-medium text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map(student => (
                              <tr key={student.id} className="border-b border-black/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-4 font-medium">{student.nama}</td>
                                {indicators.map(ind => (
                                  <td key={ind.id} className="py-4 px-4">
                                    <input
                                      type="number"
                                      max="100"
                                      min="0"
                                      value={gradesForm[student.nama]?.[ind.id] || ''}
                                      onChange={e => handleGradeChange(student.nama, ind.id, e.target.value)}
                                      className="w-20 mx-auto block bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:outline-none focus:border-purple-500"
                                      placeholder="0-100"
                                    />
                                  </td>
                                ))}
                                <td className="py-4 px-4 text-center">
                                  <button
                                    onClick={() => handleSaveGrades(student.nama)}
                                    className="bg-blue-600/80 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                                  >
                                    <Save className="w-4 h-4" /> Simpan
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* --- TAB TUGAS MINGGUAN --- */}
              {activeTab === "tugasMingguan" && (
                <div className="space-y-6 animate-fade-in">
                  {/* Top Bar */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <ListTodo className="w-5 h-5 text-indigo-400" />
                        Manajemen Tugas Mingguan
                      </h2>
                      <p className="text-xs text-white/60 mt-1">
                        Berikan penugasan berkala mingguan untuk seluruh mahasiswa di kelompok {user?.kelompok || "-"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingTM(null);
                        setTmForm({
                          minggu_ke: tugasMingguanList.length + 1,
                          judul: "",
                          deskripsi: "",
                          deadline: "",
                          file: null,
                        });
                        setShowAddTMModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Tambah Tugas Baru
                    </button>
                  </div>

                  {/* List of Tasks */}
                  {tugasMingguanList.length === 0 ? (
                    <div className="bg-white/5 p-12 rounded-2xl border border-dashed border-white/10 text-center">
                      <ListTodo className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/60 font-medium">Belum ada tugas mingguan yang dibuat.</p>
                      <p className="text-xs text-white/40 mt-1">
                        Klik tombol "Tambah Tugas Baru" untuk mulai memberikan tugas kepada mahasiswa bimbingan.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5">
                      {tugasMingguanList.map((tm) => (
                        <div
                          key={tm.id}
                          className="bg-black/25 p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-md"
                        >
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase">
                                Minggu {tm.minggu_ke}
                              </span>
                              <h3 className="text-lg font-bold text-white">{tm.judul}</h3>
                            </div>

                            {/* Stats Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 rounded-lg text-xs bg-white/10 text-white/80 border border-white/10">
                                Mengumpulkan:{" "}
                                <strong className="text-white">
                                  {tm.total_submitted} / {tm.total_mahasiswa}
                                </strong>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Disetujui: {tm.total_approved}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Revisi: {tm.total_revision}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-white/80 bg-black/30 p-3.5 rounded-xl border border-white/5 mb-4 whitespace-pre-line leading-relaxed">
                            {tm.deskripsi}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60 border-t border-white/5 pt-3">
                            <div className="flex flex-wrap items-center gap-4">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
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

                              {tm.file_attachment && (
                                <a
                                  href={`/uploads/${tm.file_attachment.replace(/^uploads\//, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-medium"
                                >
                                  <Paperclip className="w-3.5 h-3.5" /> Lampiran Tugas
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => fetchTMSubmissions(tm)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" /> Lihat Pengumpulan ({tm.total_submitted})
                              </button>

                              <button
                                onClick={() => {
                                  setEditingTM(tm);
                                  const dateVal = new Date(tm.deadline);
                                  const offset = dateVal.getTimezoneOffset() * 60000;
                                  const localISOTime = new Date(dateVal.getTime() - offset).toISOString().slice(0, 16);
                                  setTmForm({
                                    minggu_ke: tm.minggu_ke,
                                    judul: tm.judul,
                                    deskripsi: tm.deskripsi,
                                    deadline: localISOTime,
                                    file: null,
                                  });
                                  setShowAddTMModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
                                title="Edit tugas"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>

                              <button
                                onClick={() => handleDeleteTM(tm.id, tm.judul)}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-colors flex items-center gap-1"
                                title="Hapus tugas"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODAL: Tambah / Edit Tugas Mingguan */}
                  {showAddTMModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                      <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-white">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            <ListTodo className="w-5 h-5 text-indigo-400" />
                            {editingTM ? "Edit Tugas Mingguan" : "Tambah Tugas Mingguan Baru"}
                          </h3>
                          <button
                            onClick={() => setShowAddTMModal(false)}
                            className="text-white/60 hover:text-white p-1"
                          >
                            ✕
                          </button>
                        </div>

                        <form onSubmit={handleSaveTM} className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                              <label className="block text-xs font-medium text-white/70 mb-1">
                                Minggu Ke *
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={tmForm.minggu_ke}
                                onChange={(e) => setTmForm({ ...tmForm, minggu_ke: e.target.value })}
                                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-white/70 mb-1">
                                Deadline Pengumpulan *
                              </label>
                              <input
                                type="datetime-local"
                                required
                                value={tmForm.deadline}
                                onChange={(e) => setTmForm({ ...tmForm, deadline: e.target.value })}
                                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1">
                              Judul Tugas *
                            </label>
                            <input
                              type="text"
                              required
                              value={tmForm.judul}
                              onChange={(e) => setTmForm({ ...tmForm, judul: e.target.value })}
                              placeholder="Misal: Perancangan Arsitektur Database & ERD"
                              className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1">
                              Deskripsi & Instruksi Tugas *
                            </label>
                            <textarea
                              required
                              rows="4"
                              value={tmForm.deskripsi}
                              onChange={(e) => setTmForm({ ...tmForm, deskripsi: e.target.value })}
                              placeholder="Tulis instruksi pengerjaan, format pengumpulan yang diharapkan, dsb..."
                              className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none custom-scrollbar"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1">
                              File Lampiran / Modul (Opsional)
                            </label>
                            <input
                              type="file"
                              onChange={(e) => setTmForm({ ...tmForm, file: e.target.files[0] })}
                              className="w-full text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition cursor-pointer"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddTMModal(false)}
                              className="px-4 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={tmActionLoading}
                              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all"
                            >
                              {tmActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Simpan Tugas
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* MODAL: Detail Pengumpulan Mahasiswa per Tugas */}
                  {selectedTMDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                      <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-4xl w-full shadow-2xl text-white max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                          <div>
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                              Minggu ke-{selectedTMDetail.minggu_ke}
                            </span>
                            <h3 className="text-lg font-bold text-white">{selectedTMDetail.judul}</h3>
                          </div>
                          <button
                            onClick={() => setSelectedTMDetail(null)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                          >
                            Tutup
                          </button>
                        </div>

                        {/* List Students Table */}
                        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                          {tmSubmissions.length === 0 ? (
                            <p className="text-center text-white/50 py-8">Tidak ada mahasiswa di kelompok ini.</p>
                          ) : (
                            <div className="space-y-4">
                              {tmSubmissions.map((sub) => {
                                const isSubmitted = !!sub.submission_id;

                                return (
                                  <div
                                    key={sub.student_id}
                                    className="bg-black/30 border border-white/10 rounded-2xl p-4 transition-all"
                                  >
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                                          {sub.student_nama[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-white text-sm">{sub.student_nama}</h4>
                                          <span className="text-[11px] text-white/50">
                                            {isSubmitted
                                              ? `Dikumpulkan: ${new Date(sub.submitted_at).toLocaleString("id-ID")}`
                                              : "Belum mengumpulkan"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Status & Action */}
                                      <div className="flex items-center gap-2">
                                        {sub.submission_status === "approved" ? (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Disetujui
                                          </span>
                                        ) : sub.submission_status === "revision" ? (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            Revisi
                                          </span>
                                        ) : sub.submission_status === "rejected" ? (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                                            Ditolak
                                          </span>
                                        ) : isSubmitted ? (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                            Menunggu Review
                                          </span>
                                        ) : (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/40 border border-white/10">
                                            Belum Ada
                                          </span>
                                        )}

                                        {sub.nilai !== null && sub.nilai !== undefined && (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-500/40">
                                            Nilai: {sub.nilai}
                                          </span>
                                        )}

                                        {isSubmitted && (
                                          <button
                                            onClick={() => {
                                              setReviewingSubmission(sub);
                                              setReviewForm({
                                                nilai: sub.nilai !== null && sub.nilai !== undefined ? sub.nilai : "",
                                                status: sub.submission_status || "approved",
                                                catatan_mentor: sub.catatan_mentor || "",
                                              });
                                            }}
                                            className="px-3 py-1 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                          >
                                            Evaluasi
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Submission content details */}
                                    {isSubmitted && (
                                      <div className="mt-2 text-xs bg-white/5 p-3 rounded-xl border border-white/5 space-y-1.5">
                                        {sub.catatan_mahasiswa && (
                                          <p className="text-white/80">
                                            <span className="font-semibold text-white">Catatan: </span>
                                            {sub.catatan_mahasiswa}
                                          </p>
                                        )}

                                        <div className="flex flex-wrap gap-3 pt-1">
                                          {sub.file_url && (
                                            <a
                                              href={`/uploads/${sub.file_url.replace(/^uploads\//, "")}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1.5 text-blue-300 hover:text-blue-200 underline font-medium"
                                            >
                                              <Download className="w-3.5 h-3.5" /> Download File Tugas
                                            </a>
                                          )}
                                          {sub.link_url && (
                                            <a
                                              href={sub.link_url.startsWith("http") ? sub.link_url : `https://${sub.link_url}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 underline font-medium"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" /> Buka Link Pengerjaan
                                            </a>
                                          )}
                                        </div>

                                        {sub.catatan_mentor && (
                                          <p className="text-purple-300 pt-1 border-t border-white/5 mt-2">
                                            <span className="font-semibold">Catatan Mentor:</span> {sub.catatan_mentor}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODAL: Review / Evaluasi Pengumpulan Mahasiswa */}
                  {reviewingSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                      <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-base font-bold flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-400" />
                            Evaluasi Tugas: {reviewingSubmission.student_nama}
                          </h3>
                          <button
                            onClick={() => setReviewingSubmission(null)}
                            className="text-white/60 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>

                        <form onSubmit={handleSaveSubmissionReview} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1">
                                Nilai (0 - 100)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={reviewForm.nilai}
                                onChange={(e) => setReviewForm({ ...reviewForm, nilai: e.target.value })}
                                placeholder="Misal: 90"
                                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1">
                                Status Pengesahan *
                              </label>
                              <select
                                value={reviewForm.status}
                                onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                              >
                                <option value="approved" className="bg-gray-900">Disetujui (Approved)</option>
                                <option value="revision" className="bg-gray-900">Perlu Revisi</option>
                                <option value="rejected" className="bg-gray-900">Ditolak</option>
                                <option value="submitted" className="bg-gray-900">Menunggu Review</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1">
                              Catatan & Masukan untuk Mahasiswa
                            </label>
                            <textarea
                              rows="3"
                              value={reviewForm.catatan_mentor}
                              onChange={(e) => setReviewForm({ ...reviewForm, catatan_mentor: e.target.value })}
                              placeholder="Berikan masukan, poin yang perlu diperbaiki, atau apresiasi..."
                              className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setReviewingSubmission(null)}
                              className="px-4 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={tmActionLoading}
                              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all"
                            >
                              {tmActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Simpan Evaluasi
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB TUGAS AKHIR --- */}
              {activeTab === "tugasAkhir" && (

                <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4">Pengajuan Tugas Akhir</h2>
                    {tugasAkhirList.length === 0 ? (
                      <p className="text-white/50 py-4 text-center border-2 border-dashed border-black/10 rounded-xl">Belum ada pengajuan tugas akhir dari mahasiswa.</p>
                    ) : (
                      <div className="space-y-4">
                        {tugasAkhirList.map(ta => (
                          <div key={ta.id} className="bg-black/20 p-5 rounded-xl border border-white/5 shadow-inner">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-purple-200">{ta.judul}</h3>
                                <p className="text-sm text-white/70 mt-1">Mahasiswa: <span className="font-semibold text-white">{ta.student_nama}</span></p>
                                <p className="text-xs text-white/40 mt-1">Diajukan: {new Date(ta.submitted_at || ta.created_at).toLocaleDateString('id-ID')}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ta.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                                  ta.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                                    ta.status === 'revision' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                                      'bg-red-500/20 text-red-400 border border-red-500/50'
                                }`}>
                                {ta.status.toUpperCase()}
                              </span>
                            </div>

                            {selectedTA === ta.id ? (
                              <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                                <p className="text-sm text-white/80 mb-4 bg-black/40 p-4 rounded-lg leading-relaxed">{ta.deskripsi || "Tidak ada deskripsi"}</p>

                                {ta.file_url && (
                                  <a href={`/uploads/${ta.file_url.split('uploads/')[1] || ta.file_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 rounded-lg text-sm hover:from-purple-500/40 hover:to-blue-500/40 mb-5 border border-white/10 transition-all shadow-md">
                                    <FileCheck className="w-4 h-4" /> Download Proposal PDF
                                  </a>
                                )}

                                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                  <label className="block text-sm font-medium text-white/70">Catatan & Feedback Mentor:</label>
                                  <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all custom-scrollbar"
                                    rows="3"
                                    placeholder="Berikan masukan atau catatan untuk mahasiswa..."
                                    value={taCatatan}
                                    onChange={e => setTaCatatan(e.target.value)}
                                  ></textarea>

                                  <div className="flex flex-wrap gap-2 justify-end pt-2">
                                    <button onClick={() => setSelectedTA(null)} className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-all">Batal</button>
                                    <button onClick={() => handleUpdateTA(ta.id, 'revision')} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 transition-all">Revisi</button>
                                    <button onClick={() => handleUpdateTA(ta.id, 'rejected')} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all">Tolak</button>
                                    <button onClick={() => handleUpdateTA(ta.id, 'approved')} className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500/20 hover:bg-green-500/40 text-green-300 border border-green-500/30 hover:border-green-500/50 transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)]">Setujui</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 flex gap-2 flex-wrap">
                                <button onClick={() => { setSelectedTA(ta.id); setTaCatatan(ta.catatan_mentor || ""); }} className="px-5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5">
                                  Review & Update Status
                                </button>
                                <button
                                  onClick={() => handleDeleteTA(ta.id, ta.judul)}
                                  className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 hover:border-red-500/60 transition-all flex items-center gap-1.5"
                                  title="Hapus pengajuan ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB SERTIFIKAT --- */}
              {activeTab === "sertifikat" && (
                <div className="space-y-6">

                  {/* Form Upload Sertifikat */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4">Upload Sertifikat</h2>

                    <form onSubmit={handleAddCertificate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1 text-white/70">Mahasiswa</label>
                        <select
                          required
                          value={newCert.student_nama}
                          onChange={e => setNewCert({ ...newCert, student_nama: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 appearance-none"
                        >
                          <option value="" className="bg-gray-900">-- Pilih Mahasiswa --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.nama} className="bg-gray-900">{s.nama}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-white/70">File Sertifikat (PDF)</label>
                        <input
                          id="certFileInput"
                          required
                          type="file"
                          accept="application/pdf"
                          onChange={e => setNewCert({ ...newCert, file: e.target.files[0] })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-white/70">Judul Sertifikat (Opsional)</label>
                        <input
                          type="text"
                          value={newCert.judul}
                          onChange={e => setNewCert({ ...newCert, judul: e.target.value })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                          placeholder="Contoh: Sertifikat PKL Terbaik"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-white/70">Catatan (Opsional)</label>
                        <input
                          type="text"
                          value={newCert.catatan}
                          onChange={e => setNewCert({ ...newCert, catatan: e.target.value })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                          placeholder="Catatan tambahan..."
                        />
                      </div>
                      <div className="md:col-span-2 mt-2">
                        <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                          <Award className="w-5 h-5" /> Kirim Sertifikat
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Daftar Sertifikat */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4">Daftar Sertifikat Diterbitkan</h2>

                    {certificates.length === 0 ? (
                      <p className="text-white/50 text-center py-8">Belum ada sertifikat yang diterbitkan.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {certificates.map(cert => (
                          <div key={cert.id} className="p-5 bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-2xl relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {cert.file_url && (
                                <a
                                  href={`/uploads/${cert.file_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteCertificate(cert.id)}
                                className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                              <Award className="w-8 h-8 text-yellow-400" />
                              <div>
                                <h3 className="font-bold text-lg">{cert.student_nama}</h3>
                                <p className="text-xs text-white/50">{cert.judul || 'Sertifikat PKL'}</p>
                              </div>
                            </div>
                            <div className="text-sm text-white/70 space-y-1">
                              {cert.catatan && <p><span className="text-white/40">Catatan:</span> {cert.catatan}</p>}
                              <p><span className="text-white/40">Diupload:</span> {cert.created_at ? new Date(cert.created_at).toLocaleDateString('id-ID') : '-'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

export default MentorDashboard;
