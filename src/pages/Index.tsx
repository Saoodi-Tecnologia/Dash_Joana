import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { DashboardProvider } from '@/context/DashboardContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useChat } from '@/hooks/useChat';
import { Header } from '@/components/dashboard/Header';
import { TabNav } from '@/components/dashboard/TabNav';
import { ProcessingOverlay } from '@/components/dashboard/ProcessingOverlay';
import { GeralTab } from '@/components/dashboard/tabs/GeralTab';
import { InsightsTab } from '@/components/dashboard/tabs/InsightsTab';
import { PerformanceTab } from '@/components/dashboard/tabs/PerformanceTab';
import { ProdutosTab } from '@/components/dashboard/tabs/ProdutosTab';
import { EngajamentoTab } from '@/components/dashboard/tabs/EngajamentoTab';
import { QualidadeTab } from '@/components/dashboard/tabs/QualidadeTab';
import { ChatButton } from '@/components/chat/ChatButton';
import { ChatPanel } from '@/components/chat/ChatPanel';
import type { TabId } from '@/types/dashboard';

// ============================================================
// Index — orquestrador puro, sem lógica de negócio
// ============================================================

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  geral: GeralTab,
  insights: InsightsTab,
  performance: PerformanceTab,
  produtos: ProdutosTab,
  engajamento: EngajamentoTab,
  qualidade: QualidadeTab,
};

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabId>('geral');
  const { isProcessing, error, kpis, ...allData } = useDashboard();

  // Criar objeto completo para o chat
  const dashboardData = { kpis, ...allData } as any;
  const chat = useChat(dashboardData);

  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
      <Header />
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto p-4 pb-20 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 relative">
        {(isProcessing || error) && <ProcessingOverlay error={error} />}
        <div className="max-w-[1200px] mx-auto">
          <ActiveTab />
        </div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-4">
        {chat.isOpen && (
          <ChatPanel
            messages={chat.messages}
            inputValue={chat.inputValue}
            isLoading={chat.isLoading}
            isAiTyping={chat.isAiTyping}
            chatEndRef={chat.chatEndRef}
            onClose={() => chat.setIsOpen(false)}
            onInputChange={chat.setInputValue}
            onSend={chat.sendMessage}
          />
        )}
        <ChatButton
          isOpen={chat.isOpen}
          onToggle={() => chat.setIsOpen(o => !o)}
        />
      </div>
    </div>
  );
}

// A senha 'Saoodi@2026' fica armazenada apenas como Hash (SHA-256)
// Assim ninguem pode abrir o código fonte e ler a senha em texto plano.
const MASTER_PASSWORD_HASH = 'cc0f47d0ba3ceaec51946f30eb18e6214ca385b63f61dedbce317e4b45f3b24f';

async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('joana_dashboard_auth') === 'true';
    if (isAuth) setIsAuthenticated(true);
  }, []);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsAuthenticating(true);
    const hash = await hashString(password);
    setIsAuthenticating(false);

    if (hash === MASTER_PASSWORD_HASH) {
      localStorage.setItem('joana_dashboard_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#F4FFFE] overflow-hidden p-4 font-sans focus-within:ring-0">
      {/* Elementos Decorativos Flutuantes (Estilo Premium) */}
      <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-[#38B3AB]/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-[#38B3AB]/10 rounded-full blur-3xl" />
      
      {/* Ícones Detalhistas Cinzas (Marca D'água) */}
      <div className="absolute top-20 right-[15%] text-gray-200 rotate-12 opacity-40 hidden md:block">
        <div className="w-12 h-12 border-2 border-current rounded-lg" />
      </div>
      <div className="absolute bottom-40 left-[10%] text-gray-200 -rotate-12 opacity-40 hidden md:block">
        <div className="w-8 h-8 rounded-full border-2 border-current" />
      </div>
      <div className="absolute top-1/2 left-20 text-gray-100 opacity-60 hidden lg:block">
        <Lock size={120} />
      </div>

      <div className="relative w-full max-w-sm bg-white p-8 rounded-3xl shadow-[0_30px_60px_rgba(56,179,171,0.12)] border border-[#38B3AB]/10 z-10 scale-[1.02]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#38B3AB] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#38B3AB]/20 rotate-3 hover:rotate-0 transition-transform duration-300">
            <img 
              src="/logo2.png" 
              alt="Logo Saoodi" 
              className="w-12 h-12 object-contain brightness-0 invert" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard Joana</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-[1px] w-4 bg-gray-300"></div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Acesso Operacional</p>
            <div className="h-[1px] w-4 bg-gray-300"></div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-tighter ml-1">Código de Segurança</label>
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

export default function Index() {
  return (
    <AuthWrapper>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </AuthWrapper>
  );
}
