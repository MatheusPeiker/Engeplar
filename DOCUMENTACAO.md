# Sistema Engenharia — Documentação Completa

> Documento de referência técnica ("segundo cérebro") cobrindo arquitetura, banco de dados, módulos, padrões de código e auditoria de segurança completa.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Banco de Dados — Schema Supabase](#4-banco-de-dados--schema-supabase)
5. [Arquitetura da Aplicação](#5-arquitetura-da-aplicação)
6. [Módulos e Páginas](#6-módulos-e-páginas)
7. [AppContext — Estado Global](#7-appcontext--estado-global)
8. [Autenticação e Rotas Protegidas](#8-autenticação-e-rotas-protegidas)
9. [Auditoria de Segurança — 12 Vulnerabilidades Corrigidas](#9-auditoria-de-segurança--12-vulnerabilidades-corrigidas)
10. [Padrões e Convenções do Código](#10-padrões-e-convenções-do-código)
11. [Migrations SQL (Histórico)](#11-migrations-sql-histórico)
12. [Deploy](#12-deploy)

---

## 1. Visão Geral

Sistema de gestão para empresas de engenharia e construção civil. Multi-tenant via Supabase Auth: cada usuário vê e edita apenas seus próprios dados (RLS). SPA React sem backend próprio — toda lógica de acesso é delegada ao Supabase.

**Funcionalidades principais:**
- Gestão de obras (status, orçamento, gastos)
- Orçamentos com itens, mão de obra e mobilização
- Propostas comerciais com PDF export
- Cronograma de etapas por obra
- Controle de funcionários e desempenho
- Financeiro (transações, compras/suprimentos)
- Catálogo de preços
- Contatos (clientes e fornecedores) com auto-fill por CNPJ
- Relatórios e dashboard
- Histórico de alterações com undo
- Perfil de empresa com busca CNPJ

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| UI | React | 19.x |
| Build | Vite | 8.x |
| Roteamento | react-router-dom | 7.x |
| Banco / Auth | Supabase (PostgreSQL) | JS SDK 2.x |
| Mapas | react-leaflet + leaflet | 5.x / 1.9.x |
| Gráficos | recharts | 3.x |
| Ícones | lucide-react | 1.x |
| Deploy | Vercel (SPA) | — |

---

## 3. Estrutura de Arquivos

```
src/
├── main.jsx                  # Entry point — BrowserRouter + AppProvider
├── App.jsx                   # Rotas + ProtectedRoute
├── index.css                 # CSS global (variáveis, utilitários)
├── assets/
│   └── logo.jpeg
├── components/
│   ├── InlineEdit.jsx        # Campo editável inline (clique para editar)
│   ├── Modal.jsx             # Modal genérico
│   ├── MapaEquipes.jsx       # Mapa Leaflet com localização das obras
│   └── Layout/
│       └── AppLayout.jsx     # Shell: sidebar + header + outlet
├── context/
│   └── AppContext.jsx        # Estado global + todas as chamadas Supabase
├── lib/
│   └── supabase.js           # Cliente Supabase (createClient)
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── Obras.jsx
    ├── ObraDetalhes.jsx      # Tabs: resumo, proposta, equipe, cronograma, arquivos
    ├── Orcamentos.jsx        # Orçamentos + PDF export
    ├── Proposta.jsx          # Propostas + PDF export
    ├── Cronograma.jsx
    ├── Financeiro.jsx
    ├── Funcionarios.jsx
    ├── Compras.jsx
    ├── Relatorios.jsx
    ├── TabelaPrecos.jsx      # Catálogo de preços
    ├── Historico.jsx         # Log de alterações + undo
    ├── Arquivos.jsx
    ├── Contatos.jsx          # Clientes + Fornecedores + busca CNPJ
    └── Perfil.jsx            # Dados empresa + busca CNPJ

supabase/
├── schema.sql                # Schema completo v1 (16 tabelas + RLS)
├── schema_v2.sql             # Extras de orçamento (mobilização, mão de obra)
└── schema_v3.sql             # Tabela historico + coluna status em propostas
```

---

## 4. Banco de Dados — Schema Supabase

### Tabelas (16 total)

Todas as tabelas têm:
- `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL`
- `created_at TIMESTAMPTZ DEFAULT NOW()`

| Tabela | Descrição | Chave Estrangeira Notável |
|--------|-----------|--------------------------|
| `empresa` | Dados da empresa (1 por usuário) | `user_id UNIQUE` |
| `clientes` | Clientes | — |
| `fornecedores` | Fornecedores | — |
| `obras` | Obras (com lat/lng) | — |
| `gastos_despesas` | Despesas de obra | `obra_id → obras` ON DELETE CASCADE |
| `orcamentos` | Orçamentos | `obra_id → obras` ON DELETE SET NULL |
| `orcamento_itens` | Itens de orçamento | `orcamento_id → orcamentos` ON DELETE CASCADE |
| `propostas` | Propostas comerciais | `obra_id`, `orcamento_id` ON DELETE SET NULL |
| `cronogramas` | Etapas/cronograma | `obra_id → obras` ON DELETE CASCADE |
| `arquivos` | Arquivos vinculados | `obra_id → obras` ON DELETE CASCADE |
| `funcionarios` | Equipe | `obra_atual_id → obras` ON DELETE SET NULL |
| `registros_desempenho` | Desempenho mensal | `funcionario_id → funcionarios` ON DELETE CASCADE |
| `catalogo` | Catálogo de preços | — |
| `transacoes` | Financeiro | `obra_id → obras` ON DELETE SET NULL |
| `compras` | Requisições/Compras | `obra_id → obras` ON DELETE SET NULL |
| `historico` | Log de alterações (undo) | `obra_id → obras` ON DELETE SET NULL |

### RLS — Row Level Security

Todas as 16 tabelas têm RLS habilitado com a mesma policy:

```sql
CREATE POLICY "own_data" ON <tabela>
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Isso garante isolamento total entre usuários no nível do banco.

### Coluna extra: `propostas.status`

Adicionada na v3:
```sql
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'rascunho';
```

### Coluna extra: `orcamentos.extras`

Adicionada na v2: campo JSONB para armazenar mão de obra e mobilização do orçamento.

---

## 5. Arquitetura da Aplicação

```
BrowserRouter
└── AppProvider (AppContext)
    └── App
        ├── /login → Login (público)
        └── / → ProtectedRoute → AppLayout
            ├── index → Dashboard
            ├── obras → Obras
            ├── obras/:id → ObraDetalhes
            ├── financeiro → Financeiro
            ├── funcionarios → Funcionarios
            ├── orcamentos → Orcamentos
            ├── proposta → Proposta
            ├── cronograma → Cronograma
            ├── arquivos → Arquivos
            ├── compras → Compras
            ├── relatorios → Relatorios
            ├── catalogo → TabelaPrecos
            ├── historico → Historico
            ├── perfil → Perfil
            └── contatos → Contatos
```

**ProtectedRoute** redireciona para `/login` se `isAuthenticated` for falso. Enquanto `authLoading` for `true`, exibe tela de loading — evita flash de redirect antes do Supabase confirmar a sessão.

---

## 6. Módulos e Páginas

### ObraDetalhes
Tabs dentro da página de detalhe de uma obra:
- **Resumo**: métricas financeiras, gastos, progresso
- **Proposta**: proposta vinculada à obra + botão exportar PDF
- **Equipe**: funcionários alocados
- **Cronograma**: linha do tempo das etapas
- **Arquivos**: documentos vinculados

### Orçamentos
Editor completo com 3 seções:
1. Itens de materiais (tabela com descrição, unidade, quantidade, custo unitário)
2. Mão de obra (funcionários com dias previstos)
3. Mobilização (veículo, distância, viagens, pessoas, custos adicionais)

Todos os 3 campos de export PDF sanitizados com `esc()`.

### Propostas
Vinculada a orçamento + obra. Status: `rascunho`, `enviada`, `aprovada`, `recusada`. PDF com dados da empresa, cliente, itens do orçamento e condições.

### Contatos
Aba Clientes + aba Fornecedores em uma só página. Busca automática de CNPJ via BrasilAPI para preencher nome, endereço, telefone e e-mail.

### Histórico
Log de todas as alterações registradas pelo `registrarAlteracao()`. Cada entrada tem botão de desfazer (undo) que reverte o valor no banco.

### Perfil
Dados da empresa com busca por CNPJ. Upload de logo por caminho de arquivo.

---

## 7. AppContext — Estado Global

Arquivo: `src/context/AppContext.jsx`

### Padrão Optimistic Update

Toda operação de escrita segue o padrão:
1. Gera `tempId = 'tmp_' + Date.now()`
2. Atualiza o estado local imediatamente (UI instantânea)
3. Chama o Supabase de forma assíncrona
4. Se sucesso: substitui `tempId` pelo UUID real do banco
5. Se erro: reverte o estado local

```javascript
const addCliente = async (c) => {
  const tempId = `tmp_${Date.now()}`;
  setClientes(prev => [{ ...c, id: tempId }, ...prev]);           // optimistic
  const { data, error } = await supabase.from('clientes')
    .insert({ ...c, user_id: uid() }).select().single();
  if (error) { setClientes(prev => prev.filter(x => x.id !== tempId)); return; }
  setClientes(prev => prev.map(x => x.id === tempId ? data : x)); // real id
};
```

### sessionRef — evitar stale closure

```javascript
const sessionRef = useRef(null);
useEffect(() => { sessionRef.current = session; }, [session]);
const uid = () => sessionRef.current?.user?.id;
```

`uid()` sempre lê o valor atual da sessão, sem ser capturado em closures antigas.

### updateEmpresa — single-field upsert

```javascript
await supabase.from('empresa').upsert(
  { user_id: uid(), [campoToDb(campo)]: valor, updated_at: new Date().toISOString() },
  { onConflict: 'user_id' }
);
```

Envia apenas o campo alterado — elimina race condition onde duas atualizações rápidas sobrescrevem uma à outra com valor stale.

### Normalizers

Funções `norm.obra()`, `norm.funcionario()`, etc. traduzem snake_case do banco para camelCase da app.

---

## 8. Autenticação e Rotas Protegidas

### Supabase Auth

```javascript
// Login
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Cadastro
const { error } = await supabase.auth.signUp({ email, password });

// Logout
await supabase.auth.signOut();
```

### Listener de sessão

```javascript
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session);
  setAuthLoading(false);
});
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
});
```

### clearAllData no logout

Quando `session` se torna `null`, `clearAllData()` limpa todos os estados React — evita que dados de um usuário persistam na memória quando outro faz login na mesma aba.

### Validação de senha no cadastro

```javascript
const validatePassword = (pwd) => {
  if (pwd.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(pwd)) return 'Inclua ao menos uma letra maiúscula';
  if (!/[0-9]/.test(pwd)) return 'Inclua ao menos um número';
  return null;
};
```

### Rate limiting no login (client-side)

5 tentativas incorretas consecutivas bloqueiam o formulário por 60 segundos.

---

## 9. Auditoria de Segurança — 12 Vulnerabilidades Corrigidas

A seguir o registro completo da auditoria realizada: o problema encontrado, o risco, e a correção aplicada.

---

### C1 — XSS em PDF Export (Crítico)

**Arquivos:** `Orcamentos.jsx`, `Proposta.jsx`, `ObraDetalhes.jsx`

**Problema:** Os três módulos exportavam PDF usando `window.open('', '_blank')` seguido de `document.write(htmlString)`. A janela aberta compartilha a mesma origem (`same-origin`) da SPA. Campos controlados pelo usuário eram interpolados diretamente na string HTML sem escape. Qualquer `<script>` ou atributo `onerror="..."` num nome de obra, item ou cliente seria executado com acesso ao `localStorage` — onde o JWT do Supabase fica armazenado.

**Correção:** Função `esc()` adicionada em cada arquivo. Todo valor controlado pelo usuário passa por ela antes de entrar no HTML:

```javascript
const esc = (s) => s == null ? '' : String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
```

Uso: `esc(obra.nome)`, `esc(i.descricao)`, `esc(empresa.cnpj)`, etc.

---

### A1 — Injeção de Coluna via `reverterAlteracao` (Alto)

**Arquivo:** `AppContext.jsx`

**Problema:** A função `reverterAlteracao` usava `alt.campo` (campo vindo do banco, tabela `historico`) diretamente como chave de coluna no `.update({ [alt.campo]: valor })`. Se um registro malicioso fosse inserido na tabela `historico` com `campo = 'user_id'`, um usuário poderia tentar mudar a propriedade de um registro para outro `user_id`.

**Correção:** Whitelist de campos permitidos por `entityType`:

```javascript
const ALLOWED_CAMPOS = {
  obra:        new Set(['nome', 'endereco', 'status', 'orcamento', 'previsao']),
  gasto:       new Set(['descricao', 'valor', 'data', 'categoria']),
  proposta:    new Set(['nome', 'clienteNome', ...]),
  cronograma:  new Set(['etapa', 'dataInicio', 'dataFim', 'custo', 'progresso', 'cor']),
  funcionario: new Set(['nome', 'funcao', 'custoDiaria', ...]),
  catalogo:    new Set(['nome', 'tipo', 'custo']),
  transacao:   new Set(['descricao', 'data', 'valor', 'tipo', 'status']),
};

if (!ALLOWED_CAMPOS[alt.entityType]?.has(alt.campo)) return; // aborta
```

Além disso, cada `case` do `switch` tem seu próprio mapa explícito `campo → coluna_db`, e todo `update()` inclui `.eq('user_id', currentUid)`.

---

### A2 — Tabela `historico` sem RLS (Alto)

**Arquivo:** `supabase/schema_v3.sql`

**Problema:** A tabela `historico` havia sido criada mas sem `ENABLE ROW LEVEL SECURITY` nem policy associada. Qualquer usuário autenticado conseguia ler e inserir registros de outros usuários.

**Correção:**

```sql
ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data" ON historico
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### A3 — Race Condition em `updateEmpresa` (Alto)

**Arquivo:** `AppContext.jsx`

**Problema:** A versão anterior fazia upsert do objeto `empresa` inteiro, capturado no closure no momento do render. Duas chamadas rápidas (ex: usuário altera nome e depois endereço em menos de 300ms) resultavam em: segunda chamada lê o snapshot antigo (sem o nome atualizado) e sobrescreve o banco com um estado stale.

**Correção:** Upsert single-field — envia apenas o campo alterado:

```javascript
await supabase.from('empresa').upsert(
  { user_id: uid(), [campoToDb(campo)]: valor, updated_at: new Date().toISOString() },
  { onConflict: 'user_id' }
);
```

---

### A4 — UPDATE/DELETE sem filtro `user_id` (Alto)

**Arquivo:** `AppContext.jsx`

**Problema:** Mais de 30 operações de `update()` e `delete()` filtravam apenas por `id` do registro (`.eq('id', id)`). Se o RLS fosse desativado acidentalmente no painel do Supabase, qualquer usuário autenticado conseguiria modificar ou deletar dados de outros usuários apenas conhecendo o UUID do registro.

**Correção:** Todas as operações encadeiam `.eq('user_id', uid())`:

```javascript
// Antes
await supabase.from('clientes').update({ [campo]: valor }).eq('id', id);

// Depois
await supabase.from('clientes').update({ [campo]: valor }).eq('id', id).eq('user_id', uid());
```

Aplicado a todas as tabelas: `clientes`, `fornecedores`, `obras`, `gastos_despesas`, `orcamentos`, `orcamento_itens`, `propostas`, `cronogramas`, `arquivos`, `funcionarios`, `registros_desempenho`, `catalogo`, `transacoes`, `compras`, `historico`.

---

### M2 — `versoes` não limpa no logout (Médio)

**Arquivo:** `AppContext.jsx`

**Problema:** `clearAllData()` limpava todos os estados ao fazer logout, exceto `versoes`. Dados de versões de orçamento/proposta da sessão anterior permaneciam em memória se outro usuário fizesse login na mesma aba.

**Correção:**

```javascript
const clearAllData = () => {
  setEmpresa(DEFAULT_EMPRESA); setClientes([]); setFornecedores([]);
  setObras([]); setListaOrcamentos([]); setPropostas([]);
  setCronogramas([]); setArquivos([]); setFuncionarios([]);
  setRegistrosDesempenho([]); setCatalogo([]); setTransacoes([]);
  setCompras([]); setHistorico([]); setVersoes([]); // ← adicionado
};
```

---

### M3 — `deleteObra` deixava funcionários com `obraAtualId` stale (Médio)

**Arquivo:** `AppContext.jsx`

**Problema:** Ao deletar uma obra, o banco executava `ON DELETE SET NULL` na coluna `obra_atual_id` dos funcionários — mas o estado React local não era atualizado. Funcionários continuavam "alocados" a uma obra que não existia mais até o próximo reload.

**Correção:**

```javascript
setFuncionarios(prev =>
  prev.map(f => f.obraAtualId === obraId ? { ...f, obraAtualId: null } : f)
);
```

---

### M4 — Sem rate limiting no login (Médio)

**Arquivo:** `Login.jsx`

**Problema:** O formulário de login não tinha nenhuma limitação de tentativas. Um atacante poderia tentar senhas indefinidamente (brute force).

**Correção:** Após 5 falhas consecutivas, o formulário trava por 60 segundos:

```javascript
const next = failedAttempts + 1;
if (next >= 5) {
  setLockUntil(Date.now() + 60_000);
  setFailedAttempts(0);
  setError('Muitas tentativas incorretas. Aguarde 60 segundos.');
} else {
  setFailedAttempts(next);
  setError(result.error || 'E-mail ou senha incorretos.');
}
```

---

### M5 — Senha fraca no cadastro (Médio)

**Arquivo:** `Login.jsx`

**Problema:** Não havia validação de força de senha no cadastro. Senhas de 1 caractere eram aceitas.

**Correção:** Validação obrigatória no modo `signup`:

```javascript
const validatePassword = (pwd) => {
  if (pwd.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(pwd)) return 'Inclua ao menos uma letra maiúscula';
  if (!/[0-9]/.test(pwd)) return 'Inclua ao menos um número';
  return null;
};
```

---

### M6 — Dados da BrasilAPI sem sanitização (Médio)

**Arquivos:** `Contatos.jsx`, `Perfil.jsx`

**Problema:** Dados vindos da API externa `brasilapi.com.br/api/cnpj/v1/` eram usados diretamente para popular campos de estado React sem validação de tipo, remoção de caracteres especiais ou limite de tamanho. Uma resposta maliciosa da API poderia injetar HTML em campos subsequentemente renderizados.

**Correção:** Função de sanitização aplicada a todos os campos recebidos:

```javascript
const san = (v, max = 200) =>
  v == null ? '' : String(v).replace(/[<>"']/g, '').trim().substring(0, max);
```

Aplicada com limites específicos: `san(data.razao_social)` (200), `san(data.ddd_telefone_1, 20)`, `san(data.email, 150)`, partes do endereço com `san(s, 100)`.

---

### B1 — JWT raw exposto no contexto React (Baixo)

**Arquivo:** `AppContext.jsx`

**Problema:** O objeto `session` (contendo o JWT completo do Supabase) era exportado no valor do Provider, tornando-o acessível a qualquer componente via `useAppContext()`.

**Correção:** `session` removido do `Provider value`. Componentes recebem apenas:
- `isAuthenticated` (boolean)
- `user` (nome + email)
- Funções de auth: `login`, `signUp`, `logout`

---

### Itens avaliados como aceitáveis (não corrigidos)

| ID | Item | Motivo |
|----|------|--------|
| C2 | Chave `anon` do Supabase no bundle | Comportamento esperado pelo design do Supabase. O RLS é a barreira real; a anon key sem JWT autenticado não lê dados protegidos. |
| B3 | Campo `logo` aceita qualquer string | `<img src>` não executa `javascript:` em browsers modernos por padrão. Risco residual mínimo. |
| B4 | Coordenadas SP hardcoded | Não é risco de segurança — apenas imprecisão geográfica. |
| B5 | `versoes` apenas em memória | Perda de dado no reload, não risco de segurança. |
| B2 | Sem feedback de erro em writes | UX issue, não segurança. |

---

## 10. Padrões e Convenções do Código

### Sanitização HTML (esc)

Sempre que dados do usuário forem interpolados em strings HTML (ex: PDF export via `document.write`):

```javascript
const esc = (s) => s == null ? '' : String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
```

### Sanitização de APIs externas

Dados de qualquer API externa que popula campos de texto:

```javascript
const san = (v, max = 200) =>
  v == null ? '' : String(v).replace(/[<>"']/g, '').trim().substring(0, max);
```

### Operações Supabase com duplo filtro

Todo `update()` e `delete()` deve filtrar por `id` E `user_id`:

```javascript
supabase.from('tabela').update({...}).eq('id', id).eq('user_id', uid())
supabase.from('tabela').delete().eq('id', id).eq('user_id', uid())
```

### Normalizers snake_case → camelCase

Todas as respostas do Supabase passam pelos normalizers em `AppContext.jsx`:

```javascript
const norm = {
  obra: (r) => ({ id: r.id, nome: r.nome, endereco: r.endereco, ... }),
  funcionario: (r) => ({ id: r.id, custoDiaria: r.custo_diaria, ... }),
  // ...
};
```

### InlineEdit

Componente reutilizável para campos editáveis inline (clique → input → blur salva):

```jsx
<InlineEdit value={empresa.cnpj} onSave={(v) => updateEmpresa('cnpj', v)} />
```

---

## 11. Migrations SQL (Histórico)

### schema.sql — v1 (base)
- 15 tabelas (empresa, clientes, fornecedores, obras, gastos_despesas, orcamentos, orcamento_itens, propostas, cronogramas, arquivos, funcionarios, registros_desempenho, catalogo, transacoes, compras)
- 13 índices
- RLS + policy `own_data` para as 15 tabelas

### schema_v2.sql — v2
- Coluna `extras JSONB` na tabela `orcamentos` (armazena mão de obra e mobilização como JSON)

### schema_v3.sql — v3
- Tabela `historico` com RLS + policy `own_data`
- Índices `idx_historico_user` e `idx_historico_obra`
- Coluna `status TEXT DEFAULT 'rascunho'` na tabela `propostas`

### SQL Completo Idempotente

Para recriar o schema do zero em um projeto Supabase vazio, execute os três arquivos em ordem (`schema.sql` → `schema_v2.sql` → `schema_v3.sql`). Todos usam `IF NOT EXISTS` e `ADD COLUMN IF NOT EXISTS` — podem ser re-executados sem erro.

---

## 12. Deploy

### Variáveis de ambiente (`.env.local`)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Vercel

`vercel.json` configurado para SPA routing (redireciona todas as rotas para `index.html`):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Build

```bash
npm run build    # gera /dist
npm run preview  # serve /dist localmente
```

---

*Documento gerado em 18/05/2026. Projeto: MatheusPeiker/Engeplar.*
