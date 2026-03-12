# 📊 Dashboard da Joana (Agente IA - Saoodi)

**Documentação Técnica Central**

O **Dashboard da Joana** é a central analítica construída para monitorar as conversas, performance de atendimento, tráfego e qualidade automatizada pelo nosso Agente IA de planos de saúde.

Esta documentação provê uma visão unificada e detalhada de toda a arquitetura, abordando desde configurações Iniciais até a Engenharia de Análises na Edge Function e no Motor de IA (Gemini).

---

## 🚀 1. Setup e Variáveis de Ambiente (Environments & Setup)

O projeto é construído utilizando o ecossistema moderno: **React 18, TypeScript, Vite, Tailwind CSS e Shadcn UI**.

### Rodando o projeto localmente:

1. Clone o repositório e navegue até a pasta do projeto.
2. Instale as dependências com `npm install`.
3. Certifique-se de configurar o arquivo `.env` na raiz do projeto com as chaves:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. Inicie o servidor de desenvolvimento com `npm run dev`.

---

## 🏛️ 2. Arquitetura Front-end (Frontend Architecture)

A estrutura do projeto prioriza separação de responsabilidades e escopo cirúrgico.

### Roteamento Seguro (Routing)
A aplicação possui rotas delimitadas e controladas através do `react-router-dom`:
- **`/login`**: A view responsável por proteger e injetar autorização no sistema. A senha é imutável em plain text, a lógica processa através do algoritmo de Hash nativo do navegador (SHA-256 no Frontend, arquivo `Login.tsx`).
- **`/`**: View mestre do painel, renderizada apenas quando `localStorage` provém o token correspondente à validação positiva do MD5/Hash do login.

### Gerenciamento de Estado Global (State Management)
Usamos API Contextual via `DashboardContext.tsx` e injetamos o state via `useDashboard.ts` (Custom Hook). Isso evita o *prop-drilling* desnecessário em dezenas de componentes. O Context armazena:
- Data objects das queries
- Flags de tráfego (`isProcessing`, `isLoading`)
- A engine de intervalo atual (`selectedPeriod`)
- O handler universal de reload (`reload(true)`)

### Estrutura de Abas (Tab Navigation)
Subdividimos visões analíticas no `Index.tsx`, despachando dados para as respectivas `tabs`, mantendo as responsabilidades isoladas:
- `GeralTab`: KPIs essenciais e Funil de conversão (Bar charts, Area charts).
- `InsightsTab`: Constatações analíticas qualitativas textuais.
- `PerformanceTab`: Comparativo de conversão por etapa de abandono.
- `EngajamentoTab`: Métricas temporais, identificando picos e horários produtivos.
- `ProdutosTab`: Demografia do cliente (Faixa Etária), tipo de plano (Familiar/Empresarial) e quantidade de vínculos (Dependentes).
- `QualidadeTab`: KPIs que julgam assertividade do Bot versus chamados confusos.

---

## 🗄️ 3. Integração com Banco de Dados e Inteligência (Supabase Services & Analytics Engine)

Toda a aquisição de telemetria cruza com banco de dados remoto da Cloud via **Supabase**. O principal orquestrador visual está no arquivo `client.ts` dentro de `src/integrations/supabase`.

### A Engenharia de Análise Transacional (Analytics Engine & Edge Functions)
Anteriormente utilizava mocks estáticos. Hoje a métrica é produzida baseada nos contatos *real-time*.

**O Arquivo Mestre:** `src/services/analyticsEngine.ts`
Desempenha a função de Proxy Backend. O Engine captura as solicitações oriundas do Hook da interface do usuário (`forceRefetch`, `startDate`, `endDate`), mapeia as strings `ISO` e delega a responsabilidade massiva da computação dos dados para a Edge Function via RCP HTTPs POST.

**A Edge Function (`get-dashboard-metrics`) e o *Data Warehouse* Diário:**
A função serverless (Deno/Edge) alocada no Supabase é o coração analítico do sistema. Para lidar com **Big Data** (escala massiva de mensagens) sem perda de velocidade, implementamos uma arquitetura sólida de *Data Warehouse*:
1. **Consolidação de Sessões (`dash_sessoes_consolidadas`)**: Uma rotina automática (`consolidateSessions`) varre o fluxo bruto de mensagens do dia anterior (`dash_mensagens_realtime`) e as comprime em métricas prontas (uma linha por sessão). Dados qualitativos como objeção, abandono e ticket estimado já são agrupados previamente.
2. **Leitura Híbrida Inteligente**: Quando o dashboard solicita o período atual, a Engine reconstrói perfeitamente o cenário mesclando o pacote leve da tabela consolidada com as poucas mensagens novas "em tempo real" do dia em curso. 
3. **Agregação e Fidelidade**: Transforma essa leitura veloz nos objetos `DashboardMetrics` necessários para a UI Front-end.

**Benefício da Arquitetura:** O sistema carrega milhares de conversões em frações de segundo sem Timeouts. Libera o banco Supabase de escaneamentos completos exaustivos (Full Table Scans) diários e garante suporte robusto ao crescimento acelerado da operação comercial.

---

## 🧠 4. O Motor de IA Embutido (Gemini AI Integration)

O **Assistente Flutuante (Floating Chat)** não apenas interage de forma chata, mas age de fato interpretando como um **Especialista/CTO** da empresa Saoodi, sendo parametrizado por nós utilizando os dados transientes processados.

### Arquitetura (`src/services/geminiService.ts`):
Componente injetável em Cloud. Em vez de uma busca vetorial complexa, o Dashboard usa a estratégia de RAG Dinâmico Front-end (Injected Context):
1. **Model:** `gemini-2.5-flash-lite`.
2. O Chat pega toda a interface crua (`kpis`, `funnelStages`, `horariosDePico`) proveniente da Edge Function e converte isso numa formatação String (JSON.stringify de `dashboardContext`), alocando esse conhecimento efêmero no prompt base ("system prompt").
3. A Joana absorve todos os parâmetros reais daquele gráfico no momento. Quando perguntada "E qual conversão?", a Joana não apenas acha no arquivo, ela reflete, pondera o contexto analítico setado nos promts (sendo a Saoodi, sendo um Analista Sênior) e entrega análises concisas em texto pro usuário baseado no instante presente do sistema.

---

## 🎨 5. Design System e Estilização (Aesthetics)

Aplicamos um design limpo, focado em alta legibilidade e sofisticação:

1. **Tokens de CSS Moderno (Tailwind):** Todas as paletas (base, primária, secundária, erros) são gerenciadas em formato de Variáveis de Cor Absoluta HSL em `src/index.css` e chamadas universalmente nas strings Tailwind (`bg-primary`, `text-primary-foreground`).
2. **Tipografia Premium:**
   - O corpo padrão de textos para legibilidade profunda utiliza `Poppins`.
   - Elementos em destaque logístico e tipográfico, especialmente os Headers de acesso `/login`, foram engatados na exclusiva e moderna `PublicaPlay` via tag do Tailwind `font-publica`.
3. **Identidade Visual:** Trabalhamos paletas de Teal (`#38B3AB`) como matiz core da marca Saoodi, com alertas discretos variando entre o Indigo/Gray moderno, proporcionando maturidade na visualização do dashboard.
