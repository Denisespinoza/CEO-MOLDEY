import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Factory, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setSuccess('Cuenta creada. Ya puedes iniciar sesión.');
        setMode('login');
      }
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-carbon-900 to-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-600 rounded-2xl mb-4 shadow-lg shadow-gold-600/30">
            <Factory size={32} className="text-navy-900" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CEO MOLDEY</h1>
          <p className="text-gold-400/70 mt-1 text-sm">Acceso al Centro de Operaciones</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 space-y-4 border border-gold-500/15 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">
              {success}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-carbon-300 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-carbon-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-400 transition-all"
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-carbon-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-400 transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-carbon-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-400 transition-all pr-10"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-carbon-400 hover:text-carbon-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-navy-900 rounded-lg font-bold transition-colors text-sm shadow-lg shadow-gold-600/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {mode === 'login' ? 'Iniciando...' : 'Creando cuenta...'}
              </>
            ) : (
              mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-gold-400 hover:text-gold-300 text-sm"
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Crear una'
                : '¿Ya tienes cuenta? Iniciar sesión'}
            </button>
          </div>
        </form>

        <p className="text-center text-carbon-600 text-xs mt-4">
          Solo personal autorizado · Moldey
        </p>
      </div>
    </div>
  );
}
