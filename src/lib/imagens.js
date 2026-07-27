/**
 * Preparação de imagens para os documentos impressos.
 *
 * As fotos precisam virar data URI: o documento é aberto em uma janela
 * `about:blank` (ver src/lib/logo.js), onde blob:/object URLs da página do app
 * não são acessíveis. Também reduzimos a resolução — o quadro de foto do RTE
 * tem ~85mm de largura, o que dá cerca de 1000px a 300dpi; guardar o arquivo
 * original de 4000px só deixaria o documento pesado e a impressão lenta.
 */

const MAX_PX = 1400;
const QUALIDADE = 0.82;

/** Redimensiona mantendo a proporção, sem ampliar imagens pequenas. */
function novaEscala(largura, altura, maxPx) {
  const maior = Math.max(largura, altura);
  if (maior <= maxPx) return { largura, altura };
  const f = maxPx / maior;
  return { largura: Math.round(largura * f), altura: Math.round(altura * f) };
}

function carregarImagem(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('formato de imagem não suportado pelo navegador')); };
    img.src = url;
  });
}

/**
 * Converte um arquivo escolhido pelo usuário em uma foto pronta para impressão.
 * @param {File} file
 * @returns {Promise<{src: string, legenda: string, nome: string}>}
 */
export async function arquivoParaFoto(file, { maxPx = MAX_PX, qualidade = QUALIDADE } = {}) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" não é uma imagem`);
  }
  const img = await carregarImagem(file);
  const { largura, altura } = novaEscala(img.naturalWidth, img.naturalHeight, maxPx);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';               // JPEG não tem transparência
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(img, 0, 0, largura, altura);

  return {
    src: canvas.toDataURL('image/jpeg', qualidade),
    legenda: '',
    nome: file.name,
  };
}

/**
 * Converte vários arquivos, ignorando os que falharem.
 * @returns {Promise<{fotos: Array, erros: string[]}>}
 */
export async function arquivosParaFotos(files, opcoes) {
  const fotos = [];
  const erros = [];
  for (const file of Array.from(files || [])) {
    try {
      fotos.push(await arquivoParaFoto(file, opcoes));
    } catch (e) {
      erros.push(e.message || `falha ao ler "${file.name}"`);
    }
  }
  return { fotos, erros };
}

/** Total de fotos em um mapa { grupoId: Foto[] }. */
export function contarFotos(mapa) {
  return Object.values(mapa || {}).reduce((t, l) => t + (Array.isArray(l) ? l.length : 0), 0);
}
