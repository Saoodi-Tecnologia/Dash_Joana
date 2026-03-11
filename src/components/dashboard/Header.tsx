import React, { useState } from 'react';
import { RefreshCw, Calendar, ChevronDown } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import type { SelectedPeriod } from '@/types/dashboard';

// ============================================================
// Header — Cabeçalho do Dashboard com seletor de período
// ============================================================

type PresetKey = '7d' | '30d' | '90d' | 'month' | 'custom';

interface PresetOption {
    key: PresetKey;
    label: string;
}

const PRESETS: PresetOption[] = [
    { key: '7d', label: 'Últimos 7 dias' },
    { key: '30d', label: 'Últimos 30 dias' },
    { key: '90d', label: 'Últimos 90 dias' },
    { key: 'month', label: 'Este mês' },
];

function buildPeriod(preset: PresetKey, customStart?: Date, customEnd?: Date): SelectedPeriod {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (preset === '7d') {
        const start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { preset, startDate: start, endDate: end };
    }
    if (preset === '30d') {
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { preset, startDate: start, endDate: end };
    }
    if (preset === '90d') {
        const start = new Date();
        start.setDate(start.getDate() - 89);
        start.setHours(0, 0, 0, 0);
        return { preset, startDate: start, endDate: end };
    }
    if (preset === 'month') {
        const start = new Date(end.getFullYear(), end.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return { preset, startDate: start, endDate: end };
    }
    // custom
    return {
        preset: 'custom',
        startDate: customStart ?? new Date(),
        endDate: customEnd ?? end
    };
}

function formatDate(d: Date) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function Header() {
    const { reload, lastUpdated, isProcessing, selectedPeriod, setSelectedPeriod } = useDashboard();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const formatLastUpdated = (isoString: string | null) => {
        if (!isoString) return 'Carregando...';
        const d = new Date(isoString);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' de ' + d.toLocaleDateString('pt-BR');
    };

    const currentPresetLabel = selectedPeriod.preset === 'custom'
        ? `${formatDate(selectedPeriod.startDate)} - ${formatDate(selectedPeriod.endDate)}`
        : PRESETS.find(p => p.key === selectedPeriod.preset)?.label ?? 'Período';

    const handleSelectPreset = (preset: PresetKey) => {
        if (preset === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        setDropdownOpen(false);
        setSelectedPeriod(buildPeriod(preset));
    };

    const handleApplyCustom = () => {
        if (!customStart || !customEnd) return;
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        setDropdownOpen(false);
        setShowCustom(false);
        setSelectedPeriod(buildPeriod('custom', start, end));
    };

    return (
        <div
            className="text-white p-4 shadow-lg sticky top-0 z-40 flex items-center justify-between"
            style={{ background: "linear-gradient(to right, #38B3AB, #2a9890)" }}
        >
            <div>
                <h1 className="text-xl font-bold">Dashboard Joana</h1>
                <p className="text-sm opacity-90">Agente IA - Saoodi</p>
            </div>

            <div className="flex items-center gap-3 text-sm">
                {/* Seletor de período */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full font-medium"
                    >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">{currentPresetLabel}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            {PRESETS.map(preset => (
                                <button
                                    key={preset.key}
                                    onClick={() => handleSelectPreset(preset.key)}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${selectedPeriod.preset === preset.key ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700'}`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            <button
                                onClick={() => handleSelectPreset('custom')}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 border-t border-gray-100 ${selectedPeriod.preset === 'custom' ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700'}`}
                            >
                                Personalizado...
                            </button>

                            {showCustom && (
                                <div className="px-4 py-3 border-t border-gray-100 space-y-2 bg-gray-50">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">De</label>
                                        <input
                                            type="date"
                                            value={customStart}
                                            onChange={e => setCustomStart(e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Até</label>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={e => setCustomEnd(e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyCustom}
                                        className="w-full bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {lastUpdated && (
                    <span className="opacity-90 hidden md:inline-block">
                        Atualizado às: {formatLastUpdated(lastUpdated)}
                    </span>
                )}

                <button
                    onClick={() => reload(true)}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full font-medium ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Forçar Reavaliação Inteligente da IA"
                >
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Atualizar</span>
                </button>
            </div>

            {/* Fecha dropdown ao clicar fora */}
            {dropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(false); setShowCustom(false); }} />
            )}
        </div>
    );
}
