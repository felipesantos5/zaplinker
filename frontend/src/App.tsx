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
import { FiExternalLink, FiLogOut, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { Spinner } from './components/Spinner';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

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
    setIsLoadingWorkspaces(true);
    try {
      const response = await axios.get<Workspace[]>(`${API_BASE_URL}/api/workspaces`, {
        headers: { 'Firebase-UID': userId }
      });
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Erro ao buscar workspaces:', error);
    } finally {
      setIsLoadingWorkspaces(false);
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
    setIsLoadingNumbers(true)
    try {
      const response = await axios.get<WhatsappNumber[]>(`${API_BASE_URL}/api/whatsapp/${workspaceId}`, {
        headers: { 'Firebase-UID': firebaseUser?.uid }
      });
      setNumbers(response.data);
    } catch (error) {
      console.error('Erro ao buscar números:', error);
    } finally {
      setIsLoadingNumbers(false)
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

  // WORKSPACE ROUTES

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
        title: response.data.message
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

  const handleDeleteWorkspace = async () => {
    if (!firebaseUser || !selectedWorkspace) return;

    try {
      // Faz a requisição para deletar o workspace
      await axios.delete(`${API_BASE_URL}/api/workspace/${selectedWorkspace._id}`, {
        headers: { 'Firebase-UID': firebaseUser.uid }
      });

      // Atualiza a lista de workspaces
      fetchWorkspaces(firebaseUser.uid);

      // Limpa o workspace selecionado
      setSelectedWorkspace(null);

      // Fecha qualquer modal ou dropdown de confirmação, se necessário
      setIsConfiguringWorkspace(false);

      setIsConfirmingDelete(false)

      // Mostra toast de sucesso
      toast({
        title: "Workspace deletado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error: any) {
      console.error('Erro ao deletar workspace:', error);

      // Tratamento de erro mais específico
      if (error.response) {
        // Erro de resposta do servidor
        toast({
          title: "Erro ao deletar workspace",
          description: error.response.data.message || "Não foi possível deletar o workspace. Tente novamente.",
          variant: "destructive",
        });
      } else if (error.request) {
        // Erro de conexão
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
          variant: "destructive",
        });
      } else {
        // Erro genérico
        toast({
          title: "Erro ao deletar workspace",
          description: "Não foi possível deletar o workspace. Tente novamente.",
          variant: "destructive",
        });
      }
    }
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

  const handleGoToHome = () => {
    setIsConfiguring(false);
    setSelectedWorkspace(null);
  };

  if (!firebaseUser && !user) {
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
    <div className='h-screen flex flex-col items-center md:flex-row'>
      <aside className="bg-zinc-900 backdrop-blur-sm px-10 py-2 max-w-[90%] w-full m-auto my-2 md:m-2  rounded-full md:max-w-[100px] md:pt-8 md:pb-12 md:h-[95%] md:px-2 md:w-auto">
        <div className='flex h-full items-center md:flex-col  justify-between'>
          <button onClick={handleGoToHome}>
            <img className='w-9' src={logo} alt="" />
          </button>
          <div className="flex items-center gap-6">

            <button
              onClick={signOut}
            >
              <FiLogOut color='white' size={'20px'} />
            </button>
          </div>
        </div>
      </aside>

      <main className="max-w-3xl w-full mx-auto mt-14 bg-white px-4">

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
        {isConfiguringWorkspace && (
          <Dialog open={isConfiguringWorkspace} onOpenChange={setIsConfiguringWorkspace}>
            <DialogContent className='p-12 w-[1600px]'>
              {!isConfirmingDelete ? (
                <>
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
                        <Button
                          onClick={handleUpdateWorkspace}
                          className='w-[50%] h-10'
                        >
                          Atualizar
                        </Button>
                        <Button
                          onClick={() => setIsConfirmingDelete(true)}
                          className='w-[50%] h-10'
                          variant='destructive'
                        >
                          Deletar
                        </Button>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </>
              ) : (
                <DialogHeader>
                  <DialogTitle className='text-[28px] mb-4'>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    <p className="mb-6 text-base text-justify">
                      Tem certeza que deseja deletar o workspace "{selectedWorkspace?.name}"?
                      Esta ação não pode ser desfeita.
                    </p>
                    <div className='flex gap-4 justify-between items-center'>
                      <Button
                        onClick={() => setIsConfirmingDelete(false)}
                        className='w-[50%] h-10'
                        variant='outline'
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleDeleteWorkspace}
                        className='w-[50%] h-10'
                        variant='destructive'
                      >
                        Confirmar Exclusão
                      </Button>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              )}
            </DialogContent>
          </Dialog>
        )}

        {!isConfiguring ? (
          <section>
            <p className="text-black text-sm mb-2"><span className=''>Bem-vindo,</span>{firebaseUser?.displayName}</p>
            <div className='flex justify-between mb-16 flex-wrap gap-4'>
              <h2 className="text-5xl font-bold text-zinc-800">Workspaces</h2>
              <Button onClick={() => setCreateWorkspace(true)} className='h-10'>Criar workspace</Button>
            </div>
            {isLoadingWorkspaces ? (
              <div className="flex justify-center items-center w-full h-full">
                <Spinner />
              </div>
            ) : (
              <Table className=''>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[75%]'>Nome</TableHead>
                    {/* <TableHead>URL Personalizada</TableHead> */}
                    <TableHead className='text-center'>Acessar</TableHead>
                    <TableHead className='text-center'>Editar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((workspace) => (
                    <TableRow key={workspace._id}>
                      <TableCell>{workspace.name}</TableCell>
                      {/* <TableCell>{workspace.customUrl}</TableCell> */}
                      <TableCell className='text-center'>
                        <button onClick={() => handleSelectWorkspace(workspace)}><FiExternalLink size={'18px'} /></button>
                      </TableCell>
                      <TableCell className='text-center'>
                        <button onClick={() => handleEditWorkSpace(workspace)}>
                          <FiMoreVertical />
                        </button>
                      </TableCell>


                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        ) : (
          <div className=''>
            <div className='flex items-center mb-4'>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <a onClick={() => setIsConfiguring(false)} className="cursor-pointer hover:underline font-bo">Voltar</a>
            </div>

            {selectedWorkspace && (
              <>
                <section className='flex flex-col'>
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-5xl font-bold text-zinc-800 mb-16">{selectedWorkspace.name}</h2>
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

                  <div className="border p-4 rounded-xl mt-6">
                    <p className="font-semibold mb-2 text-zinc-700">URL personalizada do workspace:</p>
                    <a href={`${API_BASE_URL}/${selectedWorkspace.customUrl}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-blue-500 hover:underline break-all">
                      {`${API_BASE_URL}/${selectedWorkspace.customUrl}`}
                    </a>
                  </div>

                  <div className=' border border-gray-200 p-4 rounded-xl mt-10'>
                    {isLoadingNumbers ? (
                      <div className="flex justify-center items-center w-full h-full">
                        <Spinner />
                      </div>
                    ) : (
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
                              <TableCell className='text-right pr-4'>
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
                    )}
                  </div>
                </section>


              </>
            )}
          </div>
        )}
      </main >
    </div>
  );
};

export default App;