/*
 * Modern Login Page - Redesigned with professional UI/UX
 * Features: Glassmorphism design, password visibility toggle, smooth animations
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import axiosInstance from "../utils/axios";
import { getDeviceIdSync } from "../utils/fingerprint";

const LoginPage = () => {
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

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

        console.log("✅ Login berhasil:", {
          nama: response.data.user.nama,
          role: response.data.user.role,
        });

        // Delay for showing success message
        setTimeout(() => {
          if (response.data.user.role === "admin") {
            navigate("/admin");
          } else if (response.data.user.role === "mentor") {
            navigate("/mentor");
          } else {
            navigate("/dashboard");
          }
        }, 800);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Terjadi kesalahan saat login";
      setError(message);
      console.error("Login error:", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Info */}
          <div className="hidden lg:block text-white space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">Sistem Absensi PKL</span>
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Selamat Datang di{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Sistem Absensi
              </span>
            </h1>

            <p className="text-lg text-white/80 leading-relaxed">
              Platform manajemen absensi PKL yang terintegrasi dengan sistem
              pendaftaran. Kemudahan dalam mengelola kehadiran, izin, dan
              logbook harian.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">500+</p>
                  <p className="text-xs text-white/60">Pengguna</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-xs text-white/60">Aktif</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-xs text-white/60">Aman</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                  <LogIn className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Selamat Datang</h2>
                <p className="text-white/80 text-sm mt-1">
                  Silakan login untuk melanjutkan
                </p>
              </div>

              {/* Form */}
              <div className="p-8">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm text-emerald-700">{success}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Nama Field */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Pengguna
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 ease-in-out ${
                          focusedField === "nama"
                            ? "border-blue-500 bg-white ring-4 ring-blue-500/10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        placeholder="Masukkan nama Anda"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        onFocus={() => setFocusedField("nama")}
                        onBlur={() => setFocusedField(null)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Shield className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 ease-in-out ${
                          focusedField === "password"
                            ? "border-blue-500 bg-white ring-4 ring-blue-500/10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        placeholder="Masukkan kata sandi"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Butuh bantuan?</p>
                      <p className="mt-1">
                        Hubungi admin atau gunakan password bypass untuk akses
                        darurat.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !nama.trim() || !password.trim()}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                      loading || !nama.trim() || !password.trim()
                        ? "bg-gray-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Masuk</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Sistem Absensi PKL. All rights
                    reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for custom animations and styling */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
