import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Lock, User, Eye, EyeOff, Construction } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function Login() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const success = login(password);
      if (success) {
        navigate('/');
      } else {
        setError('Senha incorreta. Tente novamente.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="login-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
      padding: 20
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: 400, 
        padding: 40, 
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: 'none'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src={logoImg} alt="Logo" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Entre com sua senha de acesso</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Usuário</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                defaultValue="Administrador" 
                disabled 
                style={{ 
                  width: '100%', 
                  padding: '10px 10px 10px 40px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border)', 
                  background: '#F1F5F9',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed'
                }} 
              />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input 
                autoFocus
                required
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                style={{ 
                  width: '100%', 
                  padding: '10px 40px', 
                  borderRadius: 'var(--radius-md)', 
                  border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, 
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: 12, 
              fontSize: 16, 
              fontWeight: 600,
              marginTop: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
            Dica: use a senha <strong>123456</strong> para demonstração.
          </p>
        </form>
      </div>
    </div>
  );
}
