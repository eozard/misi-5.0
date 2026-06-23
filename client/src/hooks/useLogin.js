import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { getDeviceIdSync } from "../utils/fingerprint";
import { useToast } from "./useToast";

/**
 * Custom hook untuk mengelola logic halaman Login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  // Form state
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Basic validation
    if (!nama.trim() || !password.trim()) {
      setError("Nama dan password wajib diisi");
      setLoading(false);
      return;
    }

    try {
      const deviceId = getDeviceIdSync();

      const response = await axiosInstance.post("/login", {
        nama: nama.trim(),
        password,
        deviceId,
      });

      if (response.data.success) {
        setSuccess("Login berhasil! Mengalihkan...");

        // Save token and user
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        pushToast({
          type: "success",
          message: `Selamat datang, ${response.data.user.nama}!`,
        });

        // Delay for showing success message
        setTimeout(() => {
          if (response.data.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 800);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Terjadi kesalahan saat login";
      setError(message);
      pushToast({
        type: "error",
        message: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    // Form state
    nama,
    setNama,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    
    // UI state
    loading,
    error,
    success,
    focusedField,
    setFocusedField,
    
    // Actions
    handleLogin,
  };
};
