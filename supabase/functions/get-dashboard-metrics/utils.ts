export type GranularidadeGrupo = 'dia' | 'semana' | 'mes';

export function getGranularidade(totalDias: number): GranularidadeGrupo {
    if (totalDias <= 14) return 'dia';
    if (totalDias <= 60) return 'semana';
    return 'mes';
}

export function getDayKey(date: Date, granularidade: GranularidadeGrupo): string {
    const dia = date.getDate();
    const mes = date.getMonth() + 1;
    const ano = date.getFullYear();

    if (granularidade === 'dia') {
        return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
    }
    if (granularidade === 'semana') {
        const semNr = Math.ceil(dia / 7);
        const mesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][mes - 1];
        return `S${semNr} ${mesAbrev}`;
    }
    
    const mesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][mes - 1];
    return `${mesAbrev}/${String(ano).slice(2)}`;
}

export function sortDayKeys(a: string, b: string, granularidade: GranularidadeGrupo): number {
    if (granularidade === 'dia') {
        const [da, ma] = a.split('/').map(Number);
        const [db, mb] = b.split('/').map(Number);
        return (ma * 100 + da) - (mb * 100 + db);
    }
    if (granularidade === 'semana') {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const parseWeek = (s: string) => {
            const [sw, sm] = s.split(' ');
            return meses.indexOf(sm) * 10 + parseInt(sw.replace('S', ''));
        };
        return parseWeek(a) - parseWeek(b);
    }
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const parseMes = (s: string) => {
        const [sm, sy] = s.split('/');
        return parseInt(sy) * 12 + meses.indexOf(sm);
    };
    return parseMes(a) - parseMes(b);
}

export function calcTrend(atual: number, anterior: number): number | null {
    if (anterior === 0) return null;
    return Number((((atual - anterior) / anterior) * 100).toFixed(1));
}

export function getMostRecentMonday(): number {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}
