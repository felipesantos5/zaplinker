import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { Button } from './components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Switch } from './components/ui/switch';
import { useToast } from './hooks/use-toast';
import { Input } from './components/ui/input';
import logo from './assets/zapfy-logo-white.png'

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyALFUMro1Yyr1olR4FOLxYrsJ2hOmJCJnQ",
  authDomain: "zapfy-b8baa.firebaseapp.com",
  projectId: "zapfy-b8baa",
  storageBucket: "zapfy-b8baa.firebasestorage.app",
  messagingSenderId: "1052384737823",
  appId: "1:1052384737823:web:6cae107fc616667eb1332a"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Interfaces
interface WhatsappNumber {
  _id: string;
  number: string;
  text?: string;
  isActive: boolean;
}

interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  customUrl?: string;
}

// Constantes
const API_BASE_URL = 'http://localhost:5000';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [number, setNumber] = useState('');
  const [text, setText] = useState('');
  const [numbers, setNumbers] = useState<WhatsappNumber[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [personalLink, setPersonalLink] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userData = await createOrUpdateUser(fbUser);
        setUser(userData);
        fetchNumbers(fbUser.uid);
      } else {
        setUser(null);
        setNumbers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.customUrl) {
      setPersonalLink(`${API_BASE_URL}/${user.customUrl}`);
    }
  }, [user]);

  const createOrUpdateUser = async (fbUser: FirebaseUser): Promise<User> => {
    try {
      const response = await axios.post<User>(`${API_BASE_URL}/api/user`, {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar/atualizar usuário:', error);
      throw error;
    }
  };

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

  const fetchNumbers = async (userId: string) => {
    try {
      const response = await axios.get<WhatsappNumber[]>(`${API_BASE_URL}/api/whatsapp`, {
        headers: { 'Firebase-UID': userId }
      });
      setNumbers(response.data);
    } catch (error) {
      console.error('Erro ao buscar números:', error);
    }
  };

  const validateWhatsAppNumber = (num: string) => {
    const regex = /^[1-9]\d{10}$/;
    return regex.test(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    const cleanNumber = number.replace(/\D/g, '');

    if (!validateWhatsAppNumber(cleanNumber)) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/whatsapp`,
        { number: cleanNumber, text },
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      setNumber('');
      setText('');
      fetchNumbers(firebaseUser.uid);
      toast({
        title: "Número adicionado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao adicionar número:', error);
      toast({
        title: "Erro ao adicionar número",
        description: "Ocorreu um erro ao tentar adicionar o número.",
        variant: "destructive",
      });
    }
  };

  const toggleNumberStatus = async (numberId: string, currentStatus: boolean) => {
    if (!firebaseUser) return;

    try {
      await axios.put(`${API_BASE_URL}/api/whatsapp/${numberId}/toggle`,
        { isActive: !currentStatus },
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchNumbers(firebaseUser.uid);
      toast({
        title: "Status do número alterado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao alterar status do número:', error);
    }
  };

  const deleteNumber = async (numberId: string) => {
    if (!firebaseUser) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/whatsapp/${numberId}`,
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchNumbers(firebaseUser.uid);
      toast({
        title: "Número deletado com sucesso.",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao deletar número:', error);
    }
  };

  const validateCustomUrl = (url: string) => {
    const urlRegex = /^[a-zA-Z0-9_-]+$/;
    return urlRegex.test(url);
  };

  const handleCustomUrlUpdate = async () => {
    if (!validateCustomUrl(customUrl)) {
      toast({
        title: "URL inválida",
        description: "Use apenas letras, números, underscores e hífens.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/user/custom-url`,
        { customUrl },
        { headers: { 'Firebase-UID': firebaseUser?.uid } }
      );
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
        <Button
          onClick={signInWithGoogle}
          className="bg-zinc-800 text-white"
        >
          Entrar com Google
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="bg-zinc-900 py-3">
        <div className='flex justify-between items-center max-w-6xl m-auto'>
          <div className='flex gap-4 items-center  text-white'>
            <img className='w-10' src={logo} alt="" />
            <h1 className="text-3xl font-bold">Zapfy</h1>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-white"> <span className=''>Bem-vindo,</span> {firebaseUser.displayName}</p>
            <Button
              onClick={signOut}
              className="bg-zinc-800 text-white"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-14 bg-white min-h-screen">

        <section className='flex justify-between gap-16'>
          <form onSubmit={handleSubmit} className="mb-8 max-w-[30%] w-full">
            <div className="flex flex-col gap-4 mb-4">
              <h2 className="text-2xl font-semibold mb-8 text-zinc-800">Números cadastrados:</h2>
              <Input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Número do WhatsApp (ex: 48991319311)"
                required
              />
              <Input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Texto (opcional)"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-zinc-800 text-white"
            >
              Adicionar
            </Button>
          </form>

          <div className='max-w-[70%] w-full border border-gray-200 p-4 rounded-xl'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Número</TableHead>
                  <TableHead>Texto</TableHead>
                  <TableHead className='text-right'>Status</TableHead>
                  <TableHead className='text-right'>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((num) => (
                  <TableRow key={num._id}>
                    <TableCell className="font-medium">{num.number}</TableCell>
                    <TableCell>{num.text || 'Sem texto'}</TableCell>
                    <TableCell className='text-right'>
                      <Switch
                        checked={num.isActive}
                        onCheckedChange={() => toggleNumberStatus(num._id, num.isActive)}
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        onClick={() => deleteNumber(num._id)}
                      >
                        Deletar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
            <Button
              onClick={handleCustomUrlUpdate}
            >
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