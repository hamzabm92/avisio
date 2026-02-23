import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';

type Mode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        navigate('/dashboard');
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          }
        });
        if (authError) throw authError;
        setSuccess('Vérifiez votre email pour confirmer votre compte.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : msg
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#FAF7F4' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
            style={{ backgroundColor: '#2C2420' }}
          >
            <MessageSquare size={24} color="#C9A96E" />
          </div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
          >
            Avisio
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A7F78' }}>
            Automatisez vos avis Google
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #EDE8E3' }}>
          <h2
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
          >
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h2>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm"
              style={{ backgroundColor: '#F9EDEC', color: '#C97A7A' }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-4 p-3 rounded-xl text-sm"
              style={{ backgroundColor: '#E8F4F1', color: '#7EB5A6' }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="vous@hotel.fr"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  border: '1px solid #EDE8E3',
                  backgroundColor: '#FAF7F4',
                  color: '#2C2420',
                }}
                onFocus={e => { e.target.style.borderColor = '#C9A96E'; e.target.style.backgroundColor = 'white'; }}
                onBlur={e => { e.target.style.borderColor = '#EDE8E3'; e.target.style.backgroundColor = '#FAF7F4'; }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: '1px solid #EDE8E3',
                    backgroundColor: '#FAF7F4',
                    color: '#2C2420',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#C9A96E'; e.target.style.backgroundColor = 'white'; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE8E3'; e.target.style.backgroundColor = '#FAF7F4'; }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#8A7F78' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#8A7F78' }}>
              {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                className="font-medium underline"
                style={{ color: '#C9A96E' }}
              >
                {mode === 'login' ? "S'inscrire" : 'Se connecter'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
