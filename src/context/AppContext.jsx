import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { saveSecure, loadSecure } from '../utils/storage';

const AppContext = createContext();

// Simple session token to prevent localStorage auth bypass
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const AppProvider = ({ children }) => {
  // ========== HISTÓRICO DE ALTERAÇÕES ==========
  const [historico, setHistorico] = useState([]);
  const registrarAlteracao = useCallback((modulo, campo, anterior, novo, obraId = null) => {
    setHistorico(prev => [{
      id: Date.now() + Math.random(),
      modulo, campo, anterior, novo, obraId,
      timestamp: new Date().toISOString(),
      desfeito: false
    }, ...prev]);
  }, []);

  const desfazerAlteracao = useCallback((altId) => {
    setHistorico(prev => prev.map(a => a.id === altId ? { ...a, desfeito: true } : a));
  }, []);

  // ========== VERSÕES ==========
  const [versoes, setVersoes] = useState([]);
  const salvarVersao = useCallback((tipo, obraId, dados, nome) => {
    setVersoes(prev => [{
      id: Date.now(), tipo, obraId, dados: JSON.parse(JSON.stringify(dados)),
      nome: nome || `Versão ${prev.filter(v => v.tipo === tipo && v.obraId === obraId).length + 1}`,
      timestamp: new Date().toISOString()
    }, ...prev]);
  }, []);

  // ========== AUTENTICAÇÃO ==========
  // Session token stored encrypted — prevents direct localStorage manipulation
  const [sessionToken] = useState(() => {
    const stored = loadSecure('erp_session', null);
    if (stored && stored.token && stored.token === stored.verify) return stored.token;
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionToken !== null);
  const [user, setUser] = useState(() => loadSecure('erp_user', { name: 'Administrador', email: 'admin@construtora.com', role: 'Diretor' }));

  const login = (password) => {
    if (password === '123456') {
      const token = generateToken();
      saveSecure('erp_session', { token, verify: token });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('erp_session');
  };

  useEffect(() => { saveSecure('erp_user', user); }, [user]);

  // ========== DADOS DA EMPRESA ==========
  const [empresa, setEmpresa] = useState(() => loadSecure('erp_empresa', {
    razaoSocial: 'SC Engenharia e Construções Ltda',
    nomeFantasia: 'SistemaConstr',
    cnpj: '12.345.678/0001-99',
    inscricaoEstadual: '123.456.789.000',
    endereco: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
    telefone: '(11) 3456-7890',
    email: 'contato@sistemaconstr.com.br',
    site: 'www.sistemaconstr.com.br'
  }));
  useEffect(() => { saveSecure('erp_empresa', empresa); }, [empresa]);

  const updateEmpresa = (campo, valor) => {
    setEmpresa(prev => ({ ...prev, [campo]: valor }));
    registrarAlteracao('Empresa', campo, empresa[campo], valor);
  };

  // ========== CLIENTES E FORNECEDORES ==========
  const [clientes, setClientes] = useState(() => loadSecure('erp_clientes', [
    { id: 1, nome: 'Construtora ABC', contato: 'Marcos Silva', telefone: '(11) 98877-6655', email: 'marcos@abc.com', tipo: 'Jurídica' },
    { id: 2, nome: 'Residencial Aurora', contato: 'Ana Paula', telefone: '(11) 97766-5544', email: 'ana@aurora.com', tipo: 'Jurídica' },
  ]));
  useEffect(() => { saveSecure('erp_clientes', clientes); }, [clientes]);

  const [fornecedores, setFornecedores] = useState(() => loadSecure('erp_fornecedores', [
    { id: 1, nome: 'AçoTubo S.A.', contato: 'Ricardo', telefone: '(11) 4004-5050', email: 'vendas@acotubo.com', categoria: 'Materiais' },
    { id: 2, nome: 'Cimento Forte', contato: 'Beatriz', telefone: '(11) 4556-3322', email: 'contato@cimentoforte.com', categoria: 'Materiais' },
  ]));
  useEffect(() => { saveSecure('erp_fornecedores', fornecedores); }, [fornecedores]);

  const addCliente = (c) => setClientes(prev => [{ ...c, id: Date.now() }, ...prev]);
  const updateCliente = (id, campo, valor) => setClientes(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  const deleteCliente = (id) => setClientes(prev => prev.filter(c => c.id !== id));

  const addFornecedor = (f) => setFornecedores(prev => [{ ...f, id: Date.now() }, ...prev]);
  const updateFornecedor = (id, campo, valor) => setFornecedores(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  const deleteFornecedor = (id) => setFornecedores(prev => prev.filter(f => f.id !== id));

  // ========== OBRAS ==========
  const [obras, setObras] = useState(() => loadSecure('erp_obras', [
    {
      id: 1, nome: 'Edifício Horizon', endereco: 'Rua das Oliveiras, 142 - Centro',
      location: [-23.5505, -46.6333], status: 'Em andamento', previsao: 'Jul 2026',
      orcamento: 1250000,
      gastosDespesas: [{ id: 101, descricao: 'Fundações', valor: 450000, data: '12/03/2026', categoria: 'Estrutural' }]
    },
    {
      id: 2, nome: 'Residencial Villagio', endereco: 'Av. Brasil, 980 - Jd. América',
      location: [-23.5587, -46.6589], status: 'Atrasada', previsao: 'Dez 2025',
      orcamento: 850000,
      gastosDespesas: [
        { id: 102, descricao: 'Projeto/Alvará', valor: 15000, data: '10/01/2025', categoria: 'Administrativo' },
        { id: 103, descricao: 'Estrutural Parte 1', valor: 410000, data: '18/02/2025', categoria: 'Estrutural' }
      ]
    }
  ]));

  const calcProgressoFinanceiro = (obra) => {
    const totalGasto = obra.gastosDespesas.reduce((acc, curr) => acc + curr.valor, 0);
    const varProg = (totalGasto / obra.orcamento) * 100;
    return { gasto: totalGasto, progressoPerc: varProg > 100 ? 100 : Math.round(varProg), alerta: varProg > 90 };
  };

  const addObra = (novaObra) => {
    const randLat = -23.55 + (Math.random() * 0.1 - 0.05);
    const randLng = -46.63 + (Math.random() * 0.1 - 0.05);
    const newObra = { ...novaObra, id: Date.now(), location: [randLat, randLng], gastosDespesas: [] };
    setObras(prev => [newObra, ...prev]);
    registrarAlteracao('Obras', 'Nova obra criada', null, novaObra.nome);
  };

  const updateObra = useCallback((obraId, campo, valor) => {
    setObras(prev => prev.map(o => {
      if (o.id === parseInt(obraId)) {
        const anterior = o[campo];
        registrarAlteracao('Obras', campo, anterior, valor, obraId);
        return { ...o, [campo]: valor };
      }
      return o;
    }));
  }, [registrarAlteracao]);

  const deleteObra = useCallback((obraId) => {
    const obra = obras.find(o => o.id === obraId);
    if (obra) registrarAlteracao('Obras', 'Obra removida', obra.nome, null);
    setObras(prev => prev.filter(o => o.id !== obraId));
    setListaOrcamentos(prev => prev.map(o => o.obraId === obraId ? { ...o, obraId: null } : o));
    setPropostas(prev => prev.filter(p => p.obraId !== obraId));
    setCronogramas(prev => prev.filter(c => c.obraId !== obraId));
    setArquivos(prev => prev.filter(a => a.obraId !== obraId));
  }, [obras, registrarAlteracao]);

  const addGastoDaObra = (obraId, novoGasto) => {
    setObras(prev => prev.map(obra => {
      if (obra.id === parseInt(obraId)) {
        return { ...obra, gastosDespesas: [{ ...novoGasto, id: Date.now() }, ...obra.gastosDespesas] };
      }
      return obra;
    }));
    registrarAlteracao('Gastos', 'Novo gasto', null, `${novoGasto.descricao}: R$${novoGasto.valor}`, parseInt(obraId));
  };

  const updateGasto = useCallback((obraId, gastoId, campo, valor) => {
    setObras(prev => prev.map(obra => {
      if (obra.id === parseInt(obraId)) {
        return {
          ...obra,
          gastosDespesas: obra.gastosDespesas.map(g => {
            if (g.id === gastoId) {
              registrarAlteracao('Gastos', campo, g[campo], valor, obraId);
              return { ...g, [campo]: valor };
            }
            return g;
          })
        };
      }
      return obra;
    }));
  }, [registrarAlteracao]);

  const deleteGasto = useCallback((obraId, gastoId) => {
    setObras(prev => prev.map(obra => {
      if (obra.id === parseInt(obraId)) {
        const gasto = obra.gastosDespesas.find(g => g.id === gastoId);
        if (gasto) registrarAlteracao('Gastos', 'Gasto removido', `${gasto.descricao}: R$${gasto.valor}`, null, obraId);
        return { ...obra, gastosDespesas: obra.gastosDespesas.filter(g => g.id !== gastoId) };
      }
      return obra;
    }));
  }, [registrarAlteracao]);

  useEffect(() => { saveSecure('erp_obras', obras); }, [obras]);

  // ========== ORÇAMENTOS ==========
  const [listaOrcamentos, setListaOrcamentos] = useState(() => loadSecure('erp_orcamentos', [
    { id: 1, nome: 'Orçamento Base Horizonte', obraId: 1, itens: [
      { id: 101, descricao: 'Projeto Arquitetônico', categoria: 'Projetos', quantidade: 1, custoUnitario: 8000, unidade: 'un' },
      { id: 102, descricao: 'Fundação Sapata', categoria: 'Estrutural', quantidade: 1, custoUnitario: 120000, unidade: 'un' },
    ]},
    { id: 2, nome: 'Orçamento Villagio 2025', obraId: 2, itens: [
      { id: 201, descricao: 'Projeto e Alvará', categoria: 'Projetos', quantidade: 1, custoUnitario: 15000, unidade: 'un' },
      { id: 202, descricao: 'Estrutura Completa', categoria: 'Estrutural', quantidade: 1, custoUnitario: 410000, unidade: 'un' },
    ]}
  ]));
  useEffect(() => { saveSecure('erp_orcamentos', listaOrcamentos); }, [listaOrcamentos]);

  const addOrcamento = (nome, obraId = null) => {
    const newOrc = { id: Date.now(), nome, obraId, itens: [] };
    setListaOrcamentos(prev => [...prev, newOrc]);
    return newOrc.id;
  };
  const updateOrcamento = (orcId, campo, valor) => {
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, [campo]: valor } : o));
  };
  const deleteOrcamento = (orcId) => {
    setListaOrcamentos(prev => prev.filter(o => o.id !== orcId));
  };
  const addOrcamentoItem = (orcId, item) => {
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, itens: [...o.itens, { ...item, id: Date.now() }] } : o));
  };
  const updateOrcamentoItem = (orcId, itemId, campo, valor) => {
    setListaOrcamentos(prev => prev.map(o => {
      if (o.id === orcId) {
        return { ...o, itens: o.itens.map(i => i.id === itemId ? { ...i, [campo]: (campo === 'quantidade' || campo === 'custoUnitario') ? parseFloat(valor) || 0 : valor } : i) };
      }
      return o;
    }));
  };
  const deleteOrcamentoItem = (orcId, itemId) => {
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, itens: o.itens.filter(i => i.id !== itemId) } : o));
  };
  const getOrcamentoObra = (obraId) => {
    const orc = listaOrcamentos.find(o => o.obraId === parseInt(obraId));
    return orc ? orc.itens : [];
  };
  const getTotalOrcamento = (orcId) => {
    const orc = listaOrcamentos.find(o => o.id === parseInt(orcId));
    if (!orc) return 0;
    return orc.itens.reduce((acc, i) => acc + (i.quantidade * i.custoUnitario), 0);
  };

  // ========== PROPOSTAS ==========
  const [propostas, setPropostas] = useState(() => loadSecure('erp_propostas', [
    { id: 1, nome: 'Proposta Horizonte Rev.0', obraId: 1, orcamentoId: 1, clienteNome: 'Construtora ABC Ltda', clienteCnpj: '12.345.678/0001-99', clienteEndereco: 'Rua Industrial, 500 - São Paulo/SP', margemLucro: 22, impostos: 6, condicoesPagamento: '30/60/90 dias', valorProposto: null, observacoes: '' },
    { id: 2, nome: 'Proposta Residencial Villagio', obraId: 2, orcamentoId: 2, clienteNome: 'João da Silva ME', clienteCnpj: '', clienteEndereco: '', margemLucro: 18, impostos: 6, condicoesPagamento: 'À vista', valorProposto: null, observacoes: '' },
  ]));
  useEffect(() => { saveSecure('erp_propostas', propostas); }, [propostas]);

  const addProposta = (nome, obraId = null) => {
    const newP = { id: Date.now(), nome, obraId, orcamentoId: null, clienteNome: '', clienteCnpj: '', clienteEndereco: '', margemLucro: 20, impostos: 6, condicoesPagamento: '30 dias', valorProposto: null, observacoes: '' };
    setPropostas(prev => [newP, ...prev]);
    return newP.id;
  };
  const getPropostaObra = useCallback((obraId) => propostas.filter(p => p.obraId === parseInt(obraId)), [propostas]);
  const updateProposta = useCallback((propostaId, campo, valor) => {
    setPropostas(prev => prev.map(p => {
      if (p.id === parseInt(propostaId)) {
        registrarAlteracao('Proposta', campo, p[campo], valor, p.obraId);
        return { ...p, [campo]: valor };
      }
      return p;
    }));
  }, [registrarAlteracao]);
  const deleteProposta = (propostaId) => setPropostas(prev => prev.filter(p => p.id !== propostaId));

  // ========== CRONOGRAMA ==========
  const [cronogramas, setCronogramas] = useState(() => loadSecure('erp_cronogramas', [
    { id: 1, obraId: 1, etapa: 'Fundação', dataInicio: '2026-01-15', dataFim: '2026-03-15', custo: 450000, progresso: 100, cor: '#1E3A8A' },
    { id: 2, obraId: 1, etapa: 'Estrutura', dataInicio: '2026-03-16', dataFim: '2026-06-30', custo: 380000, progresso: 45, cor: '#F59E0B' },
    { id: 3, obraId: 1, etapa: 'Acabamento', dataInicio: '2026-07-01', dataFim: '2026-09-30', custo: 220000, progresso: 0, cor: '#10B981' },
    { id: 4, obraId: 2, etapa: 'Projeto/Alvará', dataInicio: '2025-01-05', dataFim: '2025-02-10', custo: 15000, progresso: 100, cor: '#1E3A8A' },
    { id: 5, obraId: 2, etapa: 'Estrutura', dataInicio: '2025-02-11', dataFim: '2025-08-30', custo: 410000, progresso: 80, cor: '#F59E0B' },
  ]));
  useEffect(() => { saveSecure('erp_cronogramas', cronogramas); }, [cronogramas]);

  const getCronogramaObra = useCallback((obraId) => cronogramas.filter(c => c.obraId === parseInt(obraId)), [cronogramas]);
  const addEtapaCronograma = useCallback((obraId, etapa) => {
    const newEtapa = { ...etapa, id: Date.now(), obraId: parseInt(obraId) };
    setCronogramas(prev => [...prev, newEtapa]);
    registrarAlteracao('Cronograma', 'Etapa adicionada', null, etapa.etapa, obraId);
  }, [registrarAlteracao]);
  const updateEtapaCronograma = useCallback((etapaId, campo, valor) => {
    setCronogramas(prev => prev.map(c => {
      if (c.id === etapaId) {
        registrarAlteracao('Cronograma', campo, c[campo], valor, c.obraId);
        return { ...c, [campo]: campo === 'custo' || campo === 'progresso' ? parseFloat(valor) || 0 : valor };
      }
      return c;
    }));
  }, [registrarAlteracao]);
  const deleteEtapaCronograma = useCallback((etapaId) => {
    const etapa = cronogramas.find(c => c.id === etapaId);
    if (etapa) registrarAlteracao('Cronograma', 'Etapa removida', etapa.etapa, null, etapa.obraId);
    setCronogramas(prev => prev.filter(c => c.id !== etapaId));
  }, [cronogramas, registrarAlteracao]);

  // ========== ARQUIVOS ==========
  const [arquivos, setArquivos] = useState(() => loadSecure('erp_arquivos', [
    { id: 1, obraId: 1, nome: 'Planta Baixa - Térreo.pdf', tipo: 'pdf', tamanho: '2.4 MB', vinculo: 'Orçamento', dataCriacao: '2026-01-10' },
    { id: 2, obraId: 1, nome: 'Cronograma Aprovado.xlsx', tipo: 'xlsx', tamanho: '540 KB', vinculo: 'Cronograma', dataCriacao: '2026-01-12' },
    { id: 3, obraId: 2, nome: 'ART Responsável.pdf', tipo: 'pdf', tamanho: '120 KB', vinculo: 'Proposta', dataCriacao: '2025-01-05' },
  ]));
  useEffect(() => { saveSecure('erp_arquivos', arquivos); }, [arquivos]);

  const getArquivosObra = useCallback((obraId) => arquivos.filter(a => a.obraId === parseInt(obraId)), [arquivos]);
  const addArquivo = useCallback((obraId, arquivo) => {
    const newArq = { ...arquivo, id: Date.now(), obraId: parseInt(obraId), dataCriacao: new Date().toISOString().split('T')[0] };
    setArquivos(prev => [...prev, newArq]);
    registrarAlteracao('Arquivos', 'Arquivo adicionado', null, arquivo.nome, obraId);
  }, [registrarAlteracao]);
  const deleteArquivo = useCallback((arquivoId) => {
    const arq = arquivos.find(a => a.id === arquivoId);
    if (arq) registrarAlteracao('Arquivos', 'Arquivo removido', arq.nome, null, arq.obraId);
    setArquivos(prev => prev.filter(a => a.id !== arquivoId));
  }, [arquivos, registrarAlteracao]);

  // ========== FUNCIONÁRIOS ==========
  const [funcionarios, setFuncionarios] = useState(() => loadSecure('erp_funcionarios', [
    { id: 1, nome: 'Carlos Silva', funcao: 'Mestre de Obras', custoDiaria: 350, diasTrabalhados: 18, obraAtualId: 1, desempenho: 'Excelente' },
    { id: 2, nome: 'João Mendes', funcao: 'Pedreiro', custoDiaria: 200, diasTrabalhados: 20, obraAtualId: 1, desempenho: 'Bom' },
    { id: 3, nome: 'Lucas Almeida', funcao: 'Ajudante', custoDiaria: 120, diasTrabalhados: 15, obraAtualId: 2, desempenho: 'Precisa Melhorar' },
  ]));
  useEffect(() => { saveSecure('erp_funcionarios', funcionarios); }, [funcionarios]);

  const addFuncionario = (novoFunc) => {
    setFuncionarios(prev => [{ ...novoFunc, id: Date.now() }, ...prev]);
    registrarAlteracao('Funcionários', 'Novo profissional', null, novoFunc.nome);
  };
  const updateFuncionario = useCallback((funcId, campo, valor) => {
    setFuncionarios(prev => prev.map(f => {
      if (f.id === funcId) {
        registrarAlteracao('Funcionários', campo, f[campo], valor);
        return { ...f, [campo]: campo === 'custoDiaria' || campo === 'diasTrabalhados' ? parseFloat(valor) || 0 : valor };
      }
      return f;
    }));
  }, [registrarAlteracao]);
  const deleteFuncionario = useCallback((funcId) => {
    const func = funcionarios.find(f => f.id === funcId);
    if (func) registrarAlteracao('Funcionários', 'Removido', func.nome, null);
    setFuncionarios(prev => prev.filter(f => f.id !== funcId));
  }, [funcionarios, registrarAlteracao]);
  const updateDias = (funcId, dias) => {
    setFuncionarios(prev => prev.map(f => f.id === funcId ? { ...f, diasTrabalhados: dias } : f));
  };

  // ========== CATÁLOGO ==========
  const [catalogo, setCatalogo] = useState(() => loadSecure('erp_catalogo', [
    { id: 1, nome: 'Cimento CP II (Saco 50kg)', tipo: 'Fixo', custo: 42.00 },
    { id: 2, nome: 'Areia Lavada (M³)', tipo: 'Fixo', custo: 120.00 },
    { id: 3, nome: 'Alimentação / Refeição', tipo: 'Esporádico', custo: 25.00 },
    { id: 4, nome: 'Locação de Betoneira (Mês)', tipo: 'Fixo', custo: 850.00 }
  ]));
  useEffect(() => { saveSecure('erp_catalogo', catalogo); }, [catalogo]);

  const addCatalogoItem = (novoItem) => setCatalogo(prev => [{ ...novoItem, id: Date.now() }, ...prev]);
  const updateCatalogoItem = useCallback((itemId, campo, valor) => {
    setCatalogo(prev => prev.map(i => {
      if (i.id === itemId) {
        registrarAlteracao('Catálogo', campo, i[campo], valor);
        return { ...i, [campo]: campo === 'custo' ? parseFloat(valor) || 0 : valor };
      }
      return i;
    }));
  }, [registrarAlteracao]);
  const deleteCatalogoItem = useCallback((itemId) => {
    const item = catalogo.find(i => i.id === itemId);
    if (item) registrarAlteracao('Catálogo', 'Item removido', item.nome, null);
    setCatalogo(prev => prev.filter(i => i.id !== itemId));
  }, [catalogo, registrarAlteracao]);

  // ========== TRANSAÇÕES FINANCEIRAS ==========
  const [transacoes, setTransacoes] = useState(() => loadSecure('erp_transacoes', [
    { id: 1, descricao: 'Cimento CP II (Fornecedor ABC)', obraId: 1, data: '2026-05-15', valor: 4500, tipo: 'saida', status: 'pago' },
    { id: 2, descricao: 'Tijolos Cerâmicos (10.000 un)', obraId: 2, data: '2026-05-16', valor: 8200, tipo: 'saida', status: 'pendente' },
    { id: 3, descricao: 'Parcela 02 Cliente (João Silva)', obraId: 1, data: '2026-05-18', valor: 35000, tipo: 'entrada', status: 'pago' },
    { id: 4, descricao: 'Aluguel Equipamentos (Betoneira)', obraId: null, data: '2026-05-20', valor: 1200, tipo: 'saida', status: 'pendente' },
    { id: 5, descricao: 'Medição Etapa 1 - Prefeitura', obraId: null, data: '2026-05-22', valor: 45000, tipo: 'entrada', status: 'pendente' },
  ]));
  useEffect(() => { saveSecure('erp_transacoes', transacoes); }, [transacoes]);

  const addTransacao = useCallback((transacao) => {
    setTransacoes(prev => [{ ...transacao, id: Date.now() }, ...prev]);
    registrarAlteracao('Financeiro', 'Nova transação', null, `${transacao.descricao}: R$${transacao.valor}`);
  }, [registrarAlteracao]);
  const updateTransacao = useCallback((transId, campo, valor) => {
    setTransacoes(prev => prev.map(t => {
      if (t.id === transId) {
        registrarAlteracao('Financeiro', campo, t[campo], valor);
        return { ...t, [campo]: campo === 'valor' ? parseFloat(valor) || 0 : valor };
      }
      return t;
    }));
  }, [registrarAlteracao]);
  const deleteTransacao = useCallback((transId) => {
    setTransacoes(prev => prev.filter(t => t.id !== transId));
  }, []);

  // ========== COMPRAS / SUPRIMENTOS ==========
  const [compras, setCompras] = useState(() => loadSecure('erp_compras', [
    { id: 1, obraId: 1, etapa: 'Fundação', status: 'entrega_pendente', fornecedor: 'Votorantim', itens: 'Cimento, Ferragens D12', dataPedida: '2026-05-10', previsao: '2026-05-18' },
    { id: 2, obraId: 2, etapa: 'Acabamento', status: 'cotacao', fornecedor: '', itens: 'Porcelanato, Argamassa AC3', dataPedida: '2026-05-18', previsao: '' },
    { id: 3, obraId: null, etapa: 'Estoque Central', status: 'entregue', fornecedor: 'Leroy Merlin', itens: 'EPIs, Discos de Corte', dataPedida: '2026-05-05', previsao: '2026-05-08' },
  ]));
  useEffect(() => { saveSecure('erp_compras', compras); }, [compras]);

  const addCompra = useCallback((compra) => {
    setCompras(prev => [{ ...compra, id: Date.now() }, ...prev]);
    registrarAlteracao('Compras', 'Nova requisição', null, compra.itens);
  }, [registrarAlteracao]);
  const updateCompra = useCallback((compraId, campo, valor) => {
    setCompras(prev => prev.map(c => c.id === compraId ? { ...c, [campo]: valor } : c));
  }, []);
  const deleteCompra = useCallback((compraId) => {
    setCompras(prev => prev.filter(c => c.id !== compraId));
  }, []);

  // ========== DESEMPENHO E MÉTRICAS ==========
  const [registrosDesempenho, setRegistrosDesempenho] = useState(() => loadSecure('erp_desempenho', [
    { id: 1, funcionarioId: 1, mes: 'Janeiro', ano: 2026, performance: 95, valorGerado: 12000 },
    { id: 2, funcionarioId: 1, mes: 'Fevereiro', ano: 2026, performance: 88, valorGerado: 10500 },
    { id: 3, funcionarioId: 2, mes: 'Janeiro', ano: 2026, performance: 75, valorGerado: 8000 },
  ]));
  useEffect(() => { saveSecure('erp_desempenho', registrosDesempenho); }, [registrosDesempenho]);

  const addRegistroDesempenho = (reg) => setRegistrosDesempenho(prev => [{ ...reg, id: Date.now() }, ...prev]);
  const updateRegistroDesempenho = (id, campo, valor) => setRegistrosDesempenho(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));
  const deleteRegistroDesempenho = (id) => setRegistrosDesempenho(prev => prev.filter(r => r.id !== id));
  const getDesempenhoFuncionario = (funcId, ano = 2026) => registrosDesempenho.filter(r => r.funcionarioId === funcId && r.ano === ano);

  const getTopClientes = () => {
    const mapa = propostas.reduce((acc, p) => {
      const valor = p.valorProposto || (getTotalOrcamento(p.orcamentoId) * (1 + p.margemLucro / 100) * (1 + p.impostos / 100));
      acc[p.clienteNome] = (acc[p.clienteNome] || 0) + valor;
      return acc;
    }, {});
    return Object.entries(mapa).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  };

  const getTopFornecedores = () => {
    const mapa = transacoes.filter(t => t.tipo === 'saida').reduce((acc, t) => {
      const desc = t.descricao.split('(')[0].trim();
      acc[desc] = (acc[desc] || 0) + t.valor;
      return acc;
    }, {});
    return Object.entries(mapa).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  };

  // ========== NOTIFICAÇÕES ==========
  const [notificacoes, setNotificacoes] = useState([
    { id: 1, titulo: 'Atraso na Entrega', descricao: 'Fornecedor AçoTubo atrasou p/ Villagio.', lida: false },
    { id: 2, titulo: 'Gasto Excedente', descricao: 'Alerte: Villagio ultrapassou cota de Alvenaria.', lida: false },
  ]);
  const marcarComoLida = (id) => setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  const getNotificacoesNaoLidas = () => notificacoes.filter(n => !n.lida).length;

  // ========== UTILITÁRIO FORMATO ==========
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return dateStr; }
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, user, setUser, login, logout,
      empresa, updateEmpresa,
      clientes, addCliente, updateCliente, deleteCliente,
      fornecedores, addFornecedor, updateFornecedor, deleteFornecedor,
      obras, addObra, updateObra, deleteObra, addGastoDaObra, updateGasto, deleteGasto, calcProgressoFinanceiro,
      listaOrcamentos, addOrcamento, updateOrcamento, deleteOrcamento, addOrcamentoItem, updateOrcamentoItem, deleteOrcamentoItem, getOrcamentoObra, getTotalOrcamento,
      propostas, getPropostaObra, updateProposta, addProposta, deleteProposta,
      cronogramas, getCronogramaObra, addEtapaCronograma, updateEtapaCronograma, deleteEtapaCronograma,
      arquivos, getArquivosObra, addArquivo, deleteArquivo,
      funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, updateDias,
      registrosDesempenho, addRegistroDesempenho, updateRegistroDesempenho, deleteRegistroDesempenho, getDesempenhoFuncionario,
      getTopClientes, getTopFornecedores,
      catalogo, addCatalogoItem, updateCatalogoItem, deleteCatalogoItem,
      transacoes, addTransacao, updateTransacao, deleteTransacao,
      compras, addCompra, updateCompra, deleteCompra,
      notificacoes, marcarComoLida, getNotificacoesNaoLidas,
      historico, registrarAlteracao, desfazerAlteracao,
      versoes, salvarVersao,
      formatCurrency, formatDate
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
