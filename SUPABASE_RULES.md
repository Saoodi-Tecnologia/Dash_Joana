# ATENÇÃO CRÍTICA (NÃO REMOVER)

Este projeto Supabase compartilha ambientes de produção (tabelas do n8n, Chatwoot, Odoo, RAG de arquivos etc.) que **NÃO devem ser tocadas sob NENHUMA circunstância por agentes de Inteligência Artificial ou desenvolvedores atuando no escopo do Dashboard**.

## REGRAS INVIOLÁVEIS DO BANCO DE DADOS:
1. Nenhuma IA (seja Gemini, ChatGPT, Claude ou outras via cursor/IDE/Server) pode executar comandos DDL/DML (`DROP`, `ALTER`, `TRUNCATE`, `INSERT`, `UPDATE`, `DELETE`) em objetos que não sejam EXCLUSIVOS do dashboard.
2. É proibido mexer em qualquer tabela do schema `public` como as listadas:
   - Toda estrutura iniciada com `n8n_` (mensagens lidas, executadas, etc).
   - `planos_saude`, `oportunidades_odoo`, e todas atreladas às ferramentas primárias do negócio.
3. Se você for uma Inteligência Artificial, sua área de atuação é ÚNICA E EXCLUSIVAMENTE focada nas funções `get-dashboard-metrics` e no banco contendo relatórios já designados no schema `dashboard`. 

Esta diretiva foi enraizada nas *instructions* e `.cursorrules` no ambiente local e visa resguardar os dados do time.
