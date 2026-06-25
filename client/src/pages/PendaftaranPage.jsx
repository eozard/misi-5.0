import React, { useState } from "react";
import { UserPlus, Loader2, Upload, FileText, CheckCircle, Mail } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const DIVISI_OPTIONS = [
  "Networking",
  "Software Engineer",
  "Multimedia",
  "Artificial Intelligence",
  "Data Analyst",
];

const PendaftaranPage = () => {
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [divisi, setDivisi] = useState("");
  const [cv, setCv] = useState(null);
  const [transkrip, setTranskrip] = useState(null);
  const [suratPersetujuan, setSuratPersetujuan] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (setter) => (e) => {
    const file = e.target.files[0];
    if (file && file.type !== "application/pdf") {
      setError("Hanya file PDF yang diperbolehkan");
      e.target.value = "";
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setError("Ukuran file maksimal 10MB");
      e.target.value = "";
      return;
    }
    setError("");
    setter(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nama || !nim || !divisi || !email) {
      setError("Nama, NIM, divisi, dan email wajib diisi");
      return;
    }
    if (!cv || !transkrip || !suratPersetujuan) {
      setError("Semua file PDF wajib diunggah");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nama", nama);
      formData.append("nim", nim);
      formData.append("divisi", divisi);
      formData.append("email", email);
      formData.append("cv", cv);
      formData.append("transkrip", transkrip);
      formData.append("surat_persetujuan", suratPersetujuan);

      await axios.post(`${API_URL}/pendaftaran`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
    } catch (err) {
      const message = err.response?.data?.message || "Gagal mengirim pendaftaran";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background with gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-md w-full text-center px-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Data pendaftaran kamu telah berhasil dikirim. Silakan tunggu informasi selanjutnya yang akan dikirimkan melalui email.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Kembali ke Halaman Utama
            </a>
          </div>
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 fixed">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl w-full px-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Pendaftaran PKL</h1>
            <p className="text-white/80">Lengkapi formulir di bawah ini dengan data yang benar</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-3">
                <div className="mt-0.5 font-bold">!</div>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200"
                    placeholder="Masukkan nama lengkap"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    NIM / NISN
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200"
                    placeholder="Masukkan NIM/NISN"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200"
                    placeholder="contoh@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pilih Divisi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIVISI_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center px-4 py-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        divisi === option
                          ? "border-blue-500 bg-blue-50/50 shadow-sm"
                          : "border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-gray-50/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="divisi"
                        value={option}
                        checked={divisi === option}
                        onChange={(e) => setDivisi(e.target.value)}
                        disabled={loading}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                          divisi === option ? "border-blue-500" : "border-gray-300"
                        }`}
                      >
                        {divisi === option && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${divisi === option ? 'text-blue-700' : 'text-gray-700'}`}>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Upload Berkas Pendukung (PDF)</h3>
                
                <div>
                  <div className="flex items-center border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer relative overflow-hidden">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange(setCv)}
                      disabled={loading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mr-4 transition-colors">
                      <Upload className={`w-5 h-5 ${cv ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${cv ? 'text-blue-700' : 'text-gray-700'}`}>
                        {cv ? cv.name : "Upload Curriculum Vitae (CV)"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Maks. 10MB (Format PDF)</p>
                    </div>
                    {cv && <CheckCircle className="w-5 h-5 text-emerald-500 ml-2" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-center border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer relative overflow-hidden">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange(setTranskrip)}
                      disabled={loading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mr-4 transition-colors">
                      <Upload className={`w-5 h-5 ${transkrip ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${transkrip ? 'text-blue-700' : 'text-gray-700'}`}>
                        {transkrip ? transkrip.name : "Upload Transkrip Nilai"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Maks. 10MB (Format PDF)</p>
                    </div>
                    {transkrip && <CheckCircle className="w-5 h-5 text-emerald-500 ml-2" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-center border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer relative overflow-hidden">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange(setSuratPersetujuan)}
                      disabled={loading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mr-4 transition-colors">
                      <Upload className={`w-5 h-5 ${suratPersetujuan ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${suratPersetujuan ? 'text-blue-700' : 'text-gray-700'}`}>
                        {suratPersetujuan ? suratPersetujuan.name : "Upload Surat Persetujuan Sekolah/kampus"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Maks. 10MB (Format PDF)</p>
                    </div>
                    {suratPersetujuan && <CheckCircle className="w-5 h-5 text-emerald-500 ml-2" />}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100">
                <button
                  type="submit"
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Kirim Pendaftaran
                    </>
                  )}
                </button>
                <div className="mt-4 text-center">
                  <a href="/" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                    ← Kembali ke Halaman Utama
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
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

export default PendaftaranPage;
