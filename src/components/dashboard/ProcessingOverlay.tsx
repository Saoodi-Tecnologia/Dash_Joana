import { Loader2 } from 'lucide-react';

// ============================================================
// ProcessingOverlay — overlay de carregamento de dados
// ============================================================
interface ProcessingOverlayProps {
    error?: string | null;
}

export function ProcessingOverlay({ error }: ProcessingOverlayProps) {
    return (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
            {error ? (
                <>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-500 text-2xl font-bold">!</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Erro ao carregar dados</h2>
                    <p className="text-sm text-gray-500 max-w-xs text-center">{error}</p>
                </>
            ) : (
                <>
                    <Loader2 className="w-12 h-12 text-[#38B3AB] animate-spin" />
                    <h2 className="text-lg font-bold text-gray-800">Processando Dados...</h2>
                    <p className="text-sm text-gray-500">Sincronizando com Supabase e Gemini</p>
                </>
            )}
        </div>
    );
}
