import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Loader2, AlertCircle, Camera } from 'lucide-react';
import Modal from './Modal';
import { arquivosParaFotos, contarFotos } from '../lib/imagens';

/**
 * Anexo das imagens do relatório, exibido antes de gerar o documento.
 *
 * Cada grupo corresponde a uma seção fotográfica do relatório. Seções sem
 * imagem não são impressas — por isso o aviso explícito no rodapé do modal.
 *
 * @param {Array}  grupos   [{ id, titulo, dica }]
 * @param {Object} fotos    { [grupoId]: [{ src, legenda, nome }] }
 * @param {Function} setFotos
 * @param {Function} onGerar
 */
export default function ModalFotosRelatorio({
  isOpen, onClose, grupos = [], fotos = {}, setFotos, onGerar,
  titulo = 'Imagens do relatório', rotuloGerar = 'Gerar relatório (PDF)',
}) {
  const [carregando, setCarregando] = useState(null);
  const [erros, setErros] = useState([]);
  const inputs = useRef({});

  const doGrupo = (id) => (Array.isArray(fotos[id]) ? fotos[id] : []);
  const total = contarFotos(fotos);
  const secoesComFoto = grupos.filter(g => doGrupo(g.id).length > 0).length;

  const anexar = async (grupoId, fileList) => {
    if (!fileList?.length) return;
    setCarregando(grupoId);
    setErros([]);
    const { fotos: novas, erros: falhas } = await arquivosParaFotos(fileList);
    setFotos(prev => ({ ...prev, [grupoId]: [...(prev[grupoId] || []), ...novas] }));
    setErros(falhas);
    setCarregando(null);
    if (inputs.current[grupoId]) inputs.current[grupoId].value = '';
  };

  const remover = (grupoId, i) => {
    setFotos(prev => ({ ...prev, [grupoId]: (prev[grupoId] || []).filter((_, idx) => idx !== i) }));
  };

  const editarLegenda = (grupoId, i, legenda) => {
    setFotos(prev => ({
      ...prev,
      [grupoId]: (prev[grupoId] || []).map((f, idx) => (idx === i ? { ...f, legenda } : f)),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo} maxWidth="820px">
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Anexe as fotos de cada seção antes de gerar o documento. As legendas são opcionais
        e aparecem abaixo de cada imagem, numeradas como “Figura N”.
      </p>

      {erros.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', padding: 12, marginBottom: 16,
          borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontSize: 13,
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>{erros.map((e, i) => <div key={i}>{e}</div>)}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {grupos.map(grupo => {
          const lista = doGrupo(grupo.id);
          return (
            <div key={grupo.id} style={{
              border: '1px solid var(--border)', borderRadius: 10, padding: 14,
              background: lista.length ? 'var(--card-bg, #fff)' : 'var(--background)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{grupo.titulo}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {lista.length > 0
                      ? `${lista.length} ${lista.length === 1 ? 'imagem anexada' : 'imagens anexadas'}`
                      : (grupo.dica || 'Sem imagens — esta seção não será impressa')}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={carregando === grupo.id}
                  onClick={() => inputs.current[grupo.id]?.click()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {carregando === grupo.id
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processando…</>
                    : <><ImagePlus size={14} /> Anexar imagens</>}
                </button>
                <input
                  ref={el => { inputs.current[grupo.id] = el; }}
                  type="file" accept="image/*" multiple hidden
                  onChange={e => anexar(grupo.id, e.target.files)}
                />
              </div>

              {lista.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 10, marginTop: 12,
                }}>
                  {lista.map((foto, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ position: 'relative', height: 100, background: '#eef2f7' }}>
                        <img
                          src={foto.src} alt={foto.nome || ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => remover(grupo.id, i)}
                          title="Remover imagem"
                          style={{
                            position: 'absolute', top: 4, right: 4, border: 'none', cursor: 'pointer',
                            background: 'rgba(15,23,42,0.75)', color: '#fff',
                            borderRadius: 6, width: 24, height: 24, display: 'grid', placeItems: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        value={foto.legenda || ''}
                        onChange={e => editarLegenda(grupo.id, i, e.target.value)}
                        placeholder="Legenda (opcional)"
                        style={{
                          width: '100%', border: 'none', borderTop: '1px solid var(--border)',
                          padding: '6px 8px', fontSize: 11, outline: 'none', background: 'transparent',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={14} />
          {total === 0
            ? 'Nenhuma imagem anexada — as seções fotográficas ficarão fora do documento.'
            : `${total} ${total === 1 ? 'imagem' : 'imagens'} em ${secoesComFoto} ${secoesComFoto === 1 ? 'seção' : 'seções'}. Seções sem imagem não são impressas.`}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={onGerar} style={{ whiteSpace: 'nowrap' }}>
            {rotuloGerar}
          </button>
        </div>
      </div>
    </Modal>
  );
}
