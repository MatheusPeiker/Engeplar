import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  // Rate limiting: block after 5 failed attempts for 60 s
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const { login, signUp } = useAppContext();
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Inclua ao menos uma letra maiúscula';
    if (!/[0-9]/.test(pwd)) return 'Inclua ao menos um número';
    return null;
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const redirectTo = `${window.location.origin}/redefinir-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (error) {
      setError(error.message || 'Erro ao enviar e-mail. Tente novamente.');
    } else {
      setInfo('E-mail de recuperação enviado! Verifique sua caixa de entrada e clique no link.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Rate limit check
    if (lockUntil && Date.now() < lockUntil) {
      const secs = Math.ceil((lockUntil - Date.now()) / 1000);
      setError(`Muitas tentativas incorretas. Aguarde ${secs} segundo${secs !== 1 ? 's' : ''}.`);
      return;
    }

    if (mode === 'signup') {
      const pwdError = validatePassword(password);
      if (pwdError) { setError(pwdError); return; }
    }

    setLoading(true);
    setError('');
    setInfo('');

    if (mode === 'login') {
      const result = await login(email, password);
      if (result.success) {
        setFailedAttempts(0);
        setLockUntil(null);
        navigate('/');
      } else {
        const next = failedAttempts + 1;
        if (next >= 5) {
          setLockUntil(Date.now() + 60_000);
          setFailedAttempts(0);
          setError('Muitas tentativas incorretas. Aguarde 60 segundos antes de tentar novamente.');
        } else {
          setFailedAttempts(next);
          setError(result.error || 'E-mail ou senha incorretos.');
        }
        setLoading(false);
      }
    } else {
      const result = await signUp(email, password);
      if (result.success) {
        setInfo('Conta criada! Verifique seu e-mail para confirmar e depois acesse o sistema.');
        setMode('login');
      } else {
        setError(result.error || 'Erro ao criar conta.');
      }
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(''); setInfo(''); setEmail(''); setPassword(''); };

  const subtitles = {
    login:  'Entre com sua conta',
    signup: 'Crie sua conta',
    forgot: 'Recuperar senha',
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
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src={logoImg} alt="Logo" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>
            {subtitles[mode]}
          </p>
        </div>

        {/* ── MODO: ESQUECEU A SENHA ── */}
        {mode === 'forgot' && (
          <>
            {info ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
                <p style={{ color: 'var(--success)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{info}</p>
                <button onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -12, lineHeight: 1.5 }}>
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    E-mail
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input
                      autoFocus required type="email"
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      style={{
                        width: '100%', padding: '10px 10px 10px 40px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                        outline: 'none'
                      }}
                    />
                  </div>
                  {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</p>}
                </div>
                <button
                  type="submit" disabled={loading} className="btn btn-primary"
                  style={{ width: '100%', padding: 12, fontSize: 15, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
                <button type="button" onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ArrowLeft size={14} /> Voltar ao login
                </button>
              </form>
            )}
          </>
        )}

        {/* ── MODO: LOGIN / CADASTRO ── */}
        {mode !== 'forgot' && (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  E-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                  <input
                    autoFocus required type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    style={{
                      width: '100%', padding: '10px 10px 10px 40px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => switchMode('forgot')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12 }}>
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                  <input
                    required type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Mín. 8 chars, 1 maiúscula, 1 número' : 'Sua senha'}
                    minLength={mode === 'signup' ? 8 : 1}
                    style={{
                      width: '100%', padding: '10px 40px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</p>}
                {info  && <p style={{ color: 'var(--success)', fontSize: 12, marginTop: 6 }}>{info}</p>}
              </div>

              <button
                type="submit" disabled={loading} className="btn btn-primary"
                style={{ width: '100%', padding: 12, fontSize: 16, fontWeight: 600, marginTop: 8, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Aguarde...' : mode === 'login' ? 'Acessar Sistema' : 'Criar Conta'}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              {mode === 'login' ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Não tem conta?{' '}
                  <button onClick={() => switchMode('signup')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Criar conta
                  </button>
                </p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Já tem conta?{' '}
                  <button onClick={() => switchMode('login')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Entrar
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
