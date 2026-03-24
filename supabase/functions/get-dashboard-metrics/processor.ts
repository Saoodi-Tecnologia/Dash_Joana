import { geminiService } from "./gemini.ts";
import { DashboardMetrics } from "./types.ts";
import { getGranularidade, getDayKey, sortDayKeys } from "./utils.ts";

export async function processMessages(
    rows: any[],
    periodStart?: Date,
    periodEnd?: Date,
    skipAI: boolean = false
): Promise<DashboardMetrics> {
    const sessions: Record<string, any> = {};
    const returnUsers = new Set<string>();
    const phoneToConversations: Record<string, Set<string>> = {};

    rows.forEach(row => {
        const sessionId = row.session_id;
        if (!sessions[sessionId]) {
            sessions[sessionId] = {
                sessionId,
                messages: [],
                timestamps: [],
                humanMessages: [],
                aiMessages: [],
                aiOnlyMessages: [],
                content: '',
                contactPhone: row.contact_phone || null,
            };
        }
        const content = (row.content as string) || '';
        const isHuman = row.message_type === 'incoming';
        const isIaReal = row.is_ia === true;
        const ts = new Date((row.received_at || row.chatwoot_created_at) as string);

        sessions[sessionId].messages.push({ type: isHuman ? 'human' : 'ai', content });
        sessions[sessionId].timestamps.push(ts);
        sessions[sessionId].content += ' ' + content;

        if (isHuman) sessions[sessionId].humanMessages.push(content);
        else {
            sessions[sessionId].aiMessages.push(content);
            if (isIaReal) sessions[sessionId].aiOnlyMessages.push(content);
        }
    });

    const activeSessions = Object.values(sessions).filter(s => s.humanMessages.length > 0);

    const clienteMap: Record<string, any> = {};

    activeSessions.forEach(session => {
        const clienteKey = session.contactPhone || `anon_${session.sessionId}`;
        if (!clienteMap[clienteKey]) {
            clienteMap[clienteKey] = {
                clienteKey,
                contactPhone: session.contactPhone,
                sessionIds: [],
                messages: [],
                timestamps: [],
                humanMessages: [],
                aiMessages: [],
                aiOnlyMessages: [],
                content: '',
            };
        }
        const c = clienteMap[clienteKey];
        c.sessionIds.push(session.sessionId);
        c.messages.push(...session.messages);
        c.timestamps.push(...session.timestamps);
        c.humanMessages.push(...session.humanMessages);
        c.aiMessages.push(...session.aiMessages);
        c.aiOnlyMessages.push(...session.aiOnlyMessages);
        c.content += ' ' + session.content;
    });

    const clientes = Object.values(clienteMap);

    clientes.forEach(cliente => {
        const phone = cliente.contactPhone;
        const uniqueDays = new Set(cliente.timestamps.map((t: Date) => t.toDateString()));
        if (uniqueDays.size > 1 || cliente.sessionIds.length > 1) {
            returnUsers.add(phone ?? cliente.clienteKey);
        }
        if (phone) {
            if (!phoneToConversations[phone]) phoneToConversations[phone] = new Set<string>();
            cliente.sessionIds.forEach((sid: string) => phoneToConversations[phone].add(sid));
        }
    });

    const totalClientesUnicos = clientes.length;
    let totalConversas = clientes.length;
    let counts = { cotacao: 0, interesse: 0, fechamento: 0, conversoesReais: 0 };
    let totalTicketsEmp: number[] = [];
    let totalTicketsFam: number[] = [];
    let duracoes: number[] = [];
    let duracoesFechamento: number[] = [];
    let abandonos = 0;
    let mensagensRetidas = 0;
    let abandonoPorEtapa = { cotacao: 0, interesse: 0, fechamento: 0 };
    let sessoesComIntervencaoHumana = 0;
    let sessoesLongas = 0;
    let abandonoInteresseComCopart = 0;
    let abandonoInteresseComInternacao = 0;
    let origemTrafego = { instagram: 0, facebook: 0, organico: 0 };

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    if (periodStart && periodEnd) {
        minDate = periodStart;
        maxDate = periodEnd;
    } else {
        clientes.forEach(cliente => {
            const date = cliente.timestamps[0] as Date;
            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
        });
    }

    const totalDias = (minDate && maxDate)
        ? Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 1;

    const granularidade = getGranularidade(totalDias);

    const volumeByDay: Record<string, number> = {};
    const perfByDay: Record<string, { con: number, ab: number }> = {};
    const funnelByDay: Record<string, { cotacao: number, interesse: number, fechamento: number }> = {};
    const planosByDay: Record<string, { empresarial: number, familiar: number }> = {};

    let faixas: Record<string, number> = {};
    const idadesCotadasReal: number[] = [];
    let dependentes: Record<string, { mesPassado: number, mesAtual: number }> = {
        "0": { mesPassado: 0, mesAtual: 0 },
        "1": { mesPassado: 0, mesAtual: 0 },
        "2": { mesPassado: 0, mesAtual: 0 },
        "3": { mesPassado: 0, mesAtual: 0 },
        "4": { mesPassado: 0, mesAtual: 0 },
        "5+": { mesPassado: 0, mesAtual: 0 },
    };

    const volumeByHour: Record<string, number> = {};
    for (let i = 0; i < 24; i++) volumeByHour[`${i}h`] = 0;

    let totalMensagensH = 0;
    let totalVidasEmp = 0;
    let countEmp = 0;
    let totalVidasFam = 0;
    let countFam = 0;

    const perfFreq = { "Valores e cotação": 0, "Rede credenciada": 0, "Carência": 0, "Inclusão de dependentes": 0, "Internação e cobertura": 0, "Coparticipação": 0 };

    const nowDate = new Date();

    clientes.forEach(session => {
        const text = session.content.toLowerCase();
        const date = session.timestamps[0] as Date;
        let splitDate: Date;
        if (periodStart && periodEnd) {
            splitDate = new Date((periodStart.getTime() + periodEnd.getTime()) / 2);
        } else {
            splitDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
        }
        const isSegundaParte = date >= splitDate;

        totalMensagensH += session.messages.length;

        session.timestamps.forEach((t: Date) => {
            const hourStr = `${t.getHours()}h`;
            if (volumeByHour[hourStr] !== undefined) volumeByHour[hourStr]++;
        });

        const humanTextFrust = session.humanMessages.join(' ');
        const regexFrustracao = /(não entendi|não é isso|mas eu falei|atendente|humano|errado|você não entendeu|não ajuda|repetir)/i;
        if (regexFrustracao.test(humanTextFrust)) mensagensRetidas += 1;

        const dayKey = getDayKey(date, granularidade);
        volumeByDay[dayKey] = (volumeByDay[dayKey] || 0) + 1;
        if (!funnelByDay[dayKey]) funnelByDay[dayKey] = { cotacao: 0, interesse: 0, fechamento: 0 };
        if (!planosByDay[dayKey]) planosByDay[dayKey] = { empresarial: 0, familiar: 0 };

        // ORIGEM DE TRAFEGO: detectada pela primeira mensagem humana da sessao
        // Leads de anuncio chegam com link do Instagram ou Facebook no texto inicial
        const primeiraMsgHumana = (session.humanMessages[0] ?? '').toLowerCase();
        if (primeiraMsgHumana.includes('instagram.com/')) {
            origemTrafego.instagram++;
        } else if (primeiraMsgHumana.includes('fb.me/') || primeiraMsgHumana.includes('facebook.com/')) {
            origemTrafego.facebook++;
        } else {
            origemTrafego.organico++;
        }

        const humanConcat = session.humanMessages.join(' ').toLowerCase();
        if (/(valor|custo|pre[çc]o|mensalid|quanto|or[çc]amento|tabela)/.test(humanConcat)) perfFreq["Valores e cotação"]++;
        if (/(hospital|cl[íi]nica|m[ée]dicos?|rede|credenciad|atende|pediatra|obstetra|especialista)/.test(humanConcat)) perfFreq["Rede credenciada"]++;
        if (/(car[êe]ncia|prazo|quando posso usar|tempo pra|espera|imediato)/.test(humanConcat)) perfFreq["Carência"]++;
        if (/(dependentes?|filhos?|espos[oa]|marido|mulher|c[ôo]njuge|fam[íi]lia|meus pais)/.test(humanConcat)) perfFreq["Inclusão de dependentes"]++;
        if (/(interna[çc][ãa]o|internar|cirurgia|opera[çc][ãa]o|quarto|enfermaria|uti\b|pronto.?socorro|cobertura)/.test(humanConcat)) perfFreq["Internação e cobertura"]++;
        if (/(co.?participa[çc][ãa]o|copart|pago [àa] parte|pago por consulta|paga a parte|taxa)/.test(humanConcat)) perfFreq["Coparticipação"]++;

        let stage = 'Cotação';
        const humanText = session.humanMessages.join(' ').toLowerCase();
        const aiText = session.aiMessages.join(' ').toLowerCase();

        if (/(rede credenciada|carência|hospitais|clínicas|cobertura|mais informações|internação|cirurgia|emergência|co.?participação|coparticipação|comparticipação)/.test(humanText)) {
            stage = 'Interesse';
        }

        // Fechamento: detectado por sinais da Joana, nao por palavras do cliente

        // Sinal 1: Joana SOLICITA o CPF ativamente (diferente de informar que CPF e necessario)
        // Padroes: "pode me passar seu CPF", "preciso do seu CPF", "me informa seu CPF", "me passa seu CPF"
        const joanaFechouPedindoCpf =
            /pode\s+me\s+(?:passar|informar|enviar|mandar)[^.!?\n]{0,30}cpf/i.test(aiText) ||
            /(?:me\s+(?:passa|informa|envia|manda|informe)|preciso\s+do\s+(?:seu\s+)?|s[oó]\s+falta\s+(?:voc[eê]\s+me\s+)?(?:informar\s+)?(?:o\s+)?(?:seu\s+)?)\s*cpf/i.test(aiText) ||
            /(?:agora\s+)?preciso\s+do\s+(?:seu\s+)?cpf\s+(?:pra|para)/i.test(aiText) ||
            /cpf\s+(?:ou\s+cnpj\s+)?do\s+(?:respons[aá]vel|titular)\s+(?:pela|para)\s+(?:a\s+)?contrata/i.test(aiText);

        // Sinal 2: Joana gerou resumo =Cliente com dados coletados (CPF, email, plano escolhido)
        // REGRAS: Deve conter explicitamente '=cliente' e uma das palavras de coleta de dados.
        // Isso evita que conversas onde a Joana apenas informa as opcoes de pagamento marquem fechamento erroneamente.
        const resumoOficialIA = aiText.includes('=cliente');
        const dadosColetados = /(?:cpf|email|boleto|debito|débito|cartao|cartão|escolheu|optou)/i.test(aiText);
        const joanaGeroupResumoCliente = resumoOficialIA && dadosColetados;

        if (joanaFechouPedindoCpf || joanaGeroupResumoCliente) stage = 'Fechamento';


        if (stage === 'Cotação') counts.cotacao++;
        if (stage === 'Interesse') counts.interesse++;
        if (stage === 'Fechamento') counts.fechamento++;

        funnelByDay[dayKey].cotacao += (stage === 'Cotação' ? 1 : 0);
        funnelByDay[dayKey].interesse += (stage === 'Interesse' ? 1 : 0);
        funnelByDay[dayKey].fechamento += (stage === 'Fechamento' ? 1 : 0);

        const lastMsg = session.messages[session.messages.length - 1];
        const lastTs = session.timestamps[session.timestamps.length - 1] as Date;
        const horasDesdeUltimaMsg = (nowDate.getTime() - lastTs.getTime()) / (1000 * 60 * 60);

        // ABANDONO PADRONIZADO: 6 horas de silêncio para qualquer etapa.
        // Se a Joana mandou a última e o cliente não respondeu em 6h, é abandono.
        const isAbandono = lastMsg.type === 'ai' && horasDesdeUltimaMsg > 6;

        if (!perfByDay[dayKey]) perfByDay[dayKey] = { con: 0, ab: 0 };
        
        // CONVERSAO: Somente com o resumo oficial do sistema (=cliente)
        if (stage === 'Fechamento' && resumoOficialIA) {
            perfByDay[dayKey].con++;
            counts.conversoesReais++;
        } 
        else if (isAbandono) {
            perfByDay[dayKey].ab++;
        }

        const aiTextRaw = session.aiMessages.join(' ');
        const humanTextRaw = session.humanMessages.join(' ');

        const iaCitouValor = /R\$/.test(aiTextRaw);
        // Empresarial: apenas quando a Joana menciona explicitamente "plano empresarial"
        const iaDissePlanoEmp = /plano\s+empresarial/i.test(aiTextRaw);
        const isEmp = iaDissePlanoEmp && iaCitouValor;
        // Familiar/individual: toda cotacao que nao for empresarial (default)
        const isFam = !isEmp && iaCitouValor;

        // Contagem de vidas com prioridade decrescente de confiabilidade
        let vidasDetectadas = 0;
        let numDependentesExato: number | null = null;

        // Normaliza texto removendo acentos para facilitar comparacao de ordinais
        const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const aiNorm = normalize(aiTextRaw);

        // Prioridade 1: resumo estruturado "=Cliente Nome, X anos, N dependentes"
        const resumoClienteMatch = aiTextRaw.match(/=Cliente[^,\n]+,\s*\d+\s*anos?,\s*(\d+)\s*dependentes?/i);
        const resumoSemDep = /=Cliente[^,\n]+,\s*\d+\s*anos?,\s*sem\s*dependentes?/i.test(aiTextRaw);
        if (resumoClienteMatch) {
            numDependentesExato = parseInt(resumoClienteMatch[1]);
            vidasDetectadas = numDependentesExato + 1;
        } else if (resumoSemDep) {
            numDependentesExato = 0;
            vidasDetectadas = 1;
        } else {
            // Prioridade 2: numero digito explicito de vidas ("3 vidas", "2 vidas")
            const vidasMatch = aiTextRaw.match(/\b(\d+)\s*vidas?\b/i);
            if (vidasMatch) {
                vidasDetectadas = parseInt(vidasMatch[1]);
            }

            // Prioridade 3: numero digito explicito de pessoas ("3 pessoas", "2 pessoas")
            if (vidasDetectadas === 0) {
                const pessoasMatch = aiTextRaw.match(/\b(\d+)\s*pessoas?\b/i);
                if (pessoasMatch) vidasDetectadas = parseInt(pessoasMatch[1]);
            }

            // Prioridade 4: ordinais por extenso no texto normalizado (tres, quatro, cinco...)
            // Funciona com ou sem acento e em qualquer posicao da frase
            if (vidasDetectadas === 0) {
                const ordinaisNorm: [string, number][] = [
                    ['seis', 6], ['cinco', 5], ['quatro', 4], ['tres', 3], ['dois', 2], ['duas', 2]
                ];
                for (const [palavra, qtd] of ordinaisNorm) {
                    if (aiNorm.includes(palavra)) {
                        vidasDetectadas = qtd;
                        break;
                    }
                }
            }

            // Prioridade 5: contar valores individuais inline ("R$ X pra voce, R$ Y pra sua esposa")
            if (vidasDetectadas === 0) {
                let maxVidasMsg = 0;
                for (const msg of session.aiMessages) {
                    // Padrao: "R$ valor pra [pronome/nome/relacao]"
                    const valoresPorPessoa = [...msg.matchAll(/R\$\s*[0-9][0-9.,]+\s*(?:pra|para|de|por)\s+(?:voc[eê]|sua?|seu|a\s+\w+|o\s+\w+|\w+\s+de)/gi)];
                    if (valoresPorPessoa.length > maxVidasMsg) maxVidasMsg = valoresPorPessoa.length;

                    // Bullets numa mesma mensagem
                    const bullets = [...msg.matchAll(/[•\-\*]\s*[^:\n]+:\s*R\$/gi)];
                    if (bullets.length > maxVidasMsg) maxVidasMsg = bullets.length;
                }

                // Joana as vezes manda cada bullet como mensagem separada — checar no texto concatenado
                const bulletsTotal = [...aiTextRaw.matchAll(/[•\-\*]\s*[^•\n]+:\s*R\$/gi)];
                if (bulletsTotal.length > maxVidasMsg) maxVidasMsg = bulletsTotal.length;

                if (maxVidasMsg >= 2) vidasDetectadas = maxVidasMsg;
            }

            // Prioridade 6: idades entre parenteses "(XX anos)" — conta pessoas distintas na cotacao
            if (vidasDetectadas === 0) {
                const idadesParenteses = [...aiTextRaw.matchAll(/\((\d{1,3})\s*anos?\)/gi)];
                const uniqueIdadesP = new Set(idadesParenteses.map((m: any) => m[1]));
                if (uniqueIdadesP.size >= 2) vidasDetectadas = uniqueIdadesP.size;
            }
        }
        if (vidasDetectadas < 1) vidasDetectadas = 1;
        if (isEmp && vidasDetectadas < 2) vidasDetectadas = 2;
        if (vidasDetectadas > 20) vidasDetectadas = 20;

        if (isEmp) { planosByDay[dayKey].empresarial++; countEmp++; totalVidasEmp += vidasDetectadas; }
        if (isFam) { planosByDay[dayKey].familiar++; countFam++; totalVidasFam += vidasDetectadas; }
        if (!isEmp && !isFam) { planosByDay[dayKey].familiar++; }

        const podeCaptTicket = isEmp || isFam;
        let ticketCapturado = false;

        if (podeCaptTicket) {
            const regexCopartCtx = /coparticipa[cç][aã]o|simula[cç][aã]o|estimad[ao]|estimativa|por sess[aã]o|por uso|por procedimento|al[eé]m da mensalidade/i;
            const aiTextParaTicket = aiTextRaw
                .split(/(?<=[.!?])\s+/)
                .filter((sent: string) => !regexCopartCtx.test(sent))
                .join(' ');

            const totalPatterns = [
                // "Total mensal: R$ X" ou "Total mensal pro plano R$ X"
                /total\s*mensal[^R]{0,40}R\$\s*([0-9][0-9.,]+)/gi,
                // "totalizando R$ X"
                /totalizando\s*R\$\s*([0-9][0-9.,]+)/gi,
                // "Valor total por mês: R$ X" / "Total do plano: R$ X por mês"
                /(?:valor\s*total|total\s*(?:da|do|pra|para)\s*(?:plano|mensalidade|grupo|vocês|voces))\s*[^R]{0,60}R\$\s*([0-9][0-9.,]+)/gi,
                // "- Total: R$ X" ou "Total: R$ X"
                /(?:-\s*)?[Tt]otal\s*:\s*R\$\s*([0-9][0-9.,]+)/gi,
                // "sai a R$ X"
                /sai\s*a\s*R\$\s*([0-9][0-9.,]+)/gi,
                // "é R$ X mensais/por mês/ao mês"
                /é\s*R\$\s*([0-9][0-9.,]+)\s*(?:mensais|por\s*m[eê]s|ao\s*m[eê]s)/gi,
                // "fica R$ X mensais/por mês"
                /fica\s*R\$\s*([0-9][0-9.,]+)\s*(?:mensais|por\s*m[eê]s|ao\s*m[eê]s)/gi,
                // "juntos fica R$ X" / "juntos dá R$ X"
                /juntos\s*(?:fica[m]?|d[áa])\s*R\$\s*([0-9][0-9.,]+)/gi,
                // "grupo fica em R$ X/mês"
                /grupo\s*fica\s*em\s*R\$\s*([0-9][0-9.,]+)/gi,
                // "o valor total pra esse X fica em R$ X"
                /valor\s*total[^R]{0,60}R\$\s*([0-9][0-9.,]+)/gi,
                // "vocês duas fica R$ X por mês"
                /voc[eê]s\s*\w+\s*fica\s*R\$\s*([0-9][0-9.,]+)/gi,
            ];

            const valoresEncontrados: number[] = [];
            for (const pattern of totalPatterns) {
                const patternCopy = new RegExp(pattern.source, 'gi');
                let mVal;
                while ((mVal = patternCopy.exec(aiTextParaTicket)) !== null) {
                    const raw = mVal[1].replace(/\./g, '').replace(',', '.');
                    const val = parseFloat(raw);
                    const maxValido = isEmp ? 50000 : 5000;
                    if (val >= 50 && val <= maxValido) {
                        valoresEncontrados.push(val);
                    }
                }
            }

            if (valoresEncontrados.length > 0) {
                const ticketFinal = Math.max(...valoresEncontrados);
                if (isEmp) totalTicketsEmp.push(ticketFinal);
                else totalTicketsFam.push(ticketFinal);
                ticketCapturado = true;
            }

            if (!ticketCapturado) {
                const regexCopartSimulacao = /coparticipa[cç][aã]o|simula[cç][aã]o|estimado|estimativa|por sess[aã]o|por uso|por procedimento/i;
                const msgsComIdade = session.aiMessages.filter((m: string) =>
                    /R\$/.test(m) && /\d{1,3}\s*anos/i.test(m) && !regexCopartSimulacao.test(m)
                );
                const msgsComValor = session.aiMessages.filter((m: string) =>
                    /R\$/.test(m) && !regexCopartSimulacao.test(m)
                );
                const msgsParaAnalisar = msgsComIdade.length > 0 ? msgsComIdade : msgsComValor;

                if (msgsParaAnalisar.length > 0) {
                    const textoCompleto = msgsParaAnalisar.join(' ');
                    const allMatches = [...textoCompleto.matchAll(/R\$\s*([0-9][0-9.,]+)/gi)];
                    const todosValores = allMatches
                        .map(m => parseFloat(m[1].replace(/\./g, '').replace(',', '.')))
                        .filter(v => v >= 80 && v <= (isEmp ? 50000 : 5000));

                    if (todosValores.length > 0) {
                        const ticketFinal = Math.max(...todosValores);
                        if (isEmp) totalTicketsEmp.push(ticketFinal);
                        else totalTicketsFam.push(ticketFinal);
                    }
                }
            }
        }

        const aiFullText = session.aiMessages.join(' ');
        const aiTextSemPolitica = aiFullText
            .replace(/(?:filhos?|dependentes?)\s+(?:at[ée]|com)?\s*\d{1,3}\s*anos?[^.!?]*/gi, '')
            .replace(/faixa\s+et[aá]ria\s+\d{1,3}\s+a\s+\d{1,3}\s+anos?[^.!?]*/gi, '')
            .replace(/\d{1,3}\s*(?:a|at[ée])\s*\d{1,3}\s+anos?/gi, '');
        // Captura apenas idades em anos — excluir meses para nao confundir prazos de carencia com faixas etarias
        const ageRegex = /(?:para\s+|de\s+|com\s+)?(\d{1,3})\s*anos?/gi;
        let match;
        const sessionAges = new Set<string>();
        const sessionUniqueAgesRebuilt = new Set<number>();

        while ((match = ageRegex.exec(aiTextSemPolitica)) !== null) {
            const age = parseInt(match[1]);
            // Ignorar valores improvaveis para idade humana (ex: prazos como 12, 24 meses de carencia)
            if (age < 0 || age > 105) continue;
            sessionUniqueAgesRebuilt.add(age);
        }

        sessionUniqueAgesRebuilt.forEach(age => {
            idadesCotadasReal.push(age);
            if (age <= 17) sessionAges.add('Ate 18');
            else if (age <= 29) sessionAges.add('18-29');
            else if (age <= 39) sessionAges.add('30-39');
            else if (age <= 49) sessionAges.add('40-49');
            else if (age <= 59) sessionAges.add('50-59');
            else sessionAges.add('60+');
        });
        sessionAges.forEach(f => { faixas[f] = (faixas[f] || 0) + 1; });

        // Dependentes: so contabiliza sessoes onde a Joana fez cotacao real (citou R$)
        // Evita inflar o bucket "0" com conversas sem preco (leads em fase inicial)
        if (iaCitouValor) {
            const numDep = numDependentesExato !== null ? numDependentesExato : Math.max(0, vidasDetectadas - 1);
            let dCount: string;
            if (numDep <= 0) dCount = "0";
            else if (numDep === 1) dCount = "1";
            else if (numDep === 2) dCount = "2";
            else if (numDep === 3) dCount = "3";
            else if (numDep === 4) dCount = "4";
            else dCount = "5+";

            if (isSegundaParte) dependentes[dCount].mesAtual++;
            else dependentes[dCount].mesPassado++;
        }

        const start = session.timestamps[0];
        const end = session.timestamps[session.timestamps.length - 1];
        const diff = (end.getTime() - start.getTime()) / (1000 * 60);
        if (diff > 0 && diff < 120) {
            duracoes.push(diff);
            if (stage === 'Fechamento') duracoesFechamento.push(diff);
        }

        if (isAbandono) {
            abandonos++;
            if (stage === 'Cotação') {
                abandonoPorEtapa.cotacao++;
            } else if (stage === 'Interesse') {
                abandonoPorEtapa.interesse++;
                if (/(co.?participação|coparticipação)/.test(humanText)) abandonoInteresseComCopart++;
                if (/(internação|cirurgia)/.test(humanText)) abandonoInteresseComInternacao++;
            } else if (stage === 'Fechamento') {
                // Se chegou a pedir CPF mas nao virou venda (=cliente), 
                // conta como abandono na etapa de fechamento.
                abandonoPorEtapa.fechamento++;
            }
        }

        const rowsCliente = rows.filter((r: any) =>
            session.sessionIds.includes(r.session_id) && r.message_type === 'outgoing' && r.is_ia === false
        );
        if (rowsCliente.length > 0) sessoesComIntervencaoHumana++;
        if (session.messages.length > 20) sessoesLongas++;
    });

    const ticketEmp = totalTicketsEmp.length > 0 ? totalTicketsEmp.reduce((a, b) => a + b, 0) / totalTicketsEmp.length : 0;
    const ticketFam = totalTicketsFam.length > 0 ? totalTicketsFam.reduce((a, b) => a + b, 0) / totalTicketsFam.length : 0;
    const allTickets = [...totalTicketsEmp, ...totalTicketsFam];
    const ticketMedio = allTickets.length > 0 ? allTickets.reduce((a, b) => a + b, 0) / allTickets.length : 0;
    const tempoMedio = duracoes.length > 0 ? duracoes.reduce((a, b) => a + b, 0) / duracoes.length : 0;
    const tempoMedioFechamento = duracoesFechamento.length > 0 ? duracoesFechamento.reduce((a, b) => a + b, 0) / duracoesFechamento.length : 0;
    // A taxa de conversao real usa apenas as sessoes com marcador =cliente
    const taxaConversao = totalConversas > 0 ? (counts.conversoesReais / totalConversas) * 100 : 0;
    const taxaAbandono = totalConversas > 0 ? (abandonos / totalConversas) * 100 : 0;
    const taxaFrustracao = totalConversas > 0 ? (mensagensRetidas / totalConversas) * 100 : 0;

    let taxaCompreensao = 100 - taxaFrustracao;
    taxaCompreensao = Math.max(0, Math.min(100, taxaCompreensao));

    let scoreGeral = 100 - (taxaAbandono * 0.4) + (taxaConversao * 1.5) - (taxaFrustracao * 1.2);
    scoreGeral = Math.max(0, Math.min(100, scoreGeral));

    const horarioPico = Object.entries(volumeByHour)
        .filter(([_, v]) => v > 0)
        .map(([horario, mensagens]) => ({ horario, mensagens }))
        .sort((a, b) => parseInt(a.horario) - parseInt(b.horario));

    const volumeHorario = [...horarioPico]
        .sort((a, b) => b.mensagens - a.mensagens)
        .slice(0, 4)
        .map((h, i) => ({ ...h, fill: ['#155DFC', '#3B82F6', '#60A5FA', '#93C5FD'][i] || '#60A5FA' }));

    const periodoInicio = minDate ? `${String(minDate.getDate()).padStart(2, '0')}/${String(minDate.getMonth() + 1).padStart(2, '0')}` : '--';
    const periodoFim = maxDate ? `${String(maxDate.getDate()).padStart(2, '0')}/${String(maxDate.getMonth() + 1).padStart(2, '0')}` : '--';

    const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    let comparativoLabel1: string;
    let comparativoLabel2: string;
    if (periodStart && periodEnd) {
        const mid = new Date((periodStart.getTime() + periodEnd.getTime()) / 2);
        comparativoLabel1 = `${fmtDate(periodStart)} - ${fmtDate(new Date(mid.getTime() - 1))}`;
        comparativoLabel2 = `${fmtDate(mid)} - ${fmtDate(periodEnd)}`;
    } else {
        const primeiroDiaMes = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
        const mesAnterior = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
        const ultimoDiaMesAnterior = new Date(primeiroDiaMes.getTime() - 1);
        comparativoLabel1 = `${fmtDate(mesAnterior)} - ${fmtDate(ultimoDiaMesAnterior)}`;
        comparativoLabel2 = `${fmtDate(primeiroDiaMes)} - ${fmtDate(nowDate)}`;
    }

    const frasesReais: Record<string, string[]> = {
        "Valores e cotação": [],
        "Internação e cobertura": [],
        "Coparticipação": [],
        "Carência": [],
        "Rede credenciada": [],
        "Inclusão de dependentes": [],
    };
    const regexPorTopico: Record<string, RegExp> = {
        "Valores e cotação": /(valor|custo|pre[çc]o|mensalidade|quanto [Éé]|quanto fica|quanto custa|custa quanto|quanto sai|qual o valor|or[çc]amento|tabela|mais barato|mais em conta)/i,
        "Internação e cobertura": /(interna[çc][ãa]o|internar|cirurgia|opera[çc][ãa]o|quarto|enfermaria|uti\b|pronto.?socorro|cobertura)/i,
        "Coparticipação": /(co.?participa[çc][ãa]o|copart|pago por fora|pago [àa] parte|paga por consulta|taxa por consulta|valor da consulta|pago exame)/i,
        "Carência": /(car[êe]ncia|quando posso usar|quanto tempo pra usar|prazo para|libera[çc][ãa]o|tempo de espera|usar de imediato)/i,
        "Rede credenciada": /(hospital|cl[íi]nica|m[ée]dicos?|rede|credenciad|atende em|qual hospital|lista de m[ée]dicos|pediatra|obstetra|especialista)/i,
        "Inclusão de dependentes": /(dependente|filhos?|espos[oa]|marido|mulher|c[ôo]njuge|agregado|adicionar|incluir|fam[íi]lia|titular|meus pais)/i,
    };
    clientes.forEach(cliente => {
        cliente.humanMessages.forEach((msg: string) => {
            const msgClean = msg.trim();
            if (msgClean.length < 5 || msgClean.length > 200) return;
            for (const [topico, regex] of Object.entries(regexPorTopico)) {
                if (regex.test(msgClean) && frasesReais[topico].length < 3) {
                    const frase = msgClean.charAt(0).toLowerCase() + msgClean.slice(1).replace(/[.!?]+$/, '');
                    if (!frasesReais[topico].includes(frase)) frasesReais[topico].push(frase);
                }
            }
        });
    });
    const faqFallbacks: Record<string, string[]> = {
        "Valores e cotação": ["quanto custa o plano", "qual o valor mensal"],
        "Internação e cobertura": ["cobre internação", "cobertura do plano"],
        "Coparticipação": ["o que é coparticipação", "quanto pago por consulta"],
        "Carência": ["prazo de carência", "quando posso usar"],
        "Rede credenciada": ["quais hospitais atendem", "atende na minha região"],
        "Inclusão de dependentes": ["adicionar dependente", "incluir família"],
    };

    const result: DashboardMetrics = {
        kpis: {
            totalConversas,
            taxaConversao: Number(taxaConversao.toFixed(1)),
            ticketMedio: Number(ticketMedio.toFixed(2)),
            tempoMedio: Number(tempoMedio.toFixed(1))
        },
        volumeData: Object.entries(volumeByDay)
            .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
            .map(([semana, conversas]) => ({ semana, conversas: conversas as number })),
        funnelStages: Object.entries(funnelByDay)
            .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
            .map(([semana, data]) => ({ semana, ...data })),
        periodoAnalise: { inicio: periodoInicio, fim: periodoFim, totalDias },
        performance: {
            kpis: {
                taxaAbandono: Number(taxaAbandono.toFixed(1)),
                tempoFechamento: Number(tempoMedioFechamento.toFixed(1)),
                abandonoConversas: abandonos
            },
            conversaoAbandono: Object.entries(perfByDay)
                .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
                .map(([semana, data]) => ({
                    semana, conversoes: (data as { con: number, ab: number }).con, abandono: (data as { con: number, ab: number }).ab
                })),
            abandonoEtapa: [
                { etapa: 'Cotação', abandonos: abandonoPorEtapa.cotacao, fill: '#38B3AB' },
                { etapa: 'Interesse', abandonos: abandonoPorEtapa.interesse, fill: '#FB923C' },
                { etapa: 'Fechamento', abandonos: abandonoPorEtapa.fechamento, fill: '#155DFC' },
            ]
        },
        produtosData: {
            kpis: {
                ticketEmpresarial: Number(ticketEmp.toFixed(2)),
                mediaVidasEmp: Math.round(totalVidasEmp / (countEmp || 1)),
                ticketFamiliar: Number(ticketFam.toFixed(2)),
                mediaVidasFam: Math.round(totalVidasFam / (countFam || 1))
            },
            planosCotacoes: Object.entries(planosByDay)
                .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
                .map(([semana, data]) => ({
                    semana, ...(data as { empresarial: number, familiar: number })
                })),
            faixasEtarias: (() => {
                const ordem = ['Ate 18', '18-29', '30-39', '40-49', '50-59', '60+'];
                return Object.entries(faixas)
                    .map(([faixa, quantidade]) => ({ faixa, quantidade }))
                    .sort((a, b) => ordem.indexOf(a.faixa) - ordem.indexOf(b.faixa));
            })(),
            dependentes: [
                { dependentes: "0", mesPassado: dependentes["0"].mesPassado, mesAtual: dependentes["0"].mesAtual, label: "Sem dependentes" },
                { dependentes: "1", mesPassado: dependentes["1"].mesPassado, mesAtual: dependentes["1"].mesAtual, label: "1 dependente" },
                { dependentes: "2", mesPassado: dependentes["2"].mesPassado, mesAtual: dependentes["2"].mesAtual, label: "2 dependentes" },
                { dependentes: "3", mesPassado: dependentes["3"].mesPassado, mesAtual: dependentes["3"].mesAtual, label: "3 dependentes" },
                { dependentes: "4", mesPassado: dependentes["4"].mesPassado, mesAtual: dependentes["4"].mesAtual, label: "4 dependentes" },
                { dependentes: "5+", mesPassado: dependentes["5+"].mesPassado, mesAtual: dependentes["5+"].mesAtual, label: "5 ou mais" }
            ],
            comparativoLabels: { label1: comparativoLabel1, label2: comparativoLabel2 },
            idadesCotadasReal: idadesCotadasReal
        },
        engajamentoData: {
            kpis: {
                mensagensConversa: Number((totalMensagensH / (totalConversas || 1)).toFixed(1)),
                taxaRetorno: totalClientesUnicos > 0 ? Number((returnUsers.size / totalClientesUnicos * 100).toFixed(1)) : 0,
                clientesRetorno: returnUsers.size,
                sessoesLongasPct: totalConversas > 0 ? Number((sessoesLongas / totalConversas * 100).toFixed(1)) : 0,
                sessoesLongasCount: sessoesLongas,
                duracaoMedia: Number(tempoMedio.toFixed(1))
            },
            horarioPico: horarioPico.length > 0 ? horarioPico : [],
            volumeHorario: volumeHorario.length > 0 ? volumeHorario : []
        },
        qualidadeData: {
            kpis: {
                taxaCompreensao: Number(taxaCompreensao.toFixed(1)),
                msgsRepetidasPct: Number((100 - taxaCompreensao).toFixed(1)),
                msgsRepetidasCount: mensagensRetidas
            },
            score: Number(scoreGeral.toFixed(0)),
            perguntasFrequentes: [
                { pergunta: "Valores e cotação", frequencia: perfFreq["Valores e cotação"], exemplos: frasesReais["Valores e cotação"].length > 0 ? frasesReais["Valores e cotação"] : faqFallbacks["Valores e cotação"] },
                { pergunta: "Internação e cobertura", frequencia: perfFreq["Internação e cobertura"], exemplos: frasesReais["Internação e cobertura"].length > 0 ? frasesReais["Internação e cobertura"] : faqFallbacks["Internação e cobertura"] },
                { pergunta: "Coparticipação", frequencia: perfFreq["Coparticipação"], exemplos: frasesReais["Coparticipação"].length > 0 ? frasesReais["Coparticipação"] : faqFallbacks["Coparticipação"] },
                { pergunta: "Carência", frequencia: perfFreq["Carência"], exemplos: frasesReais["Carência"].length > 0 ? frasesReais["Carência"] : faqFallbacks["Carência"] },
                { pergunta: "Rede credenciada", frequencia: perfFreq["Rede credenciada"], exemplos: frasesReais["Rede credenciada"].length > 0 ? frasesReais["Rede credenciada"] : faqFallbacks["Rede credenciada"] },
                { pergunta: "Inclusão de dependentes", frequencia: perfFreq["Inclusão de dependentes"], exemplos: frasesReais["Inclusão de dependentes"].length > 0 ? frasesReais["Inclusão de dependentes"] : faqFallbacks["Inclusão de dependentes"] },
            ]
        },
        resumosIA: {},
        origemTrafego: {
            instagram: origemTrafego.instagram,
            facebook: origemTrafego.facebook,
            organico: origemTrafego.organico,
            total: origemTrafego.instagram + origemTrafego.facebook + origemTrafego.organico
        }
    };

    if (!skipAI) {
        try {
            const topFaqs = result.qualidadeData.perguntasFrequentes
                .sort((a, b) => b.frequencia - a.frequencia)
                .slice(0, 4)
                .map(f => `${f.pergunta}: ${f.frequencia} conversas`)
                .join('; ');

            const horarioPicoStr = result.engajamentoData.volumeHorario
                .map(h => `${h.horario}: ${h.mensagens} mensagens`)
                .join(', ');

            const funnelTotais = `Cotacao=${counts.cotacao}, Interesse=${counts.interesse}, Fechamento=${counts.fechamento}`;

            const prompt = `Voce e um Head de Inteligencia Comercial e Vendas avaliando o desempenho da OPERACAO DE VENDAS de um plano de saude no cenario digital.

ATENCAO: Voce esta avaliando o FUNIL, o COMPORTAMENTO DOS CLIENTES e a EFICIENCIA DA OPERACAO, nao a ferramenta de software.

Dados de Vendas da Operacao neste periodo:
- Total de leads/contatos: ${result.kpis.totalConversas} | Vendas Fechadas: ${counts.fechamento} | Conversao: ${result.kpis.taxaConversao}%
- Leads perdidos (Abandono): ${abandonos} contatos (${result.performance.kpis.taxaAbandono}%)
- Gargalos do Funil: Cotacao=${abandonoPorEtapa.cotacao} perdas, Interesse=${abandonoPorEtapa.interesse} perdas
- Objecoes especificas em "Interesse": ${abandonoInteresseComCopart} debateram sobre coparticipacao; ${abandonoInteresseComInternacao} sobre internacao ANTES de desistir.
- Contatos que pediram escalonamento (falar com humano): ${sessoesComIntervencaoHumana}
- Negociacoes exaustivas (>20 mensagens interagidas): ${sessoesLongas}
- Clientes que voltaram dias depois (Lead Recorrente): ${result.engajamentoData.kpis.clientesRetorno}
- Assuntos comerciais mais quentes: ${topFaqs}

Gere exatamente este JSON com 3 chaves:

"principalInsight": Aponte a pior rachadura no funil comercial da operacao baseado nestes numeros. Onde estamos perdendo dinheiro? Ex: "Alta perda cambial de leads na etapa de Interesse diretamente correlacionada a duvidas fortes sobre coparticipacao e internacao (X% das perdas)." Maximo 45 palavras.

"padroesIdentificados": Qual e a caracteristica comercial predominante dessas negociacoes? Eles sao leads indecisos (voltam mais vezes), leads cansativos (negociacoes longas) ou desistem cedo na cotacao? Maximo 45 palavras.

"recomendacoesEstrategicas": Sugira UMA acao comercial focada em conversao para resolver a maior rachadura apontada acima (oferta, material de apoio, quebra de objecao previa). Maximo 45 palavras.

Retorne APENAS o JSON valido, sem markdown.`;

            const summariesText = await geminiService.generateSummary(prompt);
            const jsonMatch = summariesText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result.resumosIA = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            result.resumosIA = {};
        }
    }

    return result;
}
