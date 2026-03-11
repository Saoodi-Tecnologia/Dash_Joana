// ============================================================
// AIInsightBanner — banner de resumo de IA por aba
// ============================================================
interface AIInsightBannerProps {
    text?: string;
    label: string;
    accentColor: string;
}

export function AIInsightBanner({ text, label, accentColor }: AIInsightBannerProps) {
    if (!text) return null;

    return (
        <div
            className="p-4 rounded-xl border-l-4 mb-4"
            style={{
                background: `color-mix(in srgb, ${accentColor} 8%, white)`,
                borderLeftColor: accentColor,
            }}
        >
            <h4 className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: accentColor }}>
                {label}
            </h4>
            <p className="text-gray-700 text-sm italic leading-relaxed">"{text}"</p>
        </div>
    );
}
