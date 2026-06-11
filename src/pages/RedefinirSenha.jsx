import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function RedefinirSenha() {
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'form' | 'done' | 'invalid'
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase v2 processa o hash da URL automaticamente e dispara PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPhase('form');
      }
    });

    // Fallback: após 3s, verifica se já há sessão ativa (caso o evento tenha disparado antes do listener)
    const timeout = setTimeout(async () => {
      setPhase(current => {
        if (current !== 'waiting') return current;
        return 'checking'; // aciona verificação assíncrona abaixo
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Quando phase vira 'checking', verifica sessão existente
  useEffect(() => {
    if (phase !== 'checking') return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Se há sessão e a URL ainda contém indicação de recovery
      const hash = window.location.hash;
      if (session && (hash.includes('type=recovery') || hash.includes('access_token'))) {
        setPhase('form');
      } else if (session) {
        // Já autenticado normalmente — vai para o app
        navigate('/');
      } else {
        setPhase('invalid');
      }
    });
  }, [phase, navigate]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Inclua ao menos uma letra maiúscula';
    if (!/[0-9]/.test(pwd)) return 'Inclua ao menos um número';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }

    setLoading(true);

    // Garante que ainda há sessão válida antes de tentar atualizar
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      setPhase('invalid');
      return;
    }

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      // Erro genérico — instrui o usuário a solicitar novo link
      setError('Sessão expirada ou inválida. Solicite um novo link de recuperação no login.');
    } else {
      setPhase('done');
      // Faz logout para forçar novo login com a senha nova
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', padding: 20
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 400, padding: 40,
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: 'none'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src={logoImg} alt="Logo" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>
            Redefinir senha
          </p>
        </div>

        {/* Aguardando / verificando */}
        {(phase === 'waiting' || phase === 'checking') && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Verificando link...
          </p>
        )}

        {/* Link inválido ou expirado */}
        {phase === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
              Link inválido ou expirado.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              Solicite um novo link clicando em <strong>"Esqueceu a senha?"</strong> na tela de login.
            </p>
            <button onClick={() => navigate('/login')}
              className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
              Ir para o login
            </button>
          </div>
        )}

        {/* Formulário de nova senha */}
        {phase === 'form' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -12, lineHeight: 1.5 }}>
              Escolha uma nova senha para sua conta.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Nova senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                <input
                  autoFocus required type={showPwd ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
                  style={{
                    width: '100%', padding: '10px 40px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                    outline: 'none'
                  }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Confirmar senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                <input
                  required type={showConfirm ? 'text' : 'password'}
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  style={{
                    width: '100%', padding: '10px 40px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                    outline: 'none'
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</p>}
            </div>

            <button
              type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', padding: 12, fontSize: 15, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        {/* Sucesso */}
        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--success)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              Senha redefinida com sucesso!
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Redirecionando para o login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
