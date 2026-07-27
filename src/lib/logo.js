/* Versões para impressão, embutidas como data URI. A logo usada nos documentos
   é a PNG sem fundo: o logo.jpeg tem branco opaco e recortaria um retângulo
   branco sobre a marca d'água. O logo.jpeg continua servindo a interface. */
import logoInline from '../assets/logo-documento.png?inline';
import simboloInline from '../assets/simbolo-engeplar.png?inline';

/**
 * Resolução da logo para os documentos impressos (RTE, PTC, RVT).
 *
 * Os documentos são abertos com `window.open('', '_blank')` — um documento
 * `about:blank`, que não tem URL base. Caminhos relativos ('/logo.png',
 * '/assets/logo-a1b2c3.jpeg') não resolvem nesse contexto e a logo simplesmente
 * não aparece no PDF. Por isso a logo entregue ao template é sempre absoluta:
 * uma data URI (asset embutido no bundle via `?inline`) ou uma URL http(s).
 */

/** Logo Engeplar embutida no bundle como data URI — sempre disponível. */
export const logoPadrao = logoInline;

/** Símbolo (engrenagem + busto) usado como marca d'água de fundo dos documentos. */
export const simboloPadrao = simboloInline;

/** Converte a logo configurada em uma URL utilizável fora da página do app. */
export function resolverLogo(logoEmpresa) {
  const src = String(logoEmpresa || '').trim();
  if (!src) return logoPadrao;
  if (/^(https?:|data:)/i.test(src)) return src;
  try { return new URL(src, window.location.origin).href; }
  catch { return logoPadrao; }
}

/** Testa se uma imagem carrega de fato (usado antes de gerar o documento). */
function carrega(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/**
 * Logo garantida para impressão: usa a configurada em Perfil quando ela
 * realmente carrega e cai na logo embutida quando o caminho está quebrado
 * (caso comum do valor sugerido '/logo.png', que pode não existir).
 */
export async function resolverLogoImpressao(logoEmpresa) {
  const src = resolverLogo(logoEmpresa);
  if (src === logoPadrao) return src;
  return (await carrega(src)) ? src : logoPadrao;
}

/** Devolve a empresa com logo e símbolo já resolvidos para impressão. */
export async function empresaParaImpressao(empresa) {
  return {
    ...empresa,
    logo: await resolverLogoImpressao(empresa?.logo),
    simbolo: empresa?.simbolo ? resolverLogo(empresa.simbolo) : simboloPadrao,
  };
}
