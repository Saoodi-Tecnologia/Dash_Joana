// ============================================================
// KPICard — card de métrica reutilizável
// ============================================================
interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    accentColor?: string;
}

export function KPICard({ title, value, subtitle, trend, accentColor = '#38B3AB' }: KPICardProps) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors">
            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {trend !== undefined && (
                <div
                    className={`flex items-center gap-1 text-xs mt-2 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}
                >
                    <span>{trend >= 0 ? '▲' : '▼'}</span>
                    <span>{Math.abs(trend)}% vs mês anterior</span>
                </div>
            )}
        </div>
    );
}
