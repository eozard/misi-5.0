import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useToast } from "./useToast";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const DIVISI_OPTIONS = [
  "Networking",
  "Software Engineer",
  "Multimedia",
  "Artificial Intelligence",
  "Data Analyst",
];

export const useAdminPendaftaran = () => {
  const { toasts, pushToast, dismissToast } = useToast();

  const [token, setToken] = useState(
    () => localStorage.getItem("admin_pendaftaran_token") || null
  );
  const [admin, setAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem("admin_pendaftaran_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [adminCount, setAdminCount] = useState(null);
  const [showSeedButton, setShowSeedButton] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [pendaftar, setPendaftar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDivisi, setEditDivisi] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [priorityPage, setPriorityPage] = useState(1);
  const [excessPage, setExcessPage] = useState(1);
  const itemsPerPage = 5;

  const [adminList, setAdminList] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    nama: "",
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [confirmDeleteAdmin, setConfirmDeleteAdmin] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDivisi, setFilterDivisi] = useState("all");

  const priority = pendaftar.slice(0, 30);
  const excess = pendaftar.slice(30);
  const totalPendaftar = pendaftar.length;
  const assignedCount = pendaftar.filter((p) => p.assigned_divisi).length;
  const unassignedCount = totalPendaftar - assignedCount;

  const pendaftarWithOrder = useMemo(
    () =>
      (pendaftar || []).map((item, index) => ({
        ...item,
        orderNumber: index + 1,
      })),
    [pendaftar]
  );

  const normalizedSearch = useMemo(
    () => searchTerm.trim().toLowerCase(),
    [searchTerm]
  );

  const filteredPendaftar = useMemo(() => {
    return pendaftarWithOrder.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        String(item.nama || "").toLowerCase().includes(normalizedSearch) ||
        String(item.nim || "").toLowerCase().includes(normalizedSearch) ||
        String(item.email || "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "assigned" && item.assigned_divisi) ||
        (filterStatus === "unassigned" && !item.assigned_divisi);

      const activeDivisi = item.assigned_divisi || item.divisi;
      const matchesDivisi =
        filterDivisi === "all" || activeDivisi === filterDivisi;

      return matchesSearch && matchesStatus && matchesDivisi;
    });
  }, [pendaftarWithOrder, normalizedSearch, filterStatus, filterDivisi]);

  const filteredPriority = useMemo(
    () => filteredPendaftar.filter((item) => item.orderNumber <= 30),
    [filteredPendaftar]
  );

  const filteredExcess = useMemo(
    () => filteredPendaftar.filter((item) => item.orderNumber > 30),
    [filteredPendaftar]
  );

  const priorityTotalPages = Math.ceil(filteredPriority.length / itemsPerPage) || 1;
  const excessTotalPages = Math.ceil(filteredExcess.length / itemsPerPage) || 1;

  const paginatedPriority = filteredPriority.slice(
    (priorityPage - 1) * itemsPerPage,
    priorityPage * itemsPerPage
  );

  const paginatedExcess = filteredExcess.slice(
    (excessPage - 1) * itemsPerPage,
    excessPage * itemsPerPage
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("admin_pendaftaran_token");
    localStorage.removeItem("admin_pendaftaran_user");
    setToken(null);
    setAdmin(null);
    setPendaftar([]);
    setAdminList([]);
    setEditingId(null);
    setEditDivisi("");
    setConfirmState(null);
    setSelectedItem(null);
  }, []);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [token, handleLogout]);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoginError("");

      if (!username || !password) {
        setLoginError("Username dan password wajib diisi");
        return;
      }

      setLoginLoading(true);
      try {
        const res = await axios.post(
          `${API_URL}/admin-pendaftaran/login`,
          { username, password }
        );

        if (res.data.success) {
          localStorage.setItem(
            "admin_pendaftaran_token",
            res.data.token
          );
          localStorage.setItem(
            "admin_pendaftaran_user",
            JSON.stringify(res.data.admin)
          );
          setToken(res.data.token);
          setAdmin(res.data.admin);
          setUsername("");
          setPassword("");
          pushToast({
            type: "success",
            message: `Selamat datang, ${res.data.admin.nama}!`,
          });
        }
      } catch (err) {
        const message = err.response?.data?.message || "Login gagal";
        setLoginError(message);
      } finally {
        setLoginLoading(false);
      }
    },
    [username, password, pushToast]
  );

  const fetchAdminCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin-pendaftaran/list`);
      if (res.data.success) {
        setAdminCount(res.data.total);
        setShowSeedButton(res.data.total === 0);
      }
    } catch {
      setAdminCount(null);
      setShowSeedButton(false);
    }
  }, []);

  const handleSeedAdmin = useCallback(async () => {
    setSeeding(true);
    setLoginError("");
    try {
      const res = await axios.post(`${API_URL}/admin-pendaftaran/seed`);
      if (res.data.success) {
        if (res.data.seeded) {
          pushToast({
            type: "success",
            message: "Admin default berhasil dibuat (admin / admin123)",
          });
        } else {
          pushToast({
            type: "info",
            message: res.data.message || "Admin sudah tersedia",
          });
        }
        await fetchAdminCount();
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Gagal membuat admin default";
      setLoginError(message);
    } finally {
      setSeeding(false);
    }
  }, [pushToast, fetchAdminCount]);

  const fetchPendaftar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/pendaftaran");
      if (res.data.success) {
        setPendaftar(res.data.data);
        setPriorityPage(1);
        setExcessPage(1);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Gagal memuat data pendaftar";
      pushToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [api, pushToast]);

  const handleSaveDivisi = useCallback(
    async (id) => {
      if (!editDivisi) {
        pushToast({ type: "error", message: "Pilih divisi terlebih dahulu" });
        return;
      }

      const MAX_PER_DIVISI = 6;
      const currentItem = pendaftar.find((p) => p.id === id);
      const movingToSameDivisi = currentItem?.assigned_divisi === editDivisi;

      if (!movingToSameDivisi) {
        const countInTarget = pendaftar.filter(
          (p) => p.assigned_divisi === editDivisi
        ).length;
        if (countInTarget >= MAX_PER_DIVISI) {
          pushToast({
            type: "error",
            message: `Divisi ${editDivisi} sudah penuh (${MAX_PER_DIVISI}/${MAX_PER_DIVISI} peserta)`,
          });
          return;
        }
      }

      try {
        const res = await api.put(`/pendaftaran/${id}`, {
          assigned_divisi: editDivisi,
          admin_nama: admin?.nama || "admin",
        });

        if (res.data.success) {
          pushToast({ type: "success", message: "Divisi berhasil diupdate" });
          setEditingId(null);
          setEditDivisi("");
          fetchPendaftar();
        }
      } catch (err) {
        const message = err.response?.data?.message || "Gagal update divisi";
        pushToast({ type: "error", message });
      }
    },
    [api, editDivisi, pendaftar, admin, pushToast, fetchPendaftar]
  );

  const requestDeletePendaftar = useCallback((item) => {
    setConfirmState(item);
  }, []);

  const confirmDeletePendaftar = useCallback(async () => {
    const id = confirmState?.id;
    if (!id) return;
    try {
      const res = await api.delete(`/pendaftaran/${id}`);
      if (res.data.success) {
        pushToast({ type: "success", message: "Pendaftar berhasil dihapus" });
        fetchPendaftar();
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Gagal menghapus pendaftar";
      pushToast({ type: "error", message });
    } finally {
      setConfirmState(null);
    }
  }, [api, confirmState, pushToast, fetchPendaftar]);

  const fetchAdminList = useCallback(async () => {
    setAdminLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin-pendaftaran/list`);
      if (res.data.success) {
        setAdminList(res.data.data || []);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Gagal memuat daftar admin";
      pushToast({ type: "error", message });
    } finally {
      setAdminLoading(false);
    }
  }, [pushToast]);

  const handleCreateAdmin = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newAdmin.username || !newAdmin.password || !newAdmin.nama) {
        pushToast({ type: "error", message: "Semua field wajib diisi" });
        return;
      }
      if (newAdmin.password.length < 6) {
        pushToast({ type: "error", message: "Password minimal 6 karakter" });
        return;
      }

      setCreatingAdmin(true);
      try {
        const res = await api.post("/admin-pendaftaran/create", newAdmin);
        if (res.data.success) {
          pushToast({
            type: "success",
            message: `Admin '${newAdmin.username}' berhasil dibuat`,
          });
          setNewAdmin({ username: "", password: "", nama: "" });
          setShowCreateAdmin(false);
          fetchAdminList();
        }
      } catch (err) {
        const message = err.response?.data?.message || "Gagal membuat admin";
        pushToast({ type: "error", message });
      } finally {
        setCreatingAdmin(false);
      }
    },
    [api, newAdmin, pushToast, fetchAdminList]
  );

  const handleDeleteAdmin = useCallback(
    async (id, username) => {
      if (String(admin?.id) === String(id)) {
        pushToast({
          type: "error",
          message: "Tidak bisa menghapus akun sendiri",
        });
        setConfirmDeleteAdmin(null);
        return;
      }
      try {
        const res = await api.delete(`/admin-pendaftaran/${id}`);
        if (res.data.success) {
          pushToast({
            type: "success",
            message: `Admin '${username}' berhasil dihapus`,
          });
          fetchAdminList();
        }
      } catch (err) {
        const message = err.response?.data?.message || "Gagal menghapus admin";
        pushToast({ type: "error", message });
      } finally {
        setConfirmDeleteAdmin(null);
      }
    },
    [api, admin, pushToast, fetchAdminList]
  );

  useEffect(() => {
    if (token) {
      fetchPendaftar();
    }
  }, [token, fetchPendaftar]);

  useEffect(() => {
    if (token && activeTab === "admins") {
      fetchAdminList();
    }
  }, [token, activeTab, fetchAdminList]);

  useEffect(() => {
    setPriorityPage(1);
    setExcessPage(1);
  }, [pendaftar.length]);

  useEffect(() => {
    setPriorityPage(1);
    setExcessPage(1);
  }, [searchTerm, filterStatus, filterDivisi]);

  useEffect(() => {
    if (!token) {
      fetchAdminCount();
    }
  }, [token, fetchAdminCount]);

  return {
    token,
    admin,
    username,
    setUsername,
    password,
    setPassword,
    loginLoading,
    loginError,
    seeding,
    adminCount,
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
    selectedItem,
    setSelectedItem,
    adminList,
    adminLoading,
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
    fetchPendaftar,
    fetchAdminList,
    toasts,
    dismissToast,
  };
};
