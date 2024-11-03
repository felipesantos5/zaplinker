import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { useToast } from './hooks/use-toast';
import { auth } from './config/firebase';
import { createOrUpdateUser, fetchNumbers, updateCustomUrl } from './services/api';
import { User, WhatsappNumber, FirebaseUserType } from './types';
import AddNumberForm from './components/AddNumberForm';
import NumberList from './components/NumberList';
import Header from './components/Header';

const API_BASE_URL = 'http://localhost:5000';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [numbers, setNumbers] = useState<WhatsappNumber[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [personalLink, setPersonalLink] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userData = await createOrUpdateUser(fbUser);
          setUser(userData);
          // Resetar customUrl e personalLink
          setCustomUrl('');
          setPersonalLink(userData.customUrl ? `${API_BASE_URL}/${userData.customUrl}` : null);
          fetchNumbers(fbUser.uid).then(setNumbers);
        } catch (error) {
          console.error('Erro ao processar usuário após login:', error);
          // Resetar estados em caso de erro
          setUser(null);
          setCustomUrl('');
          setPersonalLink(null);
        }
      } else {
        // Usuário deslogado, resetar todos os estados
        setUser(null);
        setNumbers([]);
        setCustomUrl('');
        setPersonalLink(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.customUrl) {
      setPersonalLink(`${API_BASE_URL}/${user.customUrl}`);
    }
  }, [user]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login realizado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  const signOut = () => {
    auth.signOut();
    toast({
      title: "Logout realizado com sucesso",
      description: new Date().toLocaleString(),
    });
  };

  const handleCustomUrlUpdate = async () => {
    if (!firebaseUser) return;

    const urlRegex = /^[a-zA-Z0-9_-]+$/;
    if (!urlRegex.test(customUrl)) {
      toast({
        title: "URL inválida",
        description: "Use apenas letras, números, underscores e hífens.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await updateCustomUrl(firebaseUser.uid, customUrl);
      setUser(response.data.user);
      setPersonalLink(`${API_BASE_URL}/${response.data.user.customUrl}`);
      toast({
        title: "URL personalizada atualizada",
        description: "Sua URL personalizada foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar URL personalizada:', error);
      toast({
        title: "Erro ao atualizar URL",
        description: "Não foi possível atualizar sua URL personalizada. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <h1 className="text-4xl font-bold mb-8 text-zinc-800">Zapfy</h1>
        <Button onClick={signInWithGoogle} className="bg-zinc-800 text-white">
          Entrar com Google
        </Button>
      </div>
    );
  }

  return (
    <>
      <Header firebaseUser={firebaseUser} onSignOut={signOut} />

      <main className="max-w-6xl mx-auto mt-14 bg-white min-h-screen">
        <section className='flex justify-between gap-16'>
          <AddNumberForm
            firebaseUser={firebaseUser}
            onNumberAdded={() => fetchNumbers(firebaseUser.uid).then(setNumbers)}
          />
          <NumberList
            numbers={numbers}
            firebaseUser={firebaseUser}
            onNumbersChange={() => fetchNumbers(firebaseUser.uid).then(setNumbers)}
          />
        </section>

        <div className="mt-8">
          <p className="font-semibold mb-2 text-zinc-700">Sua URL personalizada:</p>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Digite sua URL personalizada"
              className='max-w-[445px]'
            />
            <Button onClick={handleCustomUrlUpdate}>
              Atualizar URL
            </Button>
          </div>
          {personalLink && (
            <a href={personalLink} target="_blank" rel="noopener noreferrer" className="mt-2 block text-blue-500 hover:underline break-all">
              {personalLink}
            </a>
          )}
        </div>
      </main>
    </>
  );
};

export default App;