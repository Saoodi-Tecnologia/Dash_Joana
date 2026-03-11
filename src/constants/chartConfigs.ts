import type { ChartConfig } from '@/components/ui/chart';

export const volumeConversasConfig: ChartConfig = {
    conversas: { label: 'Conversas', color: '#FB923C' },
};

export const planosConfig: ChartConfig = {
    empresarial: { label: 'Empresarial', color: '#38B3AB' },
    familiar: { label: 'Individual/Familiar', color: '#FB923C' },
};

export const faixasEtariasConfig: ChartConfig = {
    quantidade: { label: 'Pessoas', color: '#155DFC' },
};

export const conversaoConfig: ChartConfig = {
    conversoes: { label: 'Conversões', color: '#22C55E' },
    abandono: { label: 'Abandonos', color: '#ef4444' },
};

export const CHART_COLORS = {
    primary: '#38B3AB',
    secondary: '#FB923C',
    blue: '#155DFC',
    green: '#22C55E',
    red: '#ef4444',
} as const;

export const TABS = [
    { id: 'geral', label: 'Geral' },
    { id: 'insights', label: 'Insights' },
    { id: 'performance', label: 'Performance' },
    { id: 'engajamento', label: 'Engajamento' },
    { id: 'produtos', label: 'Produtos' },
    { id: 'qualidade', label: 'Qualidade' },
] as const;
