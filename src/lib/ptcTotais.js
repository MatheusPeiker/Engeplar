/**
 * Totais da PTC — usados no editor, na busca global, nos relatórios e no
 * cálculo de valor gerado por profissional. Ficam aqui porque a PTC virou a
 * única origem de valor comercial do sistema (o módulo de orçamento/proposta
 * foi removido) e mais de uma tela precisa da mesma conta.
 */

const soma = (itens) => (itens || [])
  .reduce((a, i) => a + (Number(i.qtd) || 0) * (Number(i.valor_unit) || 0), 0);

/** Materiais + serviços + frete, sem desconto. */
export function calcTotalPTC(ptc) {
  if (!ptc) return 0;
  return soma(ptc.itens_materiais) + soma(ptc.itens_servicos) + (Number(ptc.frete_valor) || 0);
}

/** Valor que o cliente paga de fato: total menos o desconto. */
export function receitaPTC(ptc) {
  return calcTotalPTC(ptc) - (Number(ptc?.desconto_valor) || 0);
}
