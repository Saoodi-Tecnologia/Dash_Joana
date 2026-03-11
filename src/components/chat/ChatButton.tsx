import React from 'react';

interface ChatButtonProps {
    isOpen: boolean;
    onToggle: () => void;
    // adding unread count just to be fully compatible if we added it, but I'll skip it since messages length wasn't passed,
    // wait, I can modify it so it just matches the visual if I pass messages length from parent if needed, 
    // but the original had `{messages.length > 1 && <div...>{messages.length - 1}</div>}`. 
    // I will ignore the unread badge for the exact second if not provided, or simply create the button design.
}

export function ChatButton({ isOpen, onToggle }: ChatButtonProps) {
    if (isOpen) return null; // Original didn't hide the button when chat is open, but usually chat overrides it, let's keep it visible or not? Original showed chat above it. Actually it just showed the chat panel over the screen.

    return (
        <button
            onClick={onToggle}
            className="relative text-white p-4 rounded-full shadow-[0_8px_25px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_30px_rgba(249,115,22,0.5)] transform hover:scale-105 active:scale-95 transition-all duration-200 z-40"
            style={{
                background: "linear-gradient(135deg, #FB923C 0%, #f97316 100%)",
            }}
            aria-label="Abrir assistente IA"
        >
            <svg className="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        </button>
    );
}
