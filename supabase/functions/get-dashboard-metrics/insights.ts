import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiService } from "./gemini.ts";
import { getRawMessages } from "./fetcher.ts";
import { processMessages } from "./processor.ts";

// Retorna o intervalo seg 00:00 UTC a dom 23:59 UTC da SEMANA ANTERIOR
function getPreviousCalendarWeek(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0=Dom, 1=Seg ... 6=Sab
    const daysFromMonday = utcDay === 0 ? 6 : utcDay - 1;

    // Esta segunda-feira 00:00 UTC
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - daysFromMonday);
    thisMonday.setUTCHours(0, 0, 0, 0);

    // Semana anterior: segunda anterior
    const prevMonday = new Date(thisMonday);
    prevMonday.setUTCDate(thisMonday.getUTCDate() - 7);

    // Domingo anterior (= esta segunda - 1ms)
    const prevSunday = new Date(thisMonday.getTime() - 1);

    return { startDate: prevMonday, endDate: prevSunday };
}

// Verifica se ja existe um insight para a semana dada (tolerancia de 1 dia)
function weekAlreadyExists(history: any[], startDate: Date): boolean {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return history.some((h: any) => {
        const hStart = h.periodoInicio ?? 0;
        return Math.abs(hStart - startDate.getTime()) < ONE_DAY_MS;
    });
}

// ============================================================
// BUILDERS DE DOSSIE E PROMPTS (funcoes puras e testaveis)
// ============================================================

interface SessionTranscript {
    lines: string[];
    isAbandono: boolean;
    humanLines: string[];
}

function buildSessionTranscripts(weekMessages: any[]): Record<string, SessionTranscript> {
    const transcripts: Record<string, SessionTranscript> = {};

    weekMessages.forEach(msg => {
        const sid = msg.session_id;
        if (!transcripts[sid]) {
            transcripts[sid] = { lines: [], isAbandono: true, humanLines: [] };
        }
        if (msg.conversation_status === 'resolved' || msg.atendimento_tipo === 'venda_confirmada') {
            transcripts[sid].isAbandono = false;
        }
        const texto = (msg.content || '').trim();
        if (texto.length === 0) return;

        const quem = msg.is_ia ? 'Joana' : 'Cliente';
        transcripts[sid].lines.push(`[${quem}]: ${texto}`);
        if (!msg.is_ia) transcripts[sid].humanLines.push(texto);
    });

    return transcripts;
}

