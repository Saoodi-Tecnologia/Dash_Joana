# 📊 Documentação do Dashboard Joana

> **Agente IA - Boa Saúde**  
> Documentação detalhada de cada aba, componente, gráfico e dado exibido no dashboard.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Aba Geral](#1-aba-geral)
3. [Aba Insights](#2-aba-insights)
4. [Aba Performance](#3-aba-performance)
5. [Aba Engajamento](#4-aba-engajamento)
6. [Aba Produtos](#5-aba-produtos)
7. [Aba Qualidade](#6-aba-qualidade)
8. [Assistente IA (Chat)](#7-assistente-ia-chat)
9. [Estrutura de Dados](#8-estrutura-de-dados)

---

## Visão Geral

O **Dashboard Joana** é uma aplicação de análise de conversas e performance de atendimento automatizado com IA, voltado para o setor de **planos de saúde**. A IA "Joana" atende clientes via WhatsApp/chat, realiza cotações, responde dúvidas e conduz negociações.

**Tecnologias:** React, TypeScript, Recharts (gráficos), Tailwind CSS, shadcn/ui.

**Período dos dados mockados:** Outubro–Novembro 2025.

---

## 1. Aba Geral

> Visão consolidada do volume de atendimentos e funil de conversão.

### 1.1 KPIs (4 cards no topo)

| Card | Valor | Descrição | Dado recebido |
|------|-------|-----------|---------------|
| **Total Conversas** | `7` | Número total de conversas realizadas no período | `kpis.totalConversas: number` |
| **Taxa Conversão** | `42.8%` | Percentual de conversas que resultaram em venda/fechamento | `kpis.taxaConversao: number` |
| **Ticket Médio** | `R$ 430.50` | Valor médio das vendas/cotações fechadas | `kpis.ticketMedio: number` |
| **Tempo Médio** | `12.5min` | Duração média de cada conversa em minutos | `kpis.tempoMedio: number` |

Cada card exibe também um **trend** (tendência percentual vs mês anterior): `+15%`, `+8%`, `-5%`, `-12%`.

### 1.2 Gráfico: Volume de Conversas

- **Tipo:** AreaChart (gráfico de área com step)
- **Objetivo:** Visualizar a tendência de volume de conversas ao longo das semanas
- **Insight exibido:** "Crescimento de 25% no volume mensal"

**Dados recebidos:**
```typescript
type VolumeData = {
  semana: string;   // "Sem 1", "Sem 2", "Sem 3", "Sem 4"
  conversas: number; // quantidade de conversas na semana
}[]
```

**Valores mockados:**
| Semana | Conversas |
|--------|-----------|
| Sem 1  | 5         |
| Sem 2  | 3         |
| Sem 3  | 4         |
| Sem 4  | 7         |

### 1.3 Gráfico: Funil de Conversão

- **Tipo:** BarChart (barras empilhadas)
- **Objetivo:** Mostrar a progressão semanal pelas etapas do funil (Cotação → Interesse → Fechamento)
- **Insight exibido:** "Taxa de conversão aumentou 15% este mês"
- **Info tooltip:** Explica como a Joana classifica automaticamente cada etapa

**Dados recebidos:**
```typescript
type FunnelWeekly = {
  semana: string;      // "Sem 1" a "Sem 4"
  cotacao: number;     // clientes que pediram cotação
  interesse: number;   // clientes que demonstraram interesse (perguntas pós-valor)
  fechamento: number;  // clientes que confirmaram contratação
}[]
```

**Valores mockados:**
| Semana | Cotação | Interesse | Fechamento |
|--------|---------|-----------|------------|
| Sem 1  | 2       | 2         | 1          |
| Sem 2  | 1       | 1         | 0          |
| Sem 3  | 3       | 2         | 1          |
| Sem 4  | 1       | 0         | 1          |

**Cores:**
- Cotação: `#38B3AB` (teal)
- Interesse: `#FB923C` (laranja)
- Fechamento: `#155DFC` (azul)

---

## 2. Aba Insights

> Cards estratégicos com recomendações acionáveis baseadas nos dados.

### 2.1 Card: Principal Insight (azul)
- **Ícone:** Lâmpada
- **Conteúdo:** "Clientes que recebem informações sobre rede credenciada ANTES do preço têm 60% mais chance de conversão."
- **Dado base:** Análise qualitativa das conversas

### 2.2 Card: Padrões Identificados (verde)
- **Ícone:** Gráfico de barras
- **Conteúdo:** 
  - Conversas entre 10h-11h têm 55% de taxa de fechamento
  - 50% dos abandonos ocorrem após apresentação de valores
  - 14% dos clientes retornam para segunda cotação
- **Dados base:** `horarioPico`, `abandonosFunil`, taxa de retorno

### 2.3 Card: Recomendações Estratégicas (laranja)
- **Ícone:** Raio
- **Conteúdo:**
  - Priorizar campanhas no horário 10h-11h
  - Implementar follow-up automático após 24h para cotações abandonadas
  - Destacar rede credenciada antes de apresentar valores

> **Nota:** Esta aba não recebe dados dinâmicos — os textos são estáticos/analíticos. Em produção, seriam gerados pela IA com base nos dados reais.

---

## 3. Aba Performance

> Análise de conversão, abandono e eficiência do atendimento.

### 3.1 KPIs (2 cards)

| Card | Valor | Descrição | Dado |
|------|-------|-----------|------|
| **Taxa de Abandono** | `28.5%` | Percentual de conversas que não converteram | Estático (2 de 7) |
| **Tempo até Fechamento** | `18min` | Tempo médio para fechar uma venda | Estático |

### 3.2 Gráfico: Conversão vs Abandono

- **Tipo:** BarChart (barras agrupadas lado a lado)
- **Objetivo:** Comparar visualmente conversões e abandonos por semana
- **Insight exibido:** "Conversões aumentaram 33% nas últimas semanas"

**Dados recebidos:**
```typescript
type ConversaoSemanal = {
  semana: string;      // "Sem 1" a "Sem 4"
  conversoes: number;  // conversas que fecharam
  abandono: number;    // conversas abandonadas
}[]
```

**Valores mockados:**
| Semana | Conversões | Abandonos |
|--------|-----------|-----------|
| Sem 1  | 3         | 2         |
| Sem 2  | 2         | 1         |
| Sem 3  | 3         | 1         |
| Sem 4  | 4         | 3         |

**Cores:**
- Conversões: `#155DFC` (azul)
- Abandonos: `#ef4444` (vermelho)

### 3.3 Gráfico: Taxa de Abandono por Etapa

- **Tipo:** PieChart (gráfico de pizza)
- **Objetivo:** Identificar em qual etapa do funil os clientes mais desistem
- **Insight exibido:** "50% abandonam na fase de interesse"

**Dados recebidos:**
```typescript
type AbandonoPorEtapa = {
  etapa: string;     // "Cotação", "Interesse", "Fechamento"
  abandonos: number; // quantidade de abandonos nessa etapa
  fill: string;      // cor do segmento
}[]
```

**Valores mockados:**
| Etapa | Abandonos | Cor |
|-------|-----------|-----|
| Cotação | 1 | `#38B3AB` |
| Interesse | 3 | `#FB923C` |
| Fechamento | 2 | `#155DFC` |

---

## 4. Aba Engajamento

> Métricas de interação, horários de pico e volume de mensagens.

### 4.1 KPIs (4 cards)

| Card | Valor | Descrição |
|------|-------|-----------|
| **Mensagens/Conversa** | `8.4` | Média de mensagens trocadas por conversa |
| **Taxa de Retorno** | `14.2%` | Percentual de clientes que retornaram (1 de 7) |
| **Tempo de Resposta** | `0.5s` | Tempo médio de resposta do bot |
| **Duração Média** | `12.5min` | Duração média por conversa |

> Todos os KPIs desta aba são valores estáticos inline.

### 4.2 Gráfico: Horário de Pico

- **Tipo:** AreaChart (gráfico de área linear)
- **Objetivo:** Mostrar a distribuição de mensagens ao longo do dia
- **Insight exibido:** "Pico entre 10h-11h com 12 mensagens"

**Dados recebidos:**
```typescript
type HorarioPico = {
  horario: string;    // "8h", "9h", ..., "18h"
  mensagens: number;  // quantidade de mensagens naquele horário
}[]
```

**Valores mockados:**
| Horário | Mensagens |
|---------|-----------|
| 8h      | 2         |
| 9h      | 5         |
| 10h     | 12        |
| 11h     | 8         |
| 14h     | 3         |
| 15h     | 6         |
| 16h     | 7         |
| 17h     | 10        |
| 18h     | 4         |

### 4.3 Gráfico: Volume por Horário

- **Tipo:** BarChart (barras com cores em gradiente)
- **Objetivo:** Destacar os horários mais ativos com barras de intensidade decrescente
- **Insight exibido:** "Horário de pico às 10h com 12 mensagens"
- **Detalhe visual:** A primeira barra (10h) tem estilo tracejado (dashed stroke) para destaque

**Dados recebidos:**
```typescript
type EngajamentoHorario = {
  horario: string;    // "10h", "11h", "17h", "18h"
  mensagens: number;  // quantidade no horário
  fill: string;       // cor da barra (gradiente de azul)
}[]
```

**Valores mockados:**
| Horário | Mensagens | Cor |
|---------|-----------|-----|
| 10h     | 12        | `#155DFC` |
| 11h     | 8         | `#3B82F6` |
| 17h     | 4         | `#60A5FA` |
| 18h     | 2         | `#93C5FD` |

---

## 5. Aba Produtos

> Análise de planos cotados, perfil demográfico e dependentes dos clientes.

### 5.1 KPIs (2 cards)

| Card | Valor | Descrição |
|------|-------|-----------|
| **Ticket Empresarial** | `R$ 485` | Ticket médio dos planos empresariais (média 4 vidas) |
| **Ticket Individual/Familiar** | `R$ 314` | Ticket médio dos planos individuais (média 2 vidas) |

### 5.2 Gráfico: Planos Mais Cotados (com seletor interativo)

- **Tipo:** BarChart com **toggle interativo** (Empresarial / Individual/Familiar)
- **Objetivo:** Comparar volume de cotações por tipo de plano ao longo das semanas
- **Interação:** Ao clicar em "Empresarial" ou "Individual/Familiar", o gráfico filtra mostrando apenas aquele tipo
- **Estado:** `activePlan: "empresarial" | "familiar"`

**Dados recebidos:**
```typescript
type PlanosCotacoes = {
  semana: string;       // "Sem 1" a "Sem 4"
  empresarial: number;  // cotações de planos empresariais
  familiar: number;     // cotações de planos individuais/familiares
}[]
```

**Valores mockados:**
| Semana | Empresarial | Familiar |
|--------|-------------|----------|
| Sem 1  | 2           | 3        |
| Sem 2  | 1           | 2        |
| Sem 3  | 2           | 2        |
| Sem 4  | 3           | 1        |

**Totais calculados dinamicamente:**
- Empresarial: `8` (soma dos valores)
- Familiar: `8` (soma dos valores)

**Cores:**
- Empresarial: `#38B3AB` (teal)
- Familiar: `#FB923C` (laranja)

### 5.3 Gráfico: Faixas Etárias

- **Tipo:** BarChart horizontal (layout vertical)
- **Objetivo:** Entender o perfil demográfico dos clientes interessados
- **Insight exibido:** "Faixa 16-20 anos lidera com 4 cotações"

**Dados recebidos:**
```typescript
type FaixasEtarias = {
  faixa: string;       // "16-20", "31-40", "41-50", "51-60"
  quantidade: number;  // número de clientes nessa faixa
}[]
```

**Valores mockados:**
| Faixa  | Quantidade |
|--------|-----------|
| 16-20  | 4         |
| 31-40  | 2         |
| 41-50  | 3         |
| 51-60  | 2         |

### 5.4 Gráfico: Clientes com Dependentes

- **Tipo:** RadarChart (gráfico de radar)
- **Objetivo:** Comparar a distribuição de dependentes entre Outubro e Novembro 2025
- **Insight exibido:** Variação percentual calculada dinamicamente (ex: "+X% em clientes com dependentes")

**Dados recebidos:**
```typescript
type DependentesDistribuicao = {
  dependentes: string;  // "0", "1", "2", "3", "4", "5+"
  outubro: number;      // clientes com X dependentes em outubro
  novembro: number;     // clientes com X dependentes em novembro
  label: string;        // rótulo descritivo
}[]
```

**Valores mockados:**
| Dependentes | Outubro | Novembro | Label |
|-------------|---------|----------|-------|
| 0           | 2       | 1        | Sem dependentes |
| 1           | 1       | 2        | 1 dependente |
| 2           | 2       | 2        | 2 dependentes |
| 3           | 1       | 1        | 3 dependentes |
| 4           | 1       | 2        | 4 dependentes |
| 5+          | 1       | 1        | 5 ou mais |

**Cálculos derivados:**
- `totalOutubro`: soma de todos os valores de outubro → `8`
- `totalNovembro`: soma de todos os valores de novembro → `9`
- `totalComDependentesOut`: clientes com ≥1 dependente em outubro → `6`
- `totalComDependentesNov`: clientes com ≥1 dependente em novembro → `8`
- `variacaoPercentual`: variação percentual entre os meses (fórmula dinâmica)

**Cores:**
- Outubro: `#9CA3AF` (cinza)
- Novembro: `#FB923C` (laranja)

---

## 6. Aba Qualidade

> Avaliação da qualidade de atendimento da IA Joana.

### 6.1 KPIs (2 cards)

| Card | Valor | Descrição |
|------|-------|-----------|
| **Taxa Compreensão** | `92%` | Percentual de mensagens compreendidas sem repetição |
| **Msgs Repetidas** | `8%` | Percentual de mensagens que precisaram ser repetidas (6 ocorrências) |

### 6.2 Score de Qualidade

- **Tipo:** Gráfico circular SVG customizado (progress ring)
- **Objetivo:** Exibir score geral de qualidade da IA em escala de 0-100
- **Valor:** `85/100`
- **Classificação:** "Excelente performance da Joana"
- **Visual:** Círculo SVG com `strokeDasharray` calculado como `2π × 56 × 0.85`

**Dado recebido:** Valor estático `85` (em produção seria calculado por algoritmo de qualidade).

### 6.3 Top Perguntas Frequentes

- **Tipo:** Lista com barras de progresso e tags de exemplos
- **Objetivo:** Identificar os temas mais recorrentes nas conversas para otimizar respostas e FAQ

**Dados recebidos:**
```typescript
type PerguntasFrequentes = {
  pergunta: string;    // categoria da pergunta
  frequencia: number;  // quantas vezes apareceu
  exemplos: string[];  // variações reais da pergunta
}[]
```

**Valores mockados:**
| Pergunta | Frequência | Exemplos |
|----------|-----------|----------|
| Valores e cotação | 12 | "quanto custa", "qual o valor", "preço do plano", "valor mensal" |
| Rede credenciada | 8 | "quais hospitais", "atende na região", "médicos credenciados" |
| Carência | 6 | "prazo de carência", "quando posso usar", "tem carência" |
| Inclusão de dependentes | 4 | "posso incluir depois", "adicionar dependente", "incluir família" |

**Visual:** Barra de progresso proporcional (máx = 12), com tags clicáveis mostrando as variações reais.

---

## 7. Assistente IA (Chat)

> Chat flutuante para consultas sobre os dados do dashboard.

### 7.1 Componente

- **Botão flutuante:** Canto inferior direito, gradiente laranja, badge com contagem de mensagens
- **Modal:** Ocupa 85% da altura da tela, com animação slide-up
- **Layout:** Header laranja → área de mensagens → input com envio

### 7.2 Funcionamento

O chat utiliza **keyword matching** para simular respostas contextuais:

| Keyword detectada | Tema da resposta |
|-------------------|-----------------|
| `conversão`, `taxa` | Análise detalhada da taxa de conversão (42.8%) com fatores de sucesso |
| `abandono`, `desistência` | Padrões de abandono (28.5%), perfil dos desistentes, recomendações |
| `horário`, `hora` | Distribuição de pico (10h-11h: 40%), recomendações de campanhas |
| `plano`, `produto` | Comparativo empresarial vs familiar com tickets médios |
| `dúvida`, `pergunta` | Top 5 dúvidas com percentuais e dica de conversão |
| `samara` | Análise de cliente específica (2 sessões, perfil recorrente) |
| `dependente`, `familia` | Comparativo Out/Nov com distribuição detalhada |
| *(qualquer outro)* | Resumo geral dos KPIs + sugestões de perguntas |

**Dados do estado:**
```typescript
type Message = {
  role: "user" | "assistant";
  content: string;
}

// Estados:
messages: Message[]       // histórico de mensagens
inputValue: string        // texto do input
isLoading: boolean        // indicador de carregamento (1.5s delay simulado)
isChatOpen: boolean       // visibilidade do modal
```

---

## 8. Estrutura de Dados

### 8.1 Resumo de todos os tipos

```typescript
// KPIs principais
interface KPIs {
  totalConversas: number;   // 7
  taxaConversao: number;    // 42.8
  ticketMedio: number;      // 430.5
  tempoMedio: number;       // 12.5
}

// Volume semanal
interface VolumeData {
  semana: string;
  conversas: number;
}

// Horário de pico (9 faixas)
interface HorarioPico {
  horario: string;
  mensagens: number;
}

// Engajamento por horário (4 picos com cores)
interface EngajamentoHorario {
  horario: string;
  mensagens: number;
  fill: string;
}

// Planos cotados por semana
interface PlanosCotacoes {
  semana: string;
  empresarial: number;
  familiar: number;
}

// Faixas etárias
interface FaixasEtarias {
  faixa: string;
  quantidade: number;
}

// Dependentes (comparativo mensal)
interface DependentesDistribuicao {
  dependentes: string;
  outubro: number;
  novembro: number;
  label: string;
}

// Perguntas frequentes
interface PerguntasFrequentes {
  pergunta: string;
  frequencia: number;
  exemplos: string[];
}

// Conversão semanal
interface ConversaoSemanal {
  semana: string;
  conversoes: number;
  abandono: number;
}

// Funil de conversão
interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

// Abandonos por etapa do funil
interface AbandonosFunil {
  etapa: string;
  abandonos: number;
}
```

### 8.2 Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Teal | `#38B3AB` | Cor primária, header, cotação, empresarial |
| Teal escuro | `#2a9890` | Gradiente do header |
| Laranja | `#FB923C` | Cor secundária, interesse, familiar, chat |
| Laranja escuro | `#f97316` | Gradiente do chat |
| Azul | `#155DFC` | Fechamento, gráficos de engajamento |
| Azul médio | `#3B82F6` | Barra secundária de engajamento |
| Azul claro | `#60A5FA` | Barra terciária |
| Azul mais claro | `#93C5FD` | Barra quaternária |
| Cinza | `#9CA3AF` | Dados de outubro (comparativo) |
| Vermelho | `#ef4444` | Abandonos, tendências negativas |
| Verde | `#22C55E` | Fechamento no funil, tendências positivas |

### 8.3 Configurações de Gráficos (ChartConfig)

Cada gráfico tem um objeto `ChartConfig` que define labels e cores para o componente `ChartContainer` do shadcn/ui:

| Config | Chaves | Uso |
|--------|--------|-----|
| `volumeConversasConfig` | `conversas` | Aba Geral - Volume |
| `jorneyChartConfig` | `cotacao`, `interesse`, `fechamento` | Aba Geral - Funil |
| `horarioPicoConfig` | `mensagens` | Aba Engajamento - Pico |
| `volumeHorarioConfig` | `mensagens` | Aba Engajamento - Volume |
| `planosConfig` | `empresarial`, `familiar` | Aba Produtos - Planos |
| `faixasEtariasConfig` | `quantidade` | Aba Produtos - Faixas |
| `dependentesConfig` | `outubro`, `novembro` | Aba Produtos - Dependentes |
| `conversaoConfig` | `conversoes`, `abandono` | Aba Performance - Conversão |
| `abandonoEtapaConfig` | `abandonos` | Aba Performance - Abandono |

---

## 9. Componentes Auxiliares

### 9.1 KPICard
```typescript
// Props
interface KPICardProps {
  title: string;      // título do indicador
  value: string | number; // valor exibido
  subtitle?: string;  // texto secundário
  trend?: number;     // variação % (positivo = verde ↑, negativo = vermelho ↓)
}
```

### 9.2 TabButton
```typescript
// Props
interface TabButtonProps {
  id: string;         // identificador da aba
  label: string;      // texto exibido
  active: boolean;    // se é a aba ativa
  onClick: () => void;
}
```
- Aba ativa: fundo branco, borda teal (`#38B3AB`), texto teal
- Aba inativa: fundo cinza claro, hover cinza médio

---

*Documentação gerada com base no código-fonte `src/pages/Index.tsx`. Última atualização: Março 2026.*
