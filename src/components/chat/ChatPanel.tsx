import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types/dashboard';

// ============================================================
// ChatPanel — painel de chat do assistente Joana
// ============================================================
interface ChatPanelProps {
    messages: ChatMessage[];
    inputValue: string;
    isLoading: boolean;
    isAiTyping: boolean;
    chatEndRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    onInputChange: (value: string) => void;
    onSend: () => void;
}

export function ChatPanel({
    messages,
    inputValue,
    isLoading,
    isAiTyping,
    chatEndRef,
    onClose,
    onInputChange,
    onSend,
}: ChatPanelProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleInputFocus = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div className="absolute bottom-4 right-0 w-[94vw] sm:w-[380px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col h-[70vh] sm:h-[520px] overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-[#38B3AB] p-4 text-white flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                        <span className="font-bold text-sm">J</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm">Assistente Joana</p>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            <p className="text-[10px] opacity-90 font-medium">Online agora</p>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                             <span className="text-2xl">👋</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Olá! Como posso ajudar hoje?</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Sou a sua assistente de análise de dados. Pergunte sobre objeções, planos mais cotados ou desempenho da sua operação.
                        </p>
                    </div>
                )}
                
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role === 'user' ? (
                            <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-none text-sm shadow-sm leading-relaxed bg-[#38B3AB] text-white">
                                {m.content}
                            </div>
                        ) : (
                            <div className="bg-white text-gray-800 rounded-bl-none border border-gray-100 max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap">
                                {m.content}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-5 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Analisando</span>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38B3AB]" />
                        </div>
                    </div>
                )}
                {isAiTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-1.5 h-[42px]">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2 items-center bg-gray-50 p-1.5 pl-4 rounded-full border border-gray-200 focus-within:border-[#38B3AB] focus-within:ring-2 focus-within:ring-[#38B3AB]/10 transition-all">
                    <input
                        value={inputValue}
                        onChange={e => onInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={handleInputFocus}
                        placeholder="O que deseja saber sobre sua operação?"
                        className="flex-1 bg-transparent text-sm py-1.5 focus:outline-none min-w-0"
                    />
                    <button
                        onClick={onSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#38B3AB] rounded-full text-white hover:bg-[#2d9d96] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