export function buildDossie(
    weekMetrics: any,
    sessionTranscripts: Record<string, SessionTranscript>,
    periodoStr: string
): string {
    const kpis = weekMetrics.kpis;
    const perf = weekMetrics.performance.kpis;
    const prod = weekMetrics.produtosData.kpis;
    const eng = weekMetrics.engajamentoData.kpis;
    const funnel = weekMetrics.performance.abandonoEtapa;

    const topFaqs = weekMetrics.qualidadeData.perguntasFrequentes
        .sort((a: any, b: any) => b.frequencia - a.frequencia)
        .slice(0, 5)
        .map((f: any) => `${f.pergunta}: ${f.frequencia} conversas (exemplos: "${f.exemplos.slice(0, 2).join('"; "')}")`)
        .join('\n');

    // 8 dialogos reais (priorizando abandonos para dar mais voz ao fracasso)
    const amostrasTexto = Object.values(sessionTranscripts)
        .filter(s => s.lines.length >= 4)
        .sort((a, b) => (b.isAbandono ? 1 : 0) - (a.isAbandono ? 1 : 0))
        .slice(0, 8)
        .map(s => `--- DIALOGO (${s.isAbandono ? 'Abandonado' : 'Sucesso'}) ---\n${s.lines.join('\n')}`)
        .join('\n\n');

    // Frases verbatim dos clientes que abandonaram (voz real — insumo de copywriting)
    const frasesVerbatimAbandono = Object.values(sessionTranscripts)
        .filter(s => s.isAbandono && s.humanLines.length > 0)
        .flatMap(s => s.humanLines)
        .map(f => f.trim())
        .filter(f => f.length >= 10 && f.length <= 180)
        .slice(0, 20)
        .map((f, i) => `${i + 1}. "${f}"`)
        .join('\n');

    return `
MERCADO: Salvador/BA — Planos de saude (Unimed, Hapvida, SulAmerica, outros)
PERIODO ANALISADO: ${periodoStr}

KPIS GERAIS:
- Total de conversas (leads): ${kpis.totalConversas}
- Taxa de conversao (fechamento): ${kpis.taxaConversao}%
- Ticket medio geral: R$ ${kpis.ticketMedio.toFixed(2)}
- Tempo medio de conversa: ${kpis.tempoMedio.toFixed(1)} min

FUNIL DE VENDAS:
- Abandono na etapa Cotacao: ${funnel.find((f: any) => f.etapa === 'Cotacao')?.abandonos ?? 0} leads perdidos
- Abandono na etapa Interesse: ${funnel.find((f: any) => f.etapa === 'Interesse')?.abandonos ?? 0} leads perdidos
- Taxa de abandono geral: ${perf.taxaAbandono}%
- Tempo medio ate fechamento: ${perf.tempoFechamento.toFixed(1)} min

PRODUTOS COTADOS:
- Ticket Empresarial medio: R$ ${prod.ticketEmpresarial.toFixed(2)} | Media de vidas: ${prod.mediaVidasEmp}
- Ticket Familiar medio: R$ ${prod.ticketFamiliar.toFixed(2)} | Media de vidas: ${prod.mediaVidasFam}

ENGAJAMENTO:
- Mensagens por conversa: ${eng.mensagensConversa}
- Clientes que retornaram: ${eng.clientesRetorno} (taxa ${eng.taxaRetorno}%)
- Sessoes longas (>20 msgs): ${eng.sessoesLongasCount}

PERGUNTAS/OBJECOES MAIS FREQUENTES DA SEMANA:
${topFaqs}

FRASES VERBATIM DOS CLIENTES QUE ABANDONARAM (voz real — use como materia-prima de copy):
${frasesVerbatimAbandono || 'Sem dados suficientes esta semana.'}

DIALOGOS REAIS DOS CLIENTES (prova documental):
${amostrasTexto}
`.trim();
}

export function buildPromptNegocio(dossie: string): string {
    return `Voce e um Diretor Comercial senior especializado em analise de operacoes de vendas pelo WhatsApp. Seu papel e identificar gargalos operacionais, padroes de comportamento de compra e recomendar acoes taticas internas para a equipe de vendas. Voce analisa dados com rigor, escreve em portugues formal e nunca usa emojis. Seus relatorios sao objetivos, densos em significado e baseados exclusivamente em evidencias dos dados fornecidos.

REGRA CRITICA: Voce so pode afirmar o que esta explicitamente nos dados abaixo. Se nao ha evidencia numerica ou textual direta, declare "SEM EVIDENCIA DIRETA" no campo correspondente. Nao interpole, nao invente tendencias.

DADOS DA OPERACAO COMERCIAL:
${dossie}

Retorne APENAS este JSON valido sem markdown:
{
  "impactoFinanceiro": "Calcule o dinheiro deixado na mesa esta semana usando os dados do dossie: multiplique o numero de leads que abandonaram pelo ticket medio informado. Apresente o resultado em reais e contextualize: qual etapa concentrou a maior perda e o que isso representa para o mes se a tendencia continuar. Maximo 60 palavras.",
  "perfilDoLead": "texto ate 60 palavras. Qual o perfil comportamental dominante dos leads desta semana cruzando produtos, faixas e engajamento.",
  "objecaoPredominante": "texto ate 50 palavras. A objecao mais recorrente antes do abandono. Obrigatorio: cite o numero exato de leads afetados conforme consta no dossie. Ex: 'X leads mencionaram coparticipacao antes de abandonar.'",
  "comportamentoDeAbandono": "texto ate 60 palavras. Em que momento e contexto os leads desaparecem. Padrao de fuga identificado com base nas transcricoes.",
  "acaoImediata": "O que a equipe faz HOJE para parar a maior perda identificada. Uma acao especifica e executavel ate o fim do dia. Maximo 45 palavras. Seja cirurgico: nao sugira 'treinamento' ou 'reuniao', sugira uma acao de impacto direto na conversa com o lead.",
  "ajusteDeProcesso": "O que ajustar no processo ou na abordagem ATE O FIM DA SEMANA. Uma mudanca estrutural de medio prazo que ataca a raiz do problema identificado. Pode ser no script da Joana, no fluxo de cotacao ou na comunicacao previa ao contato. Maximo 45 palavras.",
  "evidenciasReais": ["Cite LITERALMENTE de 2 a 3 frases do campo DIALOGOS REAIS ou FRASES VERBATIM fornecidos acima, entre aspas duplas, que provem a objecao ou barreira identificada. Use a voz literal do cliente. Se nao houver trecho direto aplicavel, retorne uma lista com uma unica string: 'SEM EVIDENCIA DIRETA'."]
}`;
}

