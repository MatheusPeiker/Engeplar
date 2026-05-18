# 📋 Análise Completa — Sistema de Engenharia

## Visão Geral do Sistema

Sistema ERP web para construtoras/engenharia, construído em **React + Vite**, com dados em memória (sem backend/banco de dados). Usa roteamento com `react-router-dom` e gráficos com `recharts`.

---

## 🗂️ Módulos e Funcionalidades

| Módulo | Página | O que faz |
|---|---|---|
| **Dashboard** | `/` | KPIs globais (orçamento, saldo, gasto, mão de obra), gráfico de fluxo financeiro, alertas e progresso das obras |
| **Obras** | `/obras` | Lista/cria/deleta obras, edição inline de nome/endereço/orçamento/status |
| **Detalhes da Obra** | `/obras/:id` | 6 abas: Resumo, Equipe, Gastos, Orçamento, Cronograma, Arquivos |
| **Financeiro** | `/financeiro` | Lançamento de receitas e despesas, filtros por tipo/status, edição inline |
| **Orçamentos** | `/orcamentos` | Cria orçamentos independentes com itens editáveis, vinculação a obras |
| **Propostas** | `/proposta` | Propostas com cálculo automático (custo + margem + impostos), busca de CNPJ via BrasilAPI |
| **Compras** | `/compras` | Kanban de requisições de material (estático/mock) |
| **Funcionários** | `/funcionarios` | Cadastro de equipe, alocação por obra, registro de desempenho mensal |
| **Contatos** | `/contatos` | Clientes e fornecedores com busca de CNPJ automática |
| **Catálogo** | `/catalogo` | Tabela de preços de insumos, editável inline |
| **Relatórios** | `/relatorios` | 6 visões: Geral, Lucro, Obras, Equipe/RH, Top Clientes, Top Fornecedores |
| **Histórico** | `/historico` | Timeline de todas as alterações feitas, com filtros por módulo e versões salvas |
| **Perfil/Config** | `/perfil` | Dados da empresa (editáveis inline), inclui a tela de Funcionários |
| **Login** | `/login` | Autenticação simples com senha fixa (`123456`) |

---

## 🐛 Bugs Identificados

### 🔴 CRÍTICOS (causam erros em runtime ou funcionalidade quebrada)

---

#### Bug 1 — `ObraDetalhes.jsx`: Aba "Orçamento" renderizada DUAS VEZES

**Arquivo:** `src/pages/ObraDetalhes.jsx` — linhas 214–218 e 306–333

O bloco `{aba === 'orcamento' && (...)}` aparece **duas vezes** no código. O primeiro (L214) exibe apenas uma mensagem simples. O segundo (L306) exibe a tabela completa de itens. **O segundo nunca é renderizado** porque o React para no primeiro.

Além disso, o segundo bloco usa `item.valorUnitario` (L322, L323, L324), mas o campo correto no contexto se chama **`custoUnitario`**. Isso causaria exibição de `undefined` / `NaN` em todos os valores.

```diff
// L322-324 (segundo bloco orçamento - NUNCA RENDERIZADO, mas com bug de campo)
- <td style={{ textAlign: 'right' }}>{formatCurrency(item.valorUnitario)}</td>
- <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantidade * item.valorUnitario)}</td>
+ <td style={{ textAlign: 'right' }}>{formatCurrency(item.custoUnitario)}</td>
+ <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantidade * item.custoUnitario)}</td>
```

**Solução:** Remover o primeiro bloco (L214–219) — o simples — e manter apenas o segundo (completo), corrigindo `valorUnitario` → `custoUnitario`.

---

#### Bug 2 — `ObraDetalhes.jsx`: `addEtapaCronograma` não foi importada do contexto

**Arquivo:** `src/pages/ObraDetalhes.jsx` — linha 11 e linha 226

Na linha 226, o botão "Nova Etapa" chama `addEtapaCronograma(id, {...})`, mas essa função **não está desestruturada** do `useAppContext()` na linha 11. Isso causa um erro de runtime `addEtapaCronograma is not a function` ao clicar no botão.

```diff
// L11
- const { obras, updateObra, addGastoDaObra, updateGasto, deleteGasto, calcProgressoFinanceiro, getOrcamentoObra, getTotalOrcamento, getCronogramaObra, getArquivosObra, getPropostaObra, funcionarios, updateFuncionario, formatCurrency } = useAppContext();
+ const { obras, updateObra, addGastoDaObra, updateGasto, deleteGasto, calcProgressoFinanceiro, getOrcamentoObra, getTotalOrcamento, getCronogramaObra, addEtapaCronograma, updateEtapaCronograma, deleteEtapaCronograma, getArquivosObra, getPropostaObra, funcionarios, updateFuncionario, addArquivo, deleteArquivo, formatCurrency } = useAppContext();
```

