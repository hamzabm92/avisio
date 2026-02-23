
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F4' }}>
      <div className="text-center">
        <p
          className="text-8xl font-bold mb-4"
          style={{ fontFamily: 'Playfair Display, serif', color: '#C9A96E' }}
        >
          404
        </p>
        <h1
          className="text-2xl font-semibold mb-2"
          style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
        >
          Page introuvable
        </h1>
        <p className="text-sm mb-8" style={{ color: '#8A7F78' }}>
          La page que vous cherchez n'existe pas.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