export function buildPromptMarketing(dossie: string): string {
    return `Voce e um Copywriter Sênior com 12 anos de experiencia em anúncios de planos de saude no Brasil. Voce escreve textos que vendem — nao relatorios. Voce nunca usa emojis, nunca usa linguagem corporativa e nunca revela ao publico os dados internos da operacao.

COMO VOCE TRABALHA:
Voce recebe dados operacionais de vendas (dossie de inteligencia) e usa esses dados APENAS como insumo para entender a dor, o perfil e o comportamento do cliente. Com base nessa leitura, voce cria copies ORIGINAIS que conectam emocionalmente com quem vai ler. Voce NAO cola dados do dossie no anuncio. Voce NAO menciona a cidade ou regiao. Voce NAO revela numeros internos de conversas ou leads. Voce transforma insight em narrativa.

ANALOGIA: Um planejador de marketing que acabou de ler uma pesquisa de mercado nao vai ao ar dizendo "nossa pesquisa mostrou que 37 clientes..." — ele absorve os insights e cria uma campanha que fala com a dor identificada. E exatamente isso que voce faz.

REGRAS INVIOLAVEIS:
- NUNCA mencione cidade, estado ou regiao no texto da copy.
- NUNCA revele dados internos (numero de leads, conversas, taxas, sessoes).
- NUNCA use saudacoes como "Ola! Vi que você se interessou em..." — isso é spam, nao publicidade.
- NUNCA use frases genericas do tipo "cuide da sua saude", "seu bem-estar e prioridade", "plano de qualidade".
- Os dados do dossie sao para voce entender o CENARIO, nao para transcrever na copy.

EXEMPLOS DO QUE NAO FAZER vs O QUE FAZER:

[ERRADO]: "37 pessoas buscaram plano de saude pelo WhatsApp essa semana em Salvador."
[CERTO]: "Voce sabe exatamente o que o seu plano cobre — ou so vai descobrir na hora que precisar?"

[ERRADO]: "A objecao mais recorrente foi coparticipacao com 83 conversas."
[CERTO]: "Mensalidade baixa com taxa em cima de cada consulta, ou mensalidade justa sem susto no fim do mes?"

EXEMPLOS DE METODO (use a ESTRUTURA, adapte o conteudo para a realidade dos dados do dossie):

[Metodo Curiosidade / Inimigo Comum]
"O plano mais barato do comparador pode ser o mais caro na pratica. Entenda por que antes de assinar."

[Metodo PAS — Problema, Agitacao, Solucao]
"Descobrir que seu plano nao cobre o que voce precisava sempre acontece tarde demais. Nao deixe isso te pegar de surpresa. Compare coberturas em 5 minutos pelo WhatsApp."

[Metodo AIDA — Atencao, Interesse, Desejo, Acao]
"Essa é a diferenca entre o plano que parece bom e o plano que é bom.
Um tem taxa em cima de cada consulta. O outro, nao.
Muita gente so descobre essa diferenca quando vai usar.
Faz sentido entender isso antes, certo? Fala com a gente."

[Copy Feed — Estrutura Dado+Dor+CTA]
"Mensalidade é o que voce ve. Taxa por consulta é o que voce sente.
A diferenca pode ser de centenas de reais por ano — e quase ninguem explica isso na hora da contratacao.
Quer saber qual plano faz mais sentido pro seu caso? Chama no WhatsApp."

DADOS DA OPERACAO ESTA SEMANA (use como insumo de leitura, nao como fonte de transcricao):
${dossie}

Retorne APENAS este JSON valido sem markdown:
{
  "gancho1": "Metodo Curiosidade/Inimigo Comum: headline que gera duvida ou expoe o inimigo oculto do cliente sem revelar dados internos. Maximo 12 palavras.",
  "gancho2": "Metodo PAS (Problema-Agitacao-Solucao): headline que nao da a solucao, so expoe a dor. Parta da objecao identificada mas escreva pensando em quem sente essa dor, nao em quem analisou o dado. Maximo 12 palavras.",
  "gancho3": "Metodo AIDA abreviado: headline que prende pela curiosidade ou por contraste (antes/depois, parece/é). Maximo 12 palavras.",
  "copyFeed": "Metodo Dado+Dor+CTA: texto para Feed ou Carrossel. 4 a 6 linhas curtas. Linha 1: fato ou provocacao que cause desconforto no leitor. Linhas 2-4: aprofunda a dor sem revelar dados internos. Ultima linha: CTA natural. Sem saudacao, sem mencionar cidade.",
  "copyStories": "Metodo Impacto+CTA: texto para Story ou Reels. Maximo 2 linhas. Uma provocacao ou pergunta que incomoda, seguida de um CTA direto. Sem saudacao.",
  "copyWhatsapp": "Primeira mensagem para lead que ja iniciou contato. Tom consultivo e humano, nao de vendedor. Inclua uma pergunta aberta que gere resposta genuina. Maximo 3 linhas. Nada de 'Ola, vi que voce se interessou'.",
  "copyPrincipal": "Texto de anuncio ou legenda longa. 4 a 6 linhas. Abre com a tensao da dor do cliente, desenvolve sem revelar dados e fecha com CTA. Sem mencionar cidade ou numeros internos.",
  "anguloDePositionamento": "Qual angulo criativo usar nos criativos visuais desta semana e por que. O que mostrar na imagem ou video que conecta com o estado emocional diagnosticado nos dados. Maximo 50 palavras.",
  "segmentoSugerido": "Descricao do publico-alvo para segmentacao em campanhas pagas (Meta Ads / Google Ads) com base no perfil identificado. Inclua faixa etaria, renda estimada e interesses. Maximo 40 palavras.",
  "antecipacaoDeObjecao": "Como inserir no proprio criativo a resposta a principal objecao ANTES do contato. Descreva a tecnica e um exemplo concreto baseado nos dados. Maximo 50 palavras.",
  "palavrasChaveNegativas": "Liste 3 a 5 intencoes de busca de usuarios fora do perfil ideal (ex: plano gratuito, plano pelo INSS, plano para inadimplente). Separe por virgula.",
  "tomDeVoz": "Em 2 linhas, o tom ideal para esta semana com base no estado emocional dos leads. Indique o que o redator deve EVITAR para nao soar invasivo ou generico."
}`;
}

