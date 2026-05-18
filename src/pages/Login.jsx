import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signUp } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    if (mode === 'login') {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'E-mail ou senha incorretos.');
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
            {mode === 'login' ? 'Entre com sua conta' : 'Crie sua conta'}
          </p>
        </div>

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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                required type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                minLength={6}
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
              <button onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Criar conta
              </button>
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Já tem conta?{' '}
              <button onClick={() => { setMode('login'); setError(''); setInfo(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Entrar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