---

#### Bug 3 — `ObraDetalhes.jsx`: Botão de excluir arquivo na aba "Arquivos" não funciona

**Arquivo:** `src/pages/ObraDetalhes.jsx` — linha 297

O botão de Trash2 na aba arquivos não tem `onClick` definido — está vazio. A função `deleteArquivo` não é importada do contexto.

```diff
// L297 - botão sem handler
- <button className="icon-btn" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
+ <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteArquivo(a.id)}><Trash2 size={12} /></button>
```

---

#### Bug 4 — `ObraDetalhes.jsx`: Upload de arquivo não processa o arquivo

**Arquivo:** `src/pages/ObraDetalhes.jsx` — linhas 278–281

O `<input type="file">` não tem `onChange` handler. O botão "Upload" não adiciona nenhum arquivo ao contexto.

```diff
// Falta handler onChange no input file
- <input type="file" style={{ display: 'none' }} />
+ <input type="file" style={{ display: 'none' }} onChange={(e) => {
+   const file = e.target.files[0];
+   if (file) addArquivo(obra.id, { nome: file.name, tipo: file.name.split('.').pop(), tamanho: `${(file.size / 1024).toFixed(0)} KB`, vinculo: 'Upload' });
+ }} />
```

---

#### Bug 5 — `Relatorios.jsx`: `getPropostaObra` retorna array, não objeto

**Arquivo:** `src/pages/Relatorios.jsx` — linhas 25–28

```js
const prop = getPropostaObra(o.id);
const margem = prop?.margemLucro || 20; // prop é um ARRAY, não um objeto
```

`getPropostaObra` retorna um **array** de propostas. Acessar `prop?.margemLucro` em um array retorna `undefined`, caindo sempre no fallback `20`. O código deveria ser `prop[0]?.margemLucro`.

```diff
- const prop = getPropostaObra(o.id);
- const margem = prop?.margemLucro || 20;
- const valorProposto = prop?.valorProposto || custo * (1 + margem / 100);
+ const propList = getPropostaObra(o.id);
+ const prop = propList[0];
+ const margem = prop?.margemLucro || 20;
+ const valorProposto = prop?.valorProposto || custo * (1 + margem / 100);
```

---

#### Bug 6 — `Compras.jsx`: Módulo completamente desconectado do contexto

**Arquivo:** `src/pages/Compras.jsx`

O módulo de Compras usa uma `listasMock` local e **não usa o `AppContext` em absoluto**. Os botões "Nova Requisição" não fazem nada. Os dados são completamente fictícios e não persistem. Este módulo precisa ser integrado ao contexto.

---

### 🟡 MÉDIOS (comportamento incorreto ou UX ruim)

---

#### Bug 7 — `AppContext.jsx`: `getTotalOrcamento` recebe ID mas não converte para int consistentemente

**Arquivo:** `src/context/AppContext.jsx` — linha 240

```js
const orc = listaOrcamentos.find(o => o.id === parseInt(orcId));
```

Mas em `getOrcamentoObra` (L235), a comparação também faz `parseInt(obraId)`. O problema é que em `ObraDetalhes.jsx` (L25), `getTotalOrcamento(id)` passa o `id` como **string** (vindo de `useParams()`). Isso funciona porque há `parseInt`, mas em outros lugares como `Relatorios.jsx` (L24), passa `o.id` que já é number — mistura inconsistente.

**Solução:** Padronizar todos os IDs como números no AppContext usando `Number()` ao comparar.

---

#### Bug 8 — `AppContext.jsx`: `desfazerAlteracao` não reverte o estado real

**Arquivo:** `src/context/AppContext.jsx` — linha 17

A função `desfazerAlteracao` apenas marca a alteração como `desfeito: true` no histórico — ela **não reverte** o dado real no estado. O botão "Desfazer" no Histórico é visual, não funcional.

---

#### Bug 9 — `Orcamentos.jsx`: `ArrowLeft` é reimplementado localmente

**Arquivo:** `src/pages/Orcamentos.jsx` — linhas 174–176

Uma função `ArrowLeft` SVG local é criada, mas o componente já importa `lucide-react`. Deveria usar `import { ArrowLeft } from 'lucide-react'`.

```diff
- function ArrowLeft({ size }) {
-   return <svg ...>;
- }
+ // Remover essa função — já está disponível via lucide-react no topo do arquivo
```

Mas atenção: o import no topo **não inclui** `ArrowLeft` da lista de lucide. Deve ser adicionado.

---

#### Bug 10 — `AppContext.jsx`: Dados não persistem (sem localStorage)

Todo o estado do sistema é em memória. Ao recarregar a página, **todos os dados cadastrados são perdidos** (exceto autenticação). Obras, funcionários, orçamentos, transações — tudo volta ao estado inicial.

