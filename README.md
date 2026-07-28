# Sistema Engenharia

Sistema de gestão para empresas de engenharia e construção civil. SPA em React + Vite,
sem backend próprio: os dados ficam no Supabase (Postgres + Auth), com RLS por usuário.

## Rodando localmente

```bash
npm install
```

```bash
npm run dev
```

Crie um `.env.local` na raiz com as chaves do seu projeto Supabase:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Outros comandos: `npm run build`, `npm run preview`, `npm run lint`.

## Banco de dados

Os arquivos em `supabase/` são migrations em ordem: rode `schema.sql` primeiro e depois
as versões `schema_v2` … `schema_v8` no SQL Editor do Supabase. Todas são idempotentes.

## Módulos

| Área | Rota | O que faz |
|---|---|---|
| Dashboard | `/` | KPIs, fluxo financeiro, alertas de orçamento estourado |
| Obras | `/obras`, `/obras/:id` | Obras e suas abas: resumo, equipe, gastos, cronograma, arquivos e RTE |
| Financeiro | `/financeiro` | Entradas e saídas por obra |
| Equipe | `/funcionarios` | Profissionais, alocação, mapa e registros de desempenho |
| Contatos | `/contatos` | Clientes e fornecedores |
| PTCs | `/ptc` | Proposta Técnica Comercial: cliente, escopo, preços, PDF e geração de obra |
| Compras | `/compras` | Requisições e cotações |
| Catálogo | `/catalogo` | Tabela de preços de materiais e serviços |
| Relatórios | `/relatorios` | Gráficos de lucro, obras, equipe, clientes e fornecedores |
| Histórico | `/historico` | Log de alterações com desfazer |
| RVTs | `/rvt` | Relatório de Vistoria Técnica |

A PTC é a origem do valor comercial do sistema: dela saem a receita usada nos relatórios,
o rateio de valor gerado por profissional e a criação da obra.

## Documentos gerados

PTC, RVT e RTE são montados como HTML em `src/templates/` (base comum em `documentoBase.js`)
e abertos em nova janela para impressão/PDF. Para conferir o layout do RTE sem subir o app:

```bash
node verify_print.mjs
```

## Referência técnica

`DOCUMENTACAO.md` traz arquitetura, schema, padrões de código e auditoria de segurança.