// ============================================================
// ORQUESTRADOR PRINCIPAL
// ============================================================

export async function generateWeeklyInsights(
    supabase: SupabaseClient,
    forceRefetch: boolean = false,
    targetStartDate?: Date,
    targetEndDate?: Date
): Promise<any[]> {
    let history: any[] = [];
    try {
        // Carrega historico atual
        const { data: cacheData } = await supabase
            .schema('dashboard')
            .from('dash_metrics_cache')
            .select('updated_at, metrics_data')
            .eq('id', 2)
            .single();

        if (cacheData && Object.keys(cacheData.metrics_data || {}).length > 0) {
            if (Array.isArray(cacheData.metrics_data.history)) {
                history = JSON.parse(JSON.stringify(cacheData.metrics_data.history));
            } else if (cacheData.metrics_data.insights) {
                history = [{
                    timestamp: cacheData.metrics_data.timestamp || Date.now(),
                    periodoStr: cacheData.metrics_data.periodoStr || '',
                    ...cacheData.metrics_data.insights
                }];
            }
        }

        // Se nao e forcado e nao ha targetStartDate, retorna historico completo sem gerar
        if (!forceRefetch && !targetStartDate && history.length > 0) {
            return history;
        }

        // Determina o periodo a gerar
        let startDate: Date;
        let endDate: Date;

        if (targetStartDate && targetEndDate) {
            startDate = targetStartDate;
            endDate = targetEndDate;
        } else {
            // Semana calendário anterior (seg-dom UTC)
            const range = getPreviousCalendarWeek();
            startDate = range.startDate;
            endDate = range.endDate;
        }

        // Nao regera se ja existe insight para essa semana (a menos que forceRefetch)
        if (!forceRefetch && weekAlreadyExists(history, startDate)) {
            return history;
        }

        const weekMessages = await getRawMessages(supabase, startDate, endDate);
        if (weekMessages.length === 0) return history;

        const weekMetrics = await processMessages(weekMessages, startDate, endDate, true);

        const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const periodoStr = `${fmtDate(startDate)} a ${fmtDate(endDate)}`;

        const sessionTranscripts = buildSessionTranscripts(weekMessages);
        const dossie = buildDossie(weekMetrics, sessionTranscripts, periodoStr);

        const promptNegocio = buildPromptNegocio(dossie);
        const promptMarketing = buildPromptMarketing(dossie);

        // Chama sequencialmente para nao sobrecarregar o timeout da Edge Function
        const textoNegocio = await geminiService.generateSummary(promptNegocio);
        const textoMarketing = await geminiService.generateSummary(promptMarketing);


        const parseJSON = (raw: string): Record<string, string> | null => {
            try {
                // Tenta achar o primeiro { e o ultimo }
                const firstBrace = raw.indexOf('{');
                const lastBrace = raw.lastIndexOf('}');
                if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
                
                const cleanJson = raw.substring(firstBrace, lastBrace + 1);
                return JSON.parse(cleanJson);
            } catch (err) {
                console.error("Erro ao fazer parse no JSON do Gemini:", err, raw);
                return null;
            }
        };

        const negocio = parseJSON(textoNegocio);
        const marketing = parseJSON(textoMarketing);

        if (!negocio && !marketing) {
            console.error("Ambos os parsers falharam. Insight vazio.");
            return history; // retorna o historia sem tentar adicionar vazio
        }

        const novoRegistro = {
            timestamp: Date.now(),
            periodoStr,
            periodoInicio: startDate.getTime(),
            periodoFim: endDate.getTime(),
            negocio: negocio ?? {},
            marketing: marketing ?? {}
        };

        history.unshift(novoRegistro);

        const nowStr = new Date().toISOString();
        const { error: upsertError } = await supabase
            .schema('dashboard')
            .from('dash_metrics_cache')
            .upsert({ id: 2, updated_at: nowStr, metrics_data: { history } as any });
            
        if (upsertError) {
            console.error('Falha ao salvar history no DB:', upsertError);
        }

        return history;
    } catch (e) {
        console.error('Insights semanais: erro na geracao:', e);
        // Retorna o historico carregado do DB (nunca perde o que ja existia)
        return history;
    }
}
