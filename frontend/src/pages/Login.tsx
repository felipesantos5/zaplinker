import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useUser } from '@/contexts/UserContext';

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-4xl font-bold mb-8 text-zinc-900">Zapfy</h1>
      <Button
        onClick={handleLogin}
        className="bg-zinc-800 text-white"
        disabled={isLoading}
      >
        {isLoading ? 'Entrando...' : 'Entrar com Google'}
      </Button>
    </div>
  );
};

export default Login;