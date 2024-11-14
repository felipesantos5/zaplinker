import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { Button } from './components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Switch } from './components/ui/switch';
import { useToast } from './hooks/use-toast';
import { Input } from './components/ui/input';
import logo from './assets/zapfy-logo-white.png'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { FiLogOut, FiMoreVertical, FiTrash2 } from "react-icons/fi";

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

interface Workspace {
  _id: string;
  name: string;
  customUrl: string;
}

interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Constantes
const API_BASE_URL = 'http://localhost:5000';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [number, setNumber] = useState('');
  const [text, setText] = useState('');
  const [numbers, setNumbers] = useState<WhatsappNumber[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceUrl, setNewWorkspaceUrl] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [createWorkspace, setCreateWorkspace] = useState(false);
  const [isConfiguringWorkspace, setIsConfiguringWorkspace] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userData = await createOrUpdateUser(fbUser);
        setUser(userData);
        fetchWorkspaces(fbUser.uid);
      } else {
        setUser(null);
        setWorkspaces([]);
        setSelectedWorkspace(null);
        setNumbers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchWorkspaces = async (userId: string) => {
    try {
      const response = await axios.get<Workspace[]>(`${API_BASE_URL}/api/workspaces`, {
        headers: { 'Firebase-UID': userId }
      });
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Erro ao buscar workspaces:', error);
    }
  };

  // USER ROUTES

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

  // NUMBER ROUTES

  const fetchNumbers = async (workspaceId: string) => {
    try {
      const response = await axios.get<WhatsappNumber[]>(`${API_BASE_URL}/api/whatsapp/${workspaceId}`, {
        headers: { 'Firebase-UID': firebaseUser?.uid }
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
    if (!firebaseUser || !selectedWorkspace) return;

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
        { workspaceId: selectedWorkspace._id, number: cleanNumber, text },
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      setNumber('');
      setText('');
      fetchNumbers(selectedWorkspace._id);
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
    if (!firebaseUser || !selectedWorkspace) return;

    try {
      await axios.put(`${API_BASE_URL}/api/whatsapp/${numberId}/toggle`,
        { isActive: !currentStatus },
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchNumbers(selectedWorkspace._id);

      if (currentStatus) {
        toast({
          title: "Número desativado com sucesso."
        });
      } else {
        toast({
          title: "Número ativado com sucesso"
        });
      }

    } catch (error) {
      console.error('Erro ao alterar status do número:', error);
    }
  };

  const deleteNumber = async (numberId: string) => {
    if (!firebaseUser || !selectedWorkspace) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/whatsapp/${numberId}`,
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchNumbers(selectedWorkspace._id);
      toast({
        title: "Número deletado com sucesso."
      });
    } catch (error) {
      console.error('Erro ao deletar número:', error);
    }
  };

  // WORKSPACE LOGICS

  const validateCustomUrl = (url: string) => {
    const urlRegex = /^[a-zA-Z0-9_-]+$/;
    return urlRegex.test(url);
  };

  const handleCreateWorkspace = async () => {
    if (!firebaseUser) return;

    if (!validateCustomUrl(newWorkspaceUrl)) {
      toast({
        title: "URL inválida",
        description: "Use apenas letras, números, underscores e hífens.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/workspace`,
        { name: newWorkspaceName, customUrl: newWorkspaceUrl },
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchWorkspaces(firebaseUser.uid);
      setNewWorkspaceName('');
      setNewWorkspaceUrl('');
      toast({
        title: "Workspace criado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao criar workspace:', error);
      toast({
        title: "Erro ao criar workspace",
        description: "Não foi possível criar o workspace. Tente novamente.",
        variant: "destructive",
      });
    }

    setCreateWorkspace(false)
  };

  const handleUpdateWorkspace = async () => {
    if (!firebaseUser || !selectedWorkspace) return;

    if (!validateCustomUrl(selectedWorkspace.customUrl)) {
      toast({
        title: "URL inválida",
        description: "Use apenas letras, números, underscores e hífens.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/api/workspace/${selectedWorkspace._id}`,
        { name: selectedWorkspace.name, customUrl: selectedWorkspace.customUrl },
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchWorkspaces(firebaseUser.uid);
      toast({
        title: "Workspace atualizado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 409) {
          toast({
            title: "URL personalizada já em uso",
            description: "Esta URL personalizada já está sendo utilizada. Escolha uma URL diferente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao atualizar workspace",
            description: error.response.data.message || "Não foi possível atualizar o workspace. Tente novamente.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro ao atualizar workspace",
          description: "Não foi possível atualizar o workspace. Tente novamente.",
          variant: "destructive",
        });
      }
    }
    setIsConfiguringWorkspace(false)
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setIsConfiguring(true);
    fetchNumbers(workspace._id);
  };

  const handleEditWorkSpace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setIsConfiguringWorkspace(true);
    fetchNumbers(workspace._id);
  };

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <h1 className="text-4xl font-bold mb-8 text-zinc-900">Zapfy</h1>
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

    //login
    <div className='flex h-screen'>
      <aside className="bg-zinc-900 pt-8 pb-12 max-w-[100px] px-3 rounded-full m-2">
        <div className='flex h-full flex-col justify-between items-center'>
          <a>
            <img className='w-9' src={logo} alt="" />
          </a>
          <div className="flex items-center gap-6">

            <button
              onClick={signOut}
            >
              <FiLogOut color='white' size={'20px'} />
            </button>
          </div>
        </div>
      </aside>

      <main className="max-w-5xl mx-auto mt-14 bg-white">

        {/* criar workspace */}
        {createWorkspace &&
          <Dialog open={createWorkspace} onOpenChange={setCreateWorkspace}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='mb-6'>Criar workspace</DialogTitle>
                <DialogDescription className='flex flex-col gap-4'>
                  <Input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Nome do novo workspace"
                  />
                  <Input
                    type="text"
                    value={newWorkspaceUrl}
                    onChange={(e) => setNewWorkspaceUrl(e.target.value)}
                    placeholder="URL personalizada"
                  />
                  <Button onClick={handleCreateWorkspace}>Criar Workspace</Button>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        }

        {/* editar workspace */}
        {isConfiguringWorkspace &&
          <Dialog open={isConfiguringWorkspace} onOpenChange={setIsConfiguringWorkspace}>
            <DialogContent className='p-12 w-[1600px]'>
              <DialogHeader>
                <DialogTitle className='text-[28px] mb-10'>Editar Workspace</DialogTitle>
                <DialogDescription>
                  <section className="">
                    <div className="flex flex-col gap-2 mb-4">
                      <div className='mb-2 flex flex-col gap-2'>
                        <label htmlFor="">Nome do workspace</label>
                        <Input
                          type="text"
                          value={selectedWorkspace?.name || ''}
                          onChange={(e) => {
                            if (selectedWorkspace) {
                              setSelectedWorkspace({
                                ...selectedWorkspace,
                                name: e.target.value
                              });
                            }
                          }}
                          placeholder="Nome do workspace"
                        />
                      </div>
                      <div className='mb-8 flex flex-col gap-2'>
                        <label htmlFor="">Url personalizada</label>
                        <Input
                          type="text"
                          value={selectedWorkspace?.customUrl || ''}
                          onChange={(e) => {
                            if (selectedWorkspace) {
                              setSelectedWorkspace({
                                ...selectedWorkspace,
                                customUrl: e.target.value
                              });
                            }
                          }}
                          placeholder="URL personalizada"
                        />
                      </div>


                    </div>
                  </section>
                  <div className='flex gap-4 justify-between items-center'>
                    <Button onClick={handleUpdateWorkspace} className='w-[50%] h-10' >Atualizar</Button>
                    <Button onClick={() => setIsConfiguringWorkspace(false)} className='w-[50%]' variant='outline'  >Deletar</Button>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        }

        {!isConfiguring ? (
          <section>
            <p className="text-black text-sm mb-2"><span className=''>Bem-vindo,</span>{firebaseUser.displayName}</p>
            <div className='flex justify-between mb-8'>
              <h2 className="text-5xl font-bold text-zinc-800">Workspaces</h2>
              <Button onClick={() => setCreateWorkspace(true)} className='h-10'>Criar workspace</Button>
            </div>
            <Table className='mt-10'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[600px]'>Nome</TableHead>
                  {/* <TableHead>URL Personalizada</TableHead> */}
                  <TableHead className='text-center translate-x-6'>Entrar</TableHead>
                  <TableHead className='text-right'>Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map((workspace) => (
                  <TableRow key={workspace._id}>
                    <TableCell>{workspace.name}</TableCell>
                    {/* <TableCell>{workspace.customUrl}</TableCell> */}
                    <TableCell className='text-cente'>
                      <Button onClick={() => handleSelectWorkspace(workspace)}>Acessar</Button>
                    </TableCell>
                    <TableCell className='text-right'>
                      <button onClick={() => handleEditWorkSpace(workspace)}>
                        <FiMoreVertical />
                      </button>
                    </TableCell>


                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ) : (
          <div className='w-6xl'>
            <div className='flex items-center mb-4'>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <a onClick={() => setIsConfiguring(false)} className="cursor-pointer hover:underline font-bo">Voltar</a>
            </div>

            {selectedWorkspace && (
              <>
                <section className='flex flex-col  gap-16 '>
                  <form onSubmit={handleSubmit} className="">
                    <h2 className="text-5xl font-bold text-zinc-800">{selectedWorkspace.name}</h2>
                    <div className="flex flex-col gap-4 mb-4 ">

                      <div className='flex flex-col gap-2'>
                        <label htmlFor="">Número <span className='text-xs'>*</span></label>
                        <Input
                          type="text"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="Número do WhatsApp (ex: 48991319311)"
                          required

                        />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <label htmlFor="">Mensagem</label>
                        <Input
                          type="text"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Texto (opcional)"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-zinc-800 text-white"
                    >
                      Adicionar
                    </Button>
                  </form>

                  <div className='max-w-[100%] w-full border border-gray-200 p-4 rounded-xl mt-16'>
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
                            <TableCell className='text-center'>
                              <button
                                onClick={() => deleteNumber(num._id)}
                              >
                                <FiTrash2 size={'20px'} />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                {/* <div className="mt-8">
                  <p className="font-semibold mb-2 text-zinc-700">URL personalizada do workspace:</p>
                  <a href={`${API_BASE_URL}/${selectedWorkspace.customUrl}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-blue-500 hover:underline break-all">
                    {`${API_BASE_URL}/${selectedWorkspace.customUrl}`}
                  </a>
                </div> */}
              </>
            )}
          </div>
        )}
      </main >
    </div>
  );
};

export default App;