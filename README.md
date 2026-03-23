# 📊 Dashboard da Joana (Agente IA - Saoodi)

**Documentação Técnica Central**

O **Dashboard da Joana** é a central analítica construída para monitorar as conversas, performance de atendimento, tráfego e qualidade automatizada pelo nosso Agente IA de planos de saúde.

Esta documentação provê uma visão unificada e detalhada de toda a arquitetura, abordando desde configurações Iniciais até a Engenharia de Análises na Edge Function e no Motor de IA (Gemini).

---

## 📍 Sumário
- [1. Setup e Variáveis de Ambiente](#-1-setup-e-variáveis-de-ambiente-environments--setup)
- [2. Scripts do Projeto](#-2-scripts-do-projeto)
- [3. Arquitetura Front-end](#-3-arquitetura-front-end-frontend-architecture)
- [4. Integração com Banco de Dados e Inteligência](#-4-integração-com-banco-de-dados-e-inteligência-supabase-services--analytics-engine)
- [5. O Motor de IA Embutido (Gemini)](#-5-o-motor-de-ia-embutido-gemini-ai-integration)
- [6. Manutenção e Edge Functions](#-6-manutenção-e-edge-functions)
- [7. Design System e Estilização](#-7-design-system-e-estilização-aesthetics)

---

## 🚀 1. Setup e Variáveis de Ambiente (Environments & Setup)

O projeto utiliza **React 18, TypeScript, Vite, Tailwind CSS e Shadcn UI**.

### Configuração:
1. Instale as dependências: `npm install`
2. Configure o arquivo `.env` na raiz:
   - `VITE_SUPABASE_URL`: URL do projeto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima para acesso ao client.
   - `VITE_GEMINI_API_KEY`: Chave da API do Google AI (Gemini).

---

## 🛠️ 2. Scripts do Projeto

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor local em `http://localhost:8080/`. |
| `npm run build` | Gera o bundle de produção na pasta `/dist`. |
| `npm run build:dev` | Gera build em modo desenvolvimento para debug rápido. |
| `npm run lint` | Executa o ESLint para validação de código. |
| `npm run preview` | Visualiza localmente o build gerado. |

---

## 🏛️ 3. Arquitetura Front-end (Frontend Architecture)

### Roteamento Seguro (Routing)
- **`/login`**: View de autenticação. A senha é processada via Hash nativo (SHA-256 no Frontend, arquivo `Login.tsx`).
- **`/`**: Dashboard mestre, acessível via token em `localStorage`.

### Gerenciamento de Estado
Via `DashboardContext.tsx` e custom hook `useDashboard.ts`. Centraliza:
- Objetos de dados e métricas.
- Flags de tráfego (`isProcessing`, `isLoading`).
- Motor de intervalo (`selectedPeriod`) e reload global (`reload(true)`).

### Estrutura de Abas (Tabs)
As visões são isoladas em `Index.tsx`:
- `GeralTab`: KPIs essenciais e Funil.
- `InsightsTab`: Análises qualitativas textuais geradas via IA.
- `PerformanceTab`: Taxas de conversão e abandono.
- `EngajamentoTab`: Mapas de calor e horários de pico.
- `ProdutosTab`: Demografia, tipos de plano e dependentes.
- `QualidadeTab`: KPIs de assertividade do Agente.

---

## 🗄️ 4. Integração com Banco de Dados e Inteligência (Supabase Services & Analytics Engine)

### A Engenharia de Análise Transacional (Analytics Engine & Edge Functions)
A métrica do dashboard é produzida dinamicamente baseada nos contatos *real-time* processados em memória.

**O Arquivo Mestre:** `src/services/analyticsEngine.ts`
Desempenha a função de Proxy Backend. O Engine captura as solicitações da interface, mapeia as datas e utiliza a **Edge Function** para realizar a computação massiva dos dados.

**A Edge Function e o Sistema de Cache:**
A função serverless (Deno/Edge) alocada no Supabase é o coração analítico. Para manter a performance sem processar milhares de mensagens a cada reload, implementamos um sistema de persistência de estado:
1. **Cache de Métricas (`dash_metrics_cache`)**: Os resultados processados (KPIs, listas e gráficos) são armazenados em um objeto JSON cacheado. Isso garante carregamento instantâneo para acessos recorrentes.
2. **Leitura Sob Demanda (`dash_mensagens_realtime`)**: Quando o cache expira ou um novo período é solicitado, a Engine lê o fluxo bruto de mensagens diretamente da tabela de mensagens em tempo real no schema `dashboard`. 
3. **Agregação em Tempo Real**: Os milhares de registros são agrupados por sessão de atendimento, identificando automaticamente as etapas do funil, tickets e intenções do cliente.

**Benefício da Arquitetura:** Elimina a necessidade de tabelas intermediárias de consolidação, garantindo que o dashboard reflita exatamente a realidade do banco de dados a cada atualização forçada.

---

## 🧠 5. O Motor de IA Embutido (Gemini AI Integration)

Utilizamos a estratégia de **RAG Dinâmico (Context Injection)**:

- **Modelo:** `gemini-2.5-flash-lite`.
- **Estratégia:** O dashboard injeta o estado atual (KPIs, Funis) no prompt base da Joana.
- **Quota Handling:** O serviço possui tratamento nativo para erros 429 (limite excedido), informando o tempo de espera necessário para o usuário.

---

## ⚡ 6. Manutenção e Edge Functions

### Deploy de Funções:
O projeto inclui um utilitário exclusivo para facilitar a compilação local de dependências complexas na Edge:
- **`build_edge.cjs`**: Script que auxilia no empacotamento da Edge Function antes do deploy, garantindo compatibilidade com o runtime do Supabase.

### Estrutura Supabase:
- `/supabase/functions/get-dashboard-metrics/`: Contém a lógica de agregação SQL e IA.
- `/supabase/migrations/`: Histórico de evolução do esquema do banco.

---

## 🎨 7. Design System e Estilização (Aesthetics)

1. **Tokens HSL:** Paletas gerenciadas em `src/index.css`.
2. **Tipografia:** 
   - `Poppins` para legibilidade.
   - `PublicaPlay` (`font-publica`) para headers e marca.
3. **Identidade Visual:** Trabalhamos paletas de Teal (`#38B3AB`) como matiz core da marca Saoodi, com alertas discretos variando entre o Indigo/Gray moderno, proporcionando maturidade na visualização do dashboard.
