// Script temporário para gerar HTML de teste do RTE
import { gerarHTMLRTE } from './src/templates/rteTemplate.js';
import { writeFileSync } from 'fs';

const empresa = {
  nomeFantasia: 'Engeplar',
  razaoSocial: 'Engeplar Indústria e Comércio Ltda',
  logo: 'http://localhost:5173/src/assets/logo.jpeg',
  endereco: 'Rua Amazonas, 475 — Rio dos Cedros/SC',
  telefone: '(47) 3386-0000',
  email: 'contato@engeplar.com.br',
  site: 'www.engeplar.com.br',
};

const obra = {
  nome: 'BRF — Tanque TQ-01',
  endereco: 'Rua das Indústrias, 100 — Tatuí/SP',
  tipoServico: 'REVESTIMENTO_PINTURA',
  descricaoTecnica: 'Tratamento anticorrosivo interno e externo do tanque TQ-01.',
  responsavelCliente: 'Carlos Silva',
  rteNumero: 'RTE-0019.12.25 REV00',
  garantiaMeses: 36,
  inspecaoMeses: 12,
  pedidoNumero: 'PED-2025-001',
  artNumero: 'ART-2025-001',
  nfNumero: 'NF-001234',
  dimensoes: { diametro: '3,2 m', altura: '4,5 m', area: '45 m²' },
  dadosRte: {
    produto_nome: 'Eposeal 300',
    fabricante: 'Sika',
    norma_jato: 'Sa 2,5',
    sistema_aplicacao: 'Airless',
    camada_1_material: 'Primer epóxi',
    camada_1_cor: 'Cinza',
    camada_1_esp_umida: '125',
    camada_1_esp_seca: '75',
    camada_2_material: 'Eposeal 300',
    camada_2_cor: 'RAL 7035',
    camada_2_esp_umida: '250',
    camada_2_esp_seca: '150',
    espessura_total: '225',
  },
};

const cronograma = [
  { etapa: 'Preparação de Superfície', dataInicio: '2025-11-10', dataFim: '2025-11-12', progresso: 100 },
  { etapa: 'Aplicação do Primer', dataInicio: '2025-11-13', dataFim: '2025-11-14', progresso: 100 },
  { etapa: 'Aplicação da Camada Final', dataInicio: '2025-11-15', dataFim: '2025-11-16', progresso: 100 },
];

const proposta = { nome: 'PTC-2025-001', ptc_numero: 'PTC-0012.11.25' };

const tecnicos = [
  { nome: 'João Peiker', funcao: 'Técnico de Revestimento' },
];

const html = gerarHTMLRTE(obra, empresa, cronograma, proposta, tecnicos);
writeFileSync('./verify_rte_output.html', html, 'utf-8');
console.log('HTML gerado: verify_rte_output.html');
