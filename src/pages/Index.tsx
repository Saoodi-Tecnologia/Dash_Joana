import React, { useState } from 'react';
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

export default function Index() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