**Solução recomendada:** Adicionar persistência via `localStorage` com `useEffect` em cada estado crítico, ou usar uma biblioteca como `zustand-persist`.

---

#### Bug 11 — `Dashboard.jsx`: Gráfico de Fluxo Financeiro usa dados fictícios fixos

**Arquivo:** `src/pages/Dashboard.jsx` — linhas 22–29

O `chartData` do gráfico de área é hardcoded com valores fictícios, não reflete as transações reais do `AppContext`.

```diff
// Dados reais deveriam vir de transacoes
- const chartData = [
-   { name: 'Jan', receitas: 40000, despesas: 24000 },
-   ...
- ];
+ // Agrupar transacoes por mês
```

---

#### Bug 12 — `Financeiro.jsx`: Modal de nova transação não permite vincular a uma Obra

**Arquivo:** `src/pages/Financeiro.jsx` — linhas 113–125

O modal só pede descrição e valor. O campo `obraId` fica sempre `null` ao criar. Não é possível vincular uma transação a uma obra diretamente pelo formulário.

---

### 🟢 MENORES (melhorias/ajustes de UX)

---

#### Bug 13 — `AppLayout.jsx`: Notificação dropdown não fecha ao clicar fora

O dropdown de notificações e o de perfil não têm `onClickOutside` handler. O usuário precisa clicar no botão novamente para fechar.

---

#### Bug 14 — `Login.jsx`: Senha exposta no código-fonte

**Arquivo:** `src/pages/Login.jsx` / `AppContext.jsx` linha 36

A senha `'123456'` está hardcoded no código. Em ambiente de produção, isso é uma vulnerabilidade. Deve ser movida para variável de ambiente ou validação serverless.

---

#### Bug 15 — `InlineEdit.jsx`: `type="date"` exibe a data no formato ISO (YYYY-MM-DD) sem formatação

Quando `type="date"`, o valor exibido no span (modo não-edição) é mostrado bruto no formato ISO. Deveria formatar como `dd/mm/yyyy` para o usuário.

---

#### Bug 16 — `Funcionarios.jsx`: Ano de desempenho fixado em 2026

**Arquivo:** `src/pages/Funcionarios.jsx` — linha 32

```js
addRegistroDesempenho({ ... ano: 2026, ... });
```

O ano está hardcoded. Deveria usar `new Date().getFullYear()`.

---

## ✅ Plano de Correção (Prioridade)

### Fase 1 — Bugs Críticos (aplicar agora)

1. **`ObraDetalhes.jsx`** — Remover o bloco duplicado de orçamento + importar funções ausentes
2. **`ObraDetalhes.jsx`** — Importar `addEtapaCronograma`, `updateEtapaCronograma`, `deleteEtapaCronograma`
3. **`ObraDetalhes.jsx`** — Importar `deleteArquivo` + adicionar `onClick` no botão de excluir arquivo
4. **`ObraDetalhes.jsx`** — Implementar `onChange` no `input[type=file]` com `addArquivo`
5. **`Relatorios.jsx`** — Corrigir `getPropostaObra` para usar `propList[0]`
6. **`Orcamentos.jsx`** — Remover a função `ArrowLeft` local; importar do lucide

### Fase 2 — Persistência de Dados

7. **`AppContext.jsx`** — Adicionar `localStorage` para salvar os estados principais entre reloads

### Fase 3 — Melhorias Funcionais

8. **`Dashboard.jsx`** — Conectar gráfico de fluxo financeiro com dados reais de transações
9. **`Financeiro.jsx`** — Adicionar campo de obra no modal de nova transação
10. **`Compras.jsx`** — Integrar ao AppContext com estado real de requisições
11. **`Historico.jsx`** — Implementar desfazer real (reverter estado, não só marcar)
12. **`Funcionarios.jsx`** — Usar `new Date().getFullYear()` no lugar de `2026`
13. **`InlineEdit.jsx`** — Formatar datas ISO como `dd/mm/yyyy` no modo exibição
14. **`AppLayout.jsx`** — Fechar dropdowns ao clicar fora (useEffect + document listener)

---

## 🎯 Resumo Executivo

O sistema tem uma arquitetura sólida e bem organizada. Os principais problemas são:

- **4 bugs críticos de runtime** em `ObraDetalhes.jsx` que quebram funcionalidades essenciais (cronograma, arquivos, orçamento)
- **1 bug crítico** em `Relatorios.jsx` com o type error em `getPropostaObra`
- **Falta de persistência** — todos os dados somem ao recarregar
- **Módulo de Compras** completamente desconectado (mock estático)
- **Gráfico do Dashboard** com dados fictícios hardcoded

Com as correções da Fase 1, o sistema ficará **funcionalmente correto**. Com a Fase 2, ficará **robusto para uso real**.
