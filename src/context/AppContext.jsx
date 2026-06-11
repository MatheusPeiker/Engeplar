import { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

// ── Security: whitelist of allowed campo values per entityType ──
// Prevents arbitrary column injection via reverterAlteracao
const ALLOWED_CAMPOS = {
  obra:        new Set(['nome', 'endereco', 'status', 'orcamento', 'previsao']),
  gasto:       new Set(['descricao', 'valor', 'data', 'categoria']),
  proposta:    new Set(['nome', 'clienteNome', 'clienteCnpj', 'clienteEndereco', 'margemLucro', 'impostos', 'condicoesPagamento', 'valorProposto', 'observacoes', 'obraId', 'orcamentoId', 'status']),
  cronograma:  new Set(['etapa', 'dataInicio', 'dataFim', 'custo', 'progresso', 'cor']),
  funcionario: new Set(['nome', 'funcao', 'custoDiaria', 'diasTrabalhados', 'obraAtualId', 'desempenho']),
  catalogo:    new Set(['nome', 'tipo', 'custo']),
  transacao:   new Set(['descricao', 'data', 'valor', 'tipo', 'status']),
};

// ────────────────────────────────────────────────────────────
// Normalizers: Supabase row → app shape
// ────────────────────────────────────────────────────────────
const norm = {
  obra: (r) => ({
    id: r.id,
    nome: r.nome,
    endereco: r.endereco,
    location: [r.lat ?? -23.5505, r.lng ?? -46.6333],
    status: r.status,
    previsao: r.previsao,
    orcamento: r.orcamento ?? 0,
    gastosDespesas: (r.gastos_despesas ?? []).map(g => ({
      id: g.id, descricao: g.descricao, valor: g.valor ?? 0, data: g.data ?? '', categoria: g.categoria ?? ''
    }))
  }),
  funcionario: (r) => ({
    id: r.id, nome: r.nome, funcao: r.funcao,
    custoDiaria: r.custo_diaria ?? 0, diasTrabalhados: r.dias_trabalhados ?? 0,
    obraAtualId: r.obra_atual_id, desempenho: r.desempenho
  }),
  orcamento: (r) => ({
    id: r.id, nome: r.nome, obraId: r.obra_id,
    extras: r.extras || {},
    itens: (r.orcamento_itens ?? []).map(i => ({
      id: i.id, descricao: i.descricao, categoria: i.categoria,
      unidade: i.unidade, quantidade: i.quantidade ?? 1, custoUnitario: i.custo_unitario ?? 0
    }))
  }),
  proposta: (r) => ({
    id: r.id, nome: r.nome, obraId: r.obra_id, orcamentoId: r.orcamento_id,
    clienteNome: r.cliente_nome, clienteCnpj: r.cliente_cnpj, clienteEndereco: r.cliente_endereco,
    margemLucro: r.margem_lucro ?? 20, impostos: r.impostos ?? 6,
    condicoesPagamento: r.condicoes_pagamento, valorProposto: r.valor_proposto,
    observacoes: r.observacoes, status: r.status || 'rascunho'
  }),
  historico: (r) => ({
    id: r.id, modulo: r.modulo, campo: r.campo,
    anterior: r.anterior, novo: r.novo,
    obraId: r.obra_id, entityId: r.entity_id, entityType: r.entity_type,
    timestamp: r.created_at, desfeito: r.desfeito || false
  }),
  cronograma: (r) => ({
    id: r.id, obraId: r.obra_id, etapa: r.etapa,
    dataInicio: r.data_inicio, dataFim: r.data_fim,
    custo: r.custo ?? 0, progresso: r.progresso ?? 0, cor: r.cor
  }),
  arquivo: (r) => ({
    id: r.id, obraId: r.obra_id, nome: r.nome, tipo: r.tipo,
    tamanho: r.tamanho, vinculo: r.vinculo, dataCriacao: r.data_criacao
  }),
  desempenho: (r) => ({
    id: r.id, funcionarioId: r.funcionario_id, mes: r.mes, ano: r.ano,
    performance: r.performance, valorGerado: r.valor_gerado
  }),
  empresa: (r) => ({
    razaoSocial: r.razao_social, nomeFantasia: r.nome_fantasia, cnpj: r.cnpj,
    inscricaoEstadual: r.inscricao_estadual, endereco: r.endereco,
    telefone: r.telefone, email: r.email, site: r.site, logo: r.logo
  }),
  ptc: (r) => ({ ...r }),
  rvt: (r) => ({ ...r }),
  tipoServico: (r) => ({ ...r }),
};

const DEFAULT_EMPRESA = {
  razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '',
  endereco: '', telefone: '', email: '', site: '', logo: ''
};

const campoToDb = (campo) => ({
  razaoSocial: 'razao_social', nomeFantasia: 'nome_fantasia', cnpj: 'cnpj',
  inscricaoEstadual: 'inscricao_estadual', endereco: 'endereco',
  telefone: 'telefone', email: 'email', site: 'site', logo: 'logo'
}[campo] || campo);

export const AppProvider = ({ children }) => {
  // ── Auth ──────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const sessionRef = useRef(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ── Data ──────────────────────────────────────────────────
  const [empresa, setEmpresa] = useState(DEFAULT_EMPRESA);
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [obras, setObras] = useState([]);
  const [listaOrcamentos, setListaOrcamentos] = useState([]);
  const [propostas, setPropostas] = useState([]);
  const [cronogramas, setCronogramas] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [registrosDesempenho, setRegistrosDesempenho] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [compras, setCompras] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [versoes, setVersoes] = useState([]);
  // ── Módulo Engeplar Documentos ────────────────────────────
  const [ptcs, setPtcs] = useState([]);
  const [rvts, setRvts] = useState([]);
  const [tiposServico, setTiposServico] = useState([]);
  const [notificacoes, setNotificacoes] = useState([
    { id: 1, titulo: 'Bem-vindo', descricao: 'Seus dados estão sendo carregados do banco.', lida: false },
  ]);

  // ── Auth listener ─────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data on login ────────────────────────────────────
  useEffect(() => {
    if (session) {
      loadAllData(session.user.id);
    } else if (!authLoading) {
      clearAllData();
    }
  }, [session, authLoading]);

  const clearAllData = () => {
    setEmpresa(DEFAULT_EMPRESA); setClientes([]); setFornecedores([]);
    setObras([]); setListaOrcamentos([]); setPropostas([]);
    setCronogramas([]); setArquivos([]); setFuncionarios([]);
    setRegistrosDesempenho([]); setCatalogo([]); setTransacoes([]);
    setCompras([]); setHistorico([]); setVersoes([]);
    setPtcs([]); setRvts([]); setTiposServico([]);
  };

  const loadAllData = async (uid) => {
    setDataLoading(true);
    const [
      obrasRes, clientesRes, fornRes, funcRes, orcRes, propRes,
      cronRes, arqRes, catRes, transRes, comprasRes, despRes, empresaRes, histRes,
      ptcRes, rvtRes, tiposServicoRes
    ] = await Promise.all([
      supabase.from('obras').select('*, gastos_despesas(*)').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('clientes').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('fornecedores').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('funcionarios').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('orcamentos').select('*, orcamento_itens(*)').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('propostas').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('cronogramas').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('arquivos').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('catalogo').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('transacoes').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('compras').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('registros_desempenho').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('empresa').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('historico').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
      supabase.from('ptc').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('rvt').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('tipos_servico').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);

    if (obrasRes.data)    setObras(obrasRes.data.map(norm.obra));
    if (clientesRes.data) setClientes(clientesRes.data);
    if (fornRes.data)     setFornecedores(fornRes.data);
    if (funcRes.data)     setFuncionarios(funcRes.data.map(norm.funcionario));
    if (orcRes.data)      setListaOrcamentos(orcRes.data.map(norm.orcamento));
    if (propRes.data)     setPropostas(propRes.data.map(norm.proposta));
    if (cronRes.data)     setCronogramas(cronRes.data.map(norm.cronograma));
    if (arqRes.data)      setArquivos(arqRes.data.map(norm.arquivo));
    if (catRes.data)      setCatalogo(catRes.data);
    if (transRes.data)    setTransacoes(transRes.data);
    if (comprasRes.data)  setCompras(comprasRes.data);
    if (despRes.data)     setRegistrosDesempenho(despRes.data.map(norm.desempenho));
    if (empresaRes.data)  setEmpresa(norm.empresa(empresaRes.data));
    if (histRes.data)     setHistorico(histRes.data.map(norm.historico));
    if (ptcRes.data)      setPtcs(ptcRes.data.map(norm.ptc));
    if (rvtRes.data)      setRvts(rvtRes.data.map(norm.rvt));
    if (tiposServicoRes.data) setTiposServico(tiposServicoRes.data.map(norm.tipoServico));

    setDataLoading(false);
  };

  const uid = () => sessionRef.current?.user?.id;

  // ── Auth methods ──────────────────────────────────────────
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const isAuthenticated = !!session;
  const user = session
    ? { name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário', email: session.user.email, role: 'Diretor' }
    : null;

  // ── Histórico ─────────────────────────────────────────────
  const registrarAlteracao = useCallback((modulo, campo, anterior, novo, obraId = null, entityId = null, entityType = null) => {
    const tempId = `hist_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const anteriorStr = anterior !== null && anterior !== undefined ? String(anterior) : null;
    const novoStr = novo !== null && novo !== undefined ? String(novo) : null;
    const entityIdStr = entityId ? String(entityId) : null;
    const entry = { id: tempId, modulo, campo, anterior: anteriorStr, novo: novoStr, obraId, entityId: entityIdStr, entityType, timestamp: new Date().toISOString(), desfeito: false };
    setHistorico(prev => [entry, ...prev]);
    const currentUid = sessionRef.current?.user?.id;
    if (currentUid) {
      supabase.from('historico').insert({
        user_id: currentUid, modulo, campo,
        anterior: anteriorStr, novo: novoStr,
        obra_id: obraId || null, entity_id: entityIdStr, entity_type: entityType || null,
      }).select('id').single().then(({ data }) => {
        if (data) setHistorico(prev => prev.map(h => h.id === tempId ? { ...h, id: data.id } : h));
      });
    }
  }, []);

  const salvarVersao = useCallback((tipo, obraId, dados, nome) => {
    setVersoes(prev => [{
      id: Date.now(), tipo, obraId, dados: JSON.parse(JSON.stringify(dados)),
      nome: nome || `Versão ${prev.filter(v => v.tipo === tipo && v.obraId === obraId).length + 1}`,
      timestamp: new Date().toISOString()
    }, ...prev]);
  }, []);

  // ── Empresa ───────────────────────────────────────────────
  const updateEmpresa = async (campo, valor) => {
    const prev = empresa[campo];
    setEmpresa(e => ({ ...e, [campo]: valor }));
    registrarAlteracao('Empresa', campo, prev, valor);
    // Single-field upsert — avoids stale-closure race condition
    // ON CONFLICT (user_id) DO UPDATE SET <campo> = valor only; other cols untouched
    await supabase.from('empresa').upsert(
      { user_id: uid(), [campoToDb(campo)]: valor, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  };

  // ── Clientes ──────────────────────────────────────────────
  const addCliente = async (c) => {
    const tempId = `tmp_${Date.now()}`;
    setClientes(prev => [{ ...c, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('clientes').insert({ ...c, user_id: uid() }).select().single();
    if (error) { setClientes(prev => prev.filter(x => x.id !== tempId)); return; }
    setClientes(prev => prev.map(x => x.id === tempId ? data : x));
  };

  const updateCliente = async (id, campo, valor) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
    await supabase.from('clientes').update({ [campo]: valor }).eq('id', id).eq('user_id', uid());
  };

  const deleteCliente = async (id) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    await supabase.from('clientes').delete().eq('id', id).eq('user_id', uid());
  };

  // ── Fornecedores ──────────────────────────────────────────
  const addFornecedor = async (f) => {
    const tempId = `tmp_${Date.now()}`;
    setFornecedores(prev => [{ ...f, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('fornecedores').insert({ ...f, user_id: uid() }).select().single();
    if (error) { setFornecedores(prev => prev.filter(x => x.id !== tempId)); return; }
    setFornecedores(prev => prev.map(x => x.id === tempId ? data : x));
  };

  const updateFornecedor = async (id, campo, valor) => {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f));
    await supabase.from('fornecedores').update({ [campo]: valor }).eq('id', id).eq('user_id', uid());
  };

  const deleteFornecedor = async (id) => {
    setFornecedores(prev => prev.filter(f => f.id !== id));
    await supabase.from('fornecedores').delete().eq('id', id).eq('user_id', uid());
  };

  // ── Obras ─────────────────────────────────────────────────
  const calcProgressoFinanceiro = (obra) => {
    const totalGasto = obra.gastosDespesas.reduce((a, c) => a + c.valor, 0);
    const p = (totalGasto / obra.orcamento) * 100;
    return { gasto: totalGasto, progressoPerc: p > 100 ? 100 : Math.round(p), alerta: p > 90 };
  };

  const addObra = async (novaObra) => {
    const tempId = `tmp_${Date.now()}`;
    const lat = -23.55 + (Math.random() * 0.1 - 0.05);
    const lng = -46.63 + (Math.random() * 0.1 - 0.05);
    const local = { ...novaObra, id: tempId, location: [lat, lng], gastosDespesas: [] };
    setObras(prev => [local, ...prev]);
    const { data, error } = await supabase.from('obras').insert({
      nome: novaObra.nome, endereco: novaObra.endereco, status: novaObra.status,
      previsao: novaObra.previsao, orcamento: novaObra.orcamento || 0,
      lat, lng, user_id: uid()
    }).select('*, gastos_despesas(*)').single();
    if (error) { setObras(prev => prev.filter(o => o.id !== tempId)); return null; }
    setObras(prev => prev.map(o => o.id === tempId ? norm.obra(data) : o));
    registrarAlteracao('Obras', 'Nova obra criada', null, novaObra.nome);
    return data.id;
  };

  const updateObra = useCallback(async (obraId, campo, valor) => {
    setObras(prev => prev.map(o => {
      if (o.id === obraId) { registrarAlteracao('Obras', campo, o[campo], valor, obraId, obraId, 'obra'); return { ...o, [campo]: valor }; }
      return o;
    }));
    const dbField = { previsao: 'previsao', status: 'status', nome: 'nome', endereco: 'endereco', orcamento: 'orcamento' }[campo] || campo;
    await supabase.from('obras').update({ [dbField]: valor }).eq('id', obraId).eq('user_id', uid());
  }, [registrarAlteracao]);

  const deleteObra = useCallback(async (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    if (obra) registrarAlteracao('Obras', 'Obra removida', obra.nome, null);
    setObras(prev => prev.filter(o => o.id !== obraId));
    setListaOrcamentos(prev => prev.map(o => o.obraId === obraId ? { ...o, obraId: null } : o));
    setPropostas(prev => prev.filter(p => p.obraId !== obraId));
    setCronogramas(prev => prev.filter(c => c.obraId !== obraId));
    setArquivos(prev => prev.filter(a => a.obraId !== obraId));
    // Libera funcionários alocados nesta obra no estado local (DB faz ON DELETE SET NULL)
    setFuncionarios(prev => prev.map(f => f.obraAtualId === obraId ? { ...f, obraAtualId: null } : f));
    await supabase.from('obras').delete().eq('id', obraId).eq('user_id', uid());
  }, [obras, registrarAlteracao]);

  const addGastoDaObra = async (obraId, novoGasto) => {
    const tempId = `tmp_${Date.now()}`;
    setObras(prev => prev.map(o =>
      o.id === obraId ? { ...o, gastosDespesas: [{ ...novoGasto, id: tempId }, ...o.gastosDespesas] } : o
    ));
    const { data, error } = await supabase.from('gastos_despesas').insert({
      obra_id: obraId, descricao: novoGasto.descricao, valor: novoGasto.valor,
      data: novoGasto.data, categoria: novoGasto.categoria, user_id: uid()
    }).select().single();
    if (error) {
      setObras(prev => prev.map(o => o.id === obraId ? { ...o, gastosDespesas: o.gastosDespesas.filter(g => g.id !== tempId) } : o));
      return;
    }
    setObras(prev => prev.map(o =>
      o.id === obraId ? { ...o, gastosDespesas: o.gastosDespesas.map(g => g.id === tempId ? { id: data.id, descricao: data.descricao, valor: data.valor, data: data.data, categoria: data.categoria } : g) } : o
    ));
    registrarAlteracao('Gastos', 'Novo gasto', null, `${novoGasto.descricao}: R$${novoGasto.valor}`, obraId);
  };

  const updateGasto = useCallback(async (obraId, gastoId, campo, valor) => {
    setObras(prev => prev.map(o => {
      if (o.id === obraId) {
        return { ...o, gastosDespesas: o.gastosDespesas.map(g => {
          if (g.id === gastoId) { registrarAlteracao('Gastos', campo, g[campo], valor, obraId, gastoId, 'gasto'); return { ...g, [campo]: valor }; }
          return g;
        })};
      }
      return o;
    }));
    const dbMap = { descricao: 'descricao', valor: 'valor', data: 'data', categoria: 'categoria' };
    await supabase.from('gastos_despesas').update({ [dbMap[campo] || campo]: valor }).eq('id', gastoId).eq('user_id', uid());
  }, [registrarAlteracao]);

  const deleteGasto = useCallback(async (obraId, gastoId) => {
    setObras(prev => prev.map(o => {
      if (o.id === obraId) {
        const g = o.gastosDespesas.find(g => g.id === gastoId);
        if (g) registrarAlteracao('Gastos', 'Gasto removido', `${g.descricao}: R$${g.valor}`, null, obraId);
        return { ...o, gastosDespesas: o.gastosDespesas.filter(g => g.id !== gastoId) };
      }
      return o;
    }));
    await supabase.from('gastos_despesas').delete().eq('id', gastoId).eq('user_id', uid());
  }, [registrarAlteracao]);

  // ── Orçamentos ────────────────────────────────────────────
  const addOrcamento = async (nome, obraId = null) => {
    const tempId = `tmp_${Date.now()}`;
    const local = { id: tempId, nome, obraId, itens: [] };
    setListaOrcamentos(prev => [...prev, local]);
    const { data, error } = await supabase.from('orcamentos').insert({ nome, obra_id: obraId || null, user_id: uid() }).select('*, orcamento_itens(*)').single();
    if (error) { setListaOrcamentos(prev => prev.filter(o => o.id !== tempId)); return tempId; }
    setListaOrcamentos(prev => prev.map(o => o.id === tempId ? norm.orcamento(data) : o));
    return data.id;
  };

  const updateOrcamento = async (orcId, campo, valor) => {
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, [campo]: valor } : o));
    const dbMap = { nome: 'nome', obraId: 'obra_id' };
    await supabase.from('orcamentos').update({ [dbMap[campo] || campo]: valor }).eq('id', orcId).eq('user_id', uid());
  };

  const deleteOrcamento = async (orcId) => {
    setListaOrcamentos(prev => prev.filter(o => o.id !== orcId));
    await supabase.from('orcamentos').delete().eq('id', orcId).eq('user_id', uid());
  };

  const addOrcamentoItem = async (orcId, item) => {
    const tempId = `tmp_${Date.now()}`;
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, itens: [...o.itens, { ...item, id: tempId }] } : o));
    const { data, error } = await supabase.from('orcamento_itens').insert({
      orcamento_id: orcId, descricao: item.descricao, categoria: item.categoria,
      unidade: item.unidade, quantidade: item.quantidade, custo_unitario: item.custoUnitario, user_id: uid()
    }).select().single();
    if (error) { setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, itens: o.itens.filter(i => i.id !== tempId) } : o)); return; }
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? {
      ...o, itens: o.itens.map(i => i.id === tempId ? { id: data.id, descricao: data.descricao, categoria: data.categoria, unidade: data.unidade, quantidade: data.quantidade, custoUnitario: data.custo_unitario } : i)
    } : o));
  };

  const updateOrcamentoItem = async (orcId, itemId, campo, valor) => {
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? {
      ...o, itens: o.itens.map(i => i.id === itemId ? { ...i, [campo]: (campo === 'quantidade' || campo === 'custoUnitario') ? parseFloat(valor) || 0 : valor } : i)
    } : o));
    const dbMap = { descricao: 'descricao', categoria: 'categoria', unidade: 'unidade', quantidade: 'quantidade', custoUnitario: 'custo_unitario' };
    await supabase.from('orcamento_itens').update({ [dbMap[campo] || campo]: valor }).eq('id', itemId).eq('user_id', uid());
  };

  const deleteOrcamentoItem = async (orcId, itemId) => {
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, itens: o.itens.filter(i => i.id !== itemId) } : o));
    await supabase.from('orcamento_itens').delete().eq('id', itemId).eq('user_id', uid());
  };

  const updateOrcamentoExtras = async (orcId, extras) => {
    setListaOrcamentos(prev => prev.map(o => o.id === orcId ? { ...o, extras } : o));
    await supabase.from('orcamentos').update({ extras }).eq('id', orcId).eq('user_id', uid());
  };

  const getOrcamentoObra = (obraId) => {
    const orc = listaOrcamentos.find(o => o.obraId === obraId);
    return orc ? orc.itens : [];
  };

  const getTotalOrcamento = (orcId) => {
    const orc = listaOrcamentos.find(o => o.id === orcId);
    if (!orc) return 0;
    const totalItens = orc.itens.reduce((a, i) => a + (i.quantidade * i.custoUnitario), 0);
    const totalMO = (orc.extras?.maoDeObra || []).reduce((a, m) => a + (m.custoDiaria || 0) * (m.diasPrevistos || 0), 0);
    const mob = orc.extras?.mobilizacao || {};
    const nViagens = parseInt(mob.numViagens) || 1;
    const totalMob = mob.distanciaKm
      ? (parseFloat(mob.distanciaKm) * (parseFloat(mob.custoPorKm) || 0) * nViagens)
        + ((parseInt(mob.numPessoas) || 0) * (parseFloat(mob.custoAdicionalPorPessoa) || 0) * nViagens)
      : 0;
    return totalItens + totalMO + totalMob;
  };

  // ── Propostas ─────────────────────────────────────────────
  const addProposta = async (nome, obraId = null) => {
    const tempId = `tmp_${Date.now()}`;
    const local = { id: tempId, nome, obraId, orcamentoId: null, clienteNome: '', clienteCnpj: '', clienteEndereco: '', margemLucro: 20, impostos: 6, condicoesPagamento: '30 dias', valorProposto: null, observacoes: '', status: 'rascunho' };
    setPropostas(prev => [local, ...prev]);
    const { data, error } = await supabase.from('propostas').insert({ nome, obra_id: obraId || null, user_id: uid() }).select().single();
    if (error) { setPropostas(prev => prev.filter(p => p.id !== tempId)); return tempId; }
    setPropostas(prev => prev.map(p => p.id === tempId ? norm.proposta(data) : p));
    return data.id;
  };

  const getPropostaObra = useCallback((obraId) => propostas.filter(p => p.obraId === obraId), [propostas]);

  const updateProposta = useCallback(async (propostaId, campo, valor) => {
    setPropostas(prev => prev.map(p => {
      if (p.id === propostaId) { registrarAlteracao('Proposta', campo, p[campo], valor, p.obraId, propostaId, 'proposta'); return { ...p, [campo]: valor }; }
      return p;
    }));
    const dbMap = {
      nome: 'nome', obraId: 'obra_id', orcamentoId: 'orcamento_id',
      clienteNome: 'cliente_nome', clienteCnpj: 'cliente_cnpj', clienteEndereco: 'cliente_endereco',
      margemLucro: 'margem_lucro', impostos: 'impostos', condicoesPagamento: 'condicoes_pagamento',
      valorProposto: 'valor_proposto', observacoes: 'observacoes', status: 'status'
    };
    await supabase.from('propostas').update({ [dbMap[campo] || campo]: valor }).eq('id', propostaId).eq('user_id', uid());
  }, [registrarAlteracao]);

  const deleteProposta = async (propostaId) => {
    setPropostas(prev => prev.filter(p => p.id !== propostaId));
    await supabase.from('propostas').delete().eq('id', propostaId).eq('user_id', uid());
  };

  // ── Cronograma ────────────────────────────────────────────
  const getCronogramaObra = useCallback((obraId) => cronogramas.filter(c => c.obraId === obraId), [cronogramas]);

  const addEtapaCronograma = useCallback(async (obraId, etapa) => {
    const tempId = `tmp_${Date.now()}`;
    setCronogramas(prev => [...prev, { ...etapa, id: tempId, obraId }]);
    const { data, error } = await supabase.from('cronogramas').insert({
      obra_id: obraId, etapa: etapa.etapa, data_inicio: etapa.dataInicio, data_fim: etapa.dataFim,
      custo: etapa.custo, progresso: etapa.progresso, cor: etapa.cor, user_id: uid()
    }).select().single();
    if (error) { setCronogramas(prev => prev.filter(c => c.id !== tempId)); return; }
    setCronogramas(prev => prev.map(c => c.id === tempId ? norm.cronograma(data) : c));
    registrarAlteracao('Cronograma', 'Etapa adicionada', null, etapa.etapa, obraId);
  }, [registrarAlteracao]);

  const updateEtapaCronograma = useCallback(async (etapaId, campo, valor) => {
    setCronogramas(prev => prev.map(c => {
      if (c.id === etapaId) { registrarAlteracao('Cronograma', campo, c[campo], valor, c.obraId, etapaId, 'cronograma'); return { ...c, [campo]: campo === 'custo' || campo === 'progresso' ? parseFloat(valor) || 0 : valor }; }
      return c;
    }));
    const dbMap = { etapa: 'etapa', dataInicio: 'data_inicio', dataFim: 'data_fim', custo: 'custo', progresso: 'progresso', cor: 'cor' };
    await supabase.from('cronogramas').update({ [dbMap[campo] || campo]: valor }).eq('id', etapaId).eq('user_id', uid());
  }, [registrarAlteracao]);

  const deleteEtapaCronograma = useCallback(async (etapaId) => {
    const etapa = cronogramas.find(c => c.id === etapaId);
    if (etapa) registrarAlteracao('Cronograma', 'Etapa removida', etapa.etapa, null, etapa.obraId);
    setCronogramas(prev => prev.filter(c => c.id !== etapaId));
    await supabase.from('cronogramas').delete().eq('id', etapaId).eq('user_id', uid());
  }, [cronogramas, registrarAlteracao]);

  // ── Arquivos ──────────────────────────────────────────────
  const getArquivosObra = useCallback((obraId) => arquivos.filter(a => a.obraId === obraId), [arquivos]);

  const addArquivo = useCallback(async (obraId, arquivo) => {
    const tempId = `tmp_${Date.now()}`;
    const dataCriacao = new Date().toISOString().split('T')[0];
    setArquivos(prev => [...prev, { ...arquivo, id: tempId, obraId, dataCriacao }]);
    const { data, error } = await supabase.from('arquivos').insert({
      obra_id: obraId, nome: arquivo.nome, tipo: arquivo.tipo,
      tamanho: arquivo.tamanho, vinculo: arquivo.vinculo, data_criacao: dataCriacao, user_id: uid()
    }).select().single();
    if (error) { setArquivos(prev => prev.filter(a => a.id !== tempId)); return; }
    setArquivos(prev => prev.map(a => a.id === tempId ? norm.arquivo(data) : a));
    registrarAlteracao('Arquivos', 'Arquivo adicionado', null, arquivo.nome, obraId);
  }, [registrarAlteracao]);

  const deleteArquivo = useCallback(async (arquivoId) => {
    const arq = arquivos.find(a => a.id === arquivoId);
    if (arq) registrarAlteracao('Arquivos', 'Arquivo removido', arq.nome, null, arq.obraId);
    setArquivos(prev => prev.filter(a => a.id !== arquivoId));
    await supabase.from('arquivos').delete().eq('id', arquivoId).eq('user_id', uid());
  }, [arquivos, registrarAlteracao]);

  // ── Funcionários ──────────────────────────────────────────
  const addFuncionario = async (novoFunc) => {
    const tempId = `tmp_${Date.now()}`;
    setFuncionarios(prev => [{ ...novoFunc, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('funcionarios').insert({
      nome: novoFunc.nome, funcao: novoFunc.funcao, custo_diaria: novoFunc.custoDiaria,
      dias_trabalhados: novoFunc.diasTrabalhados, obra_atual_id: novoFunc.obraAtualId || null,
      desempenho: novoFunc.desempenho, user_id: uid()
    }).select().single();
    if (error) { setFuncionarios(prev => prev.filter(f => f.id !== tempId)); return; }
    setFuncionarios(prev => prev.map(f => f.id === tempId ? norm.funcionario(data) : f));
    registrarAlteracao('Funcionários', 'Novo profissional', null, novoFunc.nome);
  };

  const updateFuncionario = useCallback(async (funcId, campo, valor) => {
    setFuncionarios(prev => prev.map(f => {
      if (f.id === funcId) { registrarAlteracao('Funcionários', campo, f[campo], valor, null, funcId, 'funcionario'); return { ...f, [campo]: campo === 'custoDiaria' || campo === 'diasTrabalhados' ? parseFloat(valor) || 0 : valor }; }
      return f;
    }));
    const dbMap = { nome: 'nome', funcao: 'funcao', custoDiaria: 'custo_diaria', diasTrabalhados: 'dias_trabalhados', obraAtualId: 'obra_atual_id', desempenho: 'desempenho' };
    await supabase.from('funcionarios').update({ [dbMap[campo] || campo]: valor || null }).eq('id', funcId).eq('user_id', uid());
  }, [registrarAlteracao]);

  const deleteFuncionario = useCallback(async (funcId) => {
    const func = funcionarios.find(f => f.id === funcId);
    if (func) registrarAlteracao('Funcionários', 'Removido', func.nome, null);
    setFuncionarios(prev => prev.filter(f => f.id !== funcId));
    await supabase.from('funcionarios').delete().eq('id', funcId).eq('user_id', uid());
  }, [funcionarios, registrarAlteracao]);

  const updateDias = async (funcId, dias) => {
    setFuncionarios(prev => prev.map(f => f.id === funcId ? { ...f, diasTrabalhados: dias } : f));
    await supabase.from('funcionarios').update({ dias_trabalhados: dias }).eq('id', funcId).eq('user_id', uid());
  };

  // ── Desempenho ────────────────────────────────────────────
  const addRegistroDesempenho = async (reg) => {
    const tempId = `tmp_${Date.now()}`;
    setRegistrosDesempenho(prev => [{ ...reg, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('registros_desempenho').insert({
      funcionario_id: reg.funcionarioId, mes: reg.mes, ano: reg.ano,
      performance: reg.performance, valor_gerado: reg.valorGerado, user_id: uid()
    }).select().single();
    if (error) { setRegistrosDesempenho(prev => prev.filter(r => r.id !== tempId)); return; }
    setRegistrosDesempenho(prev => prev.map(r => r.id === tempId ? norm.desempenho(data) : r));
  };

  const updateRegistroDesempenho = async (id, campo, valor) => {
    setRegistrosDesempenho(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));
    const dbMap = { mes: 'mes', ano: 'ano', performance: 'performance', valorGerado: 'valor_gerado' };
    await supabase.from('registros_desempenho').update({ [dbMap[campo] || campo]: valor }).eq('id', id).eq('user_id', uid());
  };

  const deleteRegistroDesempenho = async (id) => {
    setRegistrosDesempenho(prev => prev.filter(r => r.id !== id));
    await supabase.from('registros_desempenho').delete().eq('id', id).eq('user_id', uid());
  };

  const getDesempenhoFuncionario = (funcId, ano = new Date().getFullYear()) =>
    registrosDesempenho.filter(r => r.funcionarioId === funcId && r.ano === ano);

  // ── Catálogo ──────────────────────────────────────────────
  const addCatalogoItem = async (novoItem) => {
    const tempId = `tmp_${Date.now()}`;
    setCatalogo(prev => [{ ...novoItem, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('catalogo').insert({ nome: novoItem.nome, tipo: novoItem.tipo, custo: novoItem.custo, user_id: uid() }).select().single();
    if (error) { setCatalogo(prev => prev.filter(i => i.id !== tempId)); return; }
    setCatalogo(prev => prev.map(i => i.id === tempId ? data : i));
  };

  const updateCatalogoItem = useCallback(async (itemId, campo, valor) => {
    setCatalogo(prev => prev.map(i => {
      if (i.id === itemId) { registrarAlteracao('Catálogo', campo, i[campo], valor, null, itemId, 'catalogo'); return { ...i, [campo]: campo === 'custo' ? parseFloat(valor) || 0 : valor }; }
      return i;
    }));
    await supabase.from('catalogo').update({ [campo]: valor }).eq('id', itemId).eq('user_id', uid());
  }, [registrarAlteracao]);

  const deleteCatalogoItem = useCallback(async (itemId) => {
    const item = catalogo.find(i => i.id === itemId);
    if (item) registrarAlteracao('Catálogo', 'Item removido', item.nome, null);
    setCatalogo(prev => prev.filter(i => i.id !== itemId));
    await supabase.from('catalogo').delete().eq('id', itemId).eq('user_id', uid());
  }, [catalogo, registrarAlteracao]);

  // ── Financeiro ────────────────────────────────────────────
  const addTransacao = useCallback(async (transacao) => {
    const tempId = `tmp_${Date.now()}`;
    setTransacoes(prev => [{ ...transacao, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('transacoes').insert({
      descricao: transacao.descricao, obra_id: transacao.obraId || null, data: transacao.data,
      valor: transacao.valor, tipo: transacao.tipo, status: transacao.status, user_id: uid()
    }).select().single();
    if (error) { setTransacoes(prev => prev.filter(t => t.id !== tempId)); return; }
    setTransacoes(prev => prev.map(t => t.id === tempId ? data : t));
    registrarAlteracao('Financeiro', 'Nova transação', null, `${transacao.descricao}: R$${transacao.valor}`);
  }, [registrarAlteracao]);

  const updateTransacao = useCallback(async (transId, campo, valor) => {
    setTransacoes(prev => prev.map(t => {
      if (t.id === transId) { registrarAlteracao('Financeiro', campo, t[campo], valor, null, transId, 'transacao'); return { ...t, [campo]: campo === 'valor' ? parseFloat(valor) || 0 : valor }; }
      return t;
    }));
    await supabase.from('transacoes').update({ [campo]: valor }).eq('id', transId).eq('user_id', uid());
  }, [registrarAlteracao]);

  const deleteTransacao = useCallback(async (transId) => {
    setTransacoes(prev => prev.filter(t => t.id !== transId));
    await supabase.from('transacoes').delete().eq('id', transId).eq('user_id', uid());
  }, []);

  // ── Compras ───────────────────────────────────────────────
  const addCompra = useCallback(async (compra) => {
    const tempId = `tmp_${Date.now()}`;
    setCompras(prev => [{ ...compra, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('compras').insert({
      obra_id: compra.obraId || null, etapa: compra.etapa, status: compra.status || 'cotacao',
      fornecedor: compra.fornecedor, itens: compra.itens,
      data_pedida: compra.dataPedida || null, previsao: compra.previsao || null, user_id: uid()
    }).select().single();
    if (error) { setCompras(prev => prev.filter(c => c.id !== tempId)); return; }
    setCompras(prev => prev.map(c => c.id === tempId ? { ...data, obraId: data.obra_id, dataPedida: data.data_pedida } : c));
    registrarAlteracao('Compras', 'Nova requisição', null, compra.itens);
  }, [registrarAlteracao]);

  const updateCompra = useCallback(async (compraId, campo, valor) => {
    setCompras(prev => prev.map(c => c.id === compraId ? { ...c, [campo]: valor } : c));
    const dbMap = { obraId: 'obra_id', dataPedida: 'data_pedida', fornecedor: 'fornecedor', itens: 'itens', status: 'status', previsao: 'previsao', etapa: 'etapa' };
    await supabase.from('compras').update({ [dbMap[campo] || campo]: valor }).eq('id', compraId).eq('user_id', uid());
  }, []);

  const deleteCompra = useCallback(async (compraId) => {
    setCompras(prev => prev.filter(c => c.id !== compraId));
    await supabase.from('compras').delete().eq('id', compraId).eq('user_id', uid());
  }, []);

  // ── PTC ───────────────────────────────────────────────────
  const addPTC = async (dados) => {
    const tempId = `tmp_${Date.now()}`;
    const local  = { ...dados, id: tempId, user_id: uid() };
    setPtcs(prev => [local, ...prev]);
    const { data, error } = await supabase.from('ptc').insert({ ...dados, user_id: uid() }).select().single();
    if (error) { setPtcs(prev => prev.filter(p => p.id !== tempId)); return null; }
    setPtcs(prev => prev.map(p => p.id === tempId ? data : p));
    return data.id;
  };

  const updatePTC = async (id, campo, valor) => {
    setPtcs(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    await supabase.from('ptc').update({ [campo]: valor, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid());
  };

  const deletePTC = async (id) => {
    setPtcs(prev => prev.filter(p => p.id !== id));
    await supabase.from('ptc').delete().eq('id', id).eq('user_id', uid());
  };

  // ── RVT ───────────────────────────────────────────────────
  const addRVT = async (dados) => {
    const tempId = `tmp_${Date.now()}`;
    const local  = { ...dados, id: tempId, user_id: uid() };
    setRvts(prev => [local, ...prev]);
    const { data, error } = await supabase.from('rvt').insert({ ...dados, user_id: uid() }).select().single();
    if (error) { setRvts(prev => prev.filter(r => r.id !== tempId)); return null; }
    setRvts(prev => prev.map(r => r.id === tempId ? data : r));
    return data.id;
  };

  const updateRVT = async (id, campo, valor) => {
    setRvts(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));
    await supabase.from('rvt').update({ [campo]: valor, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid());
  };

  const deleteRVT = async (id) => {
    setRvts(prev => prev.filter(r => r.id !== id));
    await supabase.from('rvt').delete().eq('id', id).eq('user_id', uid());
  };

  // ── Tipos de Serviço ──────────────────────────────────────
  const addTipoServico = async (dados) => {
    const tempId = `tmp_${Date.now()}`;
    setTiposServico(prev => [{ ...dados, id: tempId }, ...prev]);
    const { data, error } = await supabase.from('tipos_servico').insert({ ...dados, user_id: uid() }).select().single();
    if (error) { setTiposServico(prev => prev.filter(t => t.id !== tempId)); return null; }
    setTiposServico(prev => prev.map(t => t.id === tempId ? data : t));
    return data.id;
  };

  const updateTipoServico = async (id, campo, valor) => {
    setTiposServico(prev => prev.map(t => t.id === id ? { ...t, [campo]: valor } : t));
    await supabase.from('tipos_servico').update({ [campo]: valor }).eq('id', id).eq('user_id', uid());
  };

  const deleteTipoServico = async (id) => {
    setTiposServico(prev => prev.filter(t => t.id !== id));
    await supabase.from('tipos_servico').delete().eq('id', id).eq('user_id', uid());
  };

  // ── Métricas ──────────────────────────────────────────────
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

  // ── Reverter alteração (undo real) ────────────────────────
  const reverterAlteracao = async (altId) => {
    const alt = historico.find(h => h.id === altId);
    if (!alt || alt.desfeito || alt.anterior === null || !alt.entityType) return;

    // Security: validate campo against allowed whitelist for this entityType
    if (!ALLOWED_CAMPOS[alt.entityType]?.has(alt.campo)) return;

    setHistorico(prev => prev.map(h => h.id === altId ? { ...h, desfeito: true } : h));
    supabase.from('historico').update({ desfeito: true }).eq('id', altId).eq('user_id', uid());

    const val = alt.anterior;
    const valNum = parseFloat(val);
    const currentUid = uid();

    switch (alt.entityType) {
      case 'obra': {
        const dbField = { nome:'nome', endereco:'endereco', status:'status', orcamento:'orcamento', previsao:'previsao' }[alt.campo];
        if (!dbField) return;
        const tv = alt.campo === 'orcamento' && !isNaN(valNum) ? valNum : val;
        setObras(prev => prev.map(o => o.id === alt.entityId ? { ...o, [alt.campo]: tv } : o));
        await supabase.from('obras').update({ [dbField]: tv }).eq('id', alt.entityId).eq('user_id', currentUid);
        break;
      }
      case 'gasto': {
        const dbField = { descricao:'descricao', valor:'valor', data:'data', categoria:'categoria' }[alt.campo];
        if (!dbField) return;
        const tv = alt.campo === 'valor' && !isNaN(valNum) ? valNum : val;
        setObras(prev => prev.map(o => o.id === alt.obraId
          ? { ...o, gastosDespesas: o.gastosDespesas.map(g => g.id === alt.entityId ? { ...g, [alt.campo]: tv } : g) } : o));
        await supabase.from('gastos_despesas').update({ [dbField]: tv }).eq('id', alt.entityId).eq('user_id', currentUid);
        break;
      }
      case 'proposta': {
        const dbMap = { clienteNome:'cliente_nome', clienteCnpj:'cliente_cnpj', clienteEndereco:'cliente_endereco', margemLucro:'margem_lucro', impostos:'impostos', condicoesPagamento:'condicoes_pagamento', valorProposto:'valor_proposto', observacoes:'observacoes', obraId:'obra_id', orcamentoId:'orcamento_id', nome:'nome', status:'status' };
        const dbField = dbMap[alt.campo];
        if (!dbField) return;
        const tv = ['margemLucro','impostos','valorProposto'].includes(alt.campo) && !isNaN(valNum) ? valNum : val;
        setPropostas(prev => prev.map(p => p.id === alt.entityId ? { ...p, [alt.campo]: tv } : p));
        await supabase.from('propostas').update({ [dbField]: tv }).eq('id', alt.entityId).eq('user_id', currentUid);
        break;
      }
      case 'cronograma': {
        const dbMap = { etapa:'etapa', dataInicio:'data_inicio', dataFim:'data_fim', custo:'custo', progresso:'progresso', cor:'cor' };
        const dbField = dbMap[alt.campo];
        if (!dbField) return;
        const tv = ['custo','progresso'].includes(alt.campo) && !isNaN(valNum) ? valNum : val;
        setCronogramas(prev => prev.map(c => c.id === alt.entityId ? { ...c, [alt.campo]: tv } : c));
        await supabase.from('cronogramas').update({ [dbField]: tv }).eq('id', alt.entityId).eq('user_id', currentUid);
        break;
      }
      case 'funcionario': {
        const dbMap = { nome:'nome', funcao:'funcao', custoDiaria:'custo_diaria', diasTrabalhados:'dias_trabalhados', obraAtualId:'obra_atual_id', desempenho:'desempenho' };
        const dbField = dbMap[alt.campo];
        if (!dbField) return;
        const tv = ['custoDiaria','diasTrabalhados'].includes(alt.campo) && !isNaN(valNum) ? valNum : val;
        setFuncionarios(prev => prev.map(f => f.id === alt.entityId ? { ...f, [alt.campo]: tv } : f));
        await supabase.from('funcionarios').update({ [dbField]: tv || null }).eq('id', alt.entityId).eq('user_id', currentUid);
        break;
      }
      case 'catalogo': {
        const dbField = { nome:'nome', tipo:'tipo', custo:'custo' }[alt.campo];
        if (!dbField) return;
        const tv = alt.campo === 'custo' && !isNaN(valNum) ? valNum : val;
        setCatalogo(prev => prev.map(i => i.id === alt.entityId ? { ...i, [alt.campo]: tv } : i));
        await supabase.from('catalogo').update({ [dbField]: tv }).eq('id', alt.entityId).eq('user_id', currentUid);
        break;
      }
      case 'transacao': {
        const dbField = { descricao:'descricao', data:'data', valor:'valor', tipo:'tipo', status:'status' }[alt.campo];
        if (!dbField) return;
        const tv = alt.campo === 'valor' && !isNaN(valNum) ? valNum : val;
        setTransacoes(prev => prev.map(t => t.id === alt.entityId ? { ...t, [alt.campo]: tv } : t));
        await supabase.from('transacoes').update({ [dbField]: tv }).eq('id', alt.entityId).eq('user_id', currentUid);
        break;
      }
      default: break;
    }
  };

  // ── Notificações ──────────────────────────────────────────
  const marcarComoLida = (id) => setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  const getNotificacoesNaoLidas = () => notificacoes.filter(n => !n.lida).length;

  // ── Utils ─────────────────────────────────────────────────
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return dateStr; }
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, authLoading, dataLoading, user, login, signUp, logout,
      empresa, updateEmpresa,
      clientes, addCliente, updateCliente, deleteCliente,
      fornecedores, addFornecedor, updateFornecedor, deleteFornecedor,
      obras, addObra, updateObra, deleteObra, addGastoDaObra, updateGasto, deleteGasto, calcProgressoFinanceiro,
      listaOrcamentos, addOrcamento, updateOrcamento, deleteOrcamento, addOrcamentoItem, updateOrcamentoItem, deleteOrcamentoItem, updateOrcamentoExtras, getOrcamentoObra, getTotalOrcamento,
      propostas, getPropostaObra, updateProposta, addProposta, deleteProposta,
      cronogramas, getCronogramaObra, addEtapaCronograma, updateEtapaCronograma, deleteEtapaCronograma,
      arquivos, getArquivosObra, addArquivo, deleteArquivo,
      funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, updateDias,
      registrosDesempenho, addRegistroDesempenho, updateRegistroDesempenho, deleteRegistroDesempenho, getDesempenhoFuncionario,
      getTopClientes, getTopFornecedores,
      catalogo, addCatalogoItem, updateCatalogoItem, deleteCatalogoItem,
      transacoes, addTransacao, updateTransacao, deleteTransacao,
      compras, addCompra, updateCompra, deleteCompra,
      ptcs, addPTC, updatePTC, deletePTC,
      rvts, addRVT, updateRVT, deleteRVT,
      tiposServico, addTipoServico, updateTipoServico, deleteTipoServico,
      notificacoes, marcarComoLida, getNotificacoesNaoLidas,
      historico, registrarAlteracao, reverterAlteracao,
      versoes, salvarVersao,
      formatCurrency, formatDate
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
