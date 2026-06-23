import { Lock, User, Key, Loader2, AlertCircle, UserCog } from "lucide-react";

const LoginForm = ({
  username,
  setUsername,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
  onBack,
  showSeedButton,
  seeding,
  onSeedAdmin,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-2">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Pendaftaran</h1>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  loading || !username.trim() || !password.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                }`}
                disabled={loading || !username.trim() || !password.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Login
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={onBack}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Kembali ke Halaman Utama
              </button>
            </div>

            {showSeedButton && (
              <div className="mt-4 pt-4 border-t">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-amber-800">
                    Belum ada akun admin. Klik tombol di bawah untuk membuat admin default.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSeedAdmin}
                  disabled={seeding}
                  className="w-full py-2 px-4 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  {seeding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCog className="w-4 h-4" />
                      Setup Admin Default
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
