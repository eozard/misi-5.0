/*
 * Landing page PKL BPTI.
 * Halaman awal aplikasi: pengguna memilih untuk mendaftar, absen, atau masuk
 * sebagai admin pendaftaran.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn, Building2, UserCog, ChevronRight } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

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

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-6 shadow-2xl relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <Building2 className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            PKL BPTI
          </h1>
          <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto">
            Praktik Kerja Lapangan - Balai Pelatihan Teknologi Informasi
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              Selamat Datang
            </h2>
            <p className="text-blue-100/80">
              Silakan pilih portal layanan di bawah ini
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daftar Button */}
            <button
              type="button"
              onClick={() => navigate("/pendaftaran")}
              className="group relative flex flex-col items-center justify-center p-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-300">
                <UserPlus className="w-8 h-8 text-emerald-300 group-hover:text-white" />
              </div>
              <span className="text-xl font-bold text-white mb-2">Daftar</span>
              <span className="text-sm text-blue-100/70 text-center mb-4">
                Pendaftaran peserta PKL baru
              </span>
              <div className="mt-auto flex items-center text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                Masuk Portal <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            {/* Absen Button */}
            <button
              type="button"
              onClick={() => navigate("/absen")}
              className="group relative flex flex-col items-center justify-center p-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-300">
                <LogIn className="w-8 h-8 text-blue-300 group-hover:text-white" />
              </div>
              <span className="text-xl font-bold text-white mb-2">Absen</span>
              <span className="text-sm text-blue-100/70 text-center mb-4">
                Login untuk absensi harian
              </span>
              <div className="mt-auto flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                Masuk Portal <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            {/* Admin Button */}
            <button
              type="button"
              onClick={() => navigate("/admin_pendaftaran")}
              className="group relative flex flex-col items-center justify-center p-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-500 transition-all duration-300">
                <UserCog className="w-8 h-8 text-purple-300 group-hover:text-white" />
              </div>
              <span className="text-xl font-bold text-white mb-2 text-center">
                Admin
              </span>
              <span className="text-sm text-blue-100/70 text-center mb-4">
                Kelola pendaftar & divisi
              </span>
              <div className="mt-auto flex items-center text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                Masuk Portal <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-white/50 mt-8 font-medium">
          &copy; {new Date().getFullYear()} PKL BPTI. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
