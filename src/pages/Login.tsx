import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// A senha 'Saoodi@2026' fica armazenada apenas como Hash (SHA-256)
// Assim ninguem pode abrir o código fonte e ler a senha em texto plano.
const MASTER_PASSWORD_HASH = 'cc0f47d0ba3ceaec51946f30eb18e6214ca385b63f61dedbce317e4b45f3b24f';

async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem('joana_dashboard_auth') === 'true';
    if (isAuth) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsAuthenticating(true);
    const hash = await hashString(password);
    setIsAuthenticating(false);

    if (hash === MASTER_PASSWORD_HASH) {
      localStorage.setItem('joana_dashboard_auth', 'true');
      setError(false);
      navigate('/', { replace: true });
    } else {
      setError(true);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#F4FFFE] overflow-hidden p-4 font-sans focus-within:ring-0">
      <div className="relative w-full max-w-sm bg-white p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(56,179,171,0.15)] border border-[#38B3AB]/10 z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#38B3AB] rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-[#38B3AB]/20 transition-transform duration-300">
            <img 
              src="/logo2.png" 
              alt="Logo Saoodi" 
              className="w-12 h-12 object-contain brightness-0 invert" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-publica">Dashboard Joana</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-[1px] w-4 bg-gray-300"></div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest font-publica">Acesso Operacional</p>
            <div className="h-[1px] w-4 bg-gray-300"></div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-tighter ml-1">Código de Segurança</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-5 pr-12 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#38B3AB]/10 focus:bg-white focus:border-[#38B3AB] transition-all duration-300"
                placeholder="••••••••"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#38B3AB] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-3 animate-shake">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                <p className="text-red-500 text-[10px] font-bold uppercase">Senha incorreta</p>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-[#38B3AB] hover:bg-[#2d9d96] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-[#38B3AB]/20 active:scale-95 flex items-center justify-center gap-2 group overflow-hidden relative"
          >
            <span className="relative z-10 uppercase tracking-widest text-xs">
              {isAuthenticating ? 'Validando...' : 'Entrar no Sistema'}
            </span>
            {!isAuthenticating && (
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            )}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">
        © {new Date().getFullYear()} Saoodi Tecnologia
      </p>
    </div>
  );
}
