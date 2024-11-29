import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from "@/assets/zapfy-logo-white.png"
import { auth } from '@/config/firebase-config';
import { signInWithPopup, GoogleAuthProvider, User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from './components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Switch } from './components/ui/switch';
import { useToast } from './hooks/use-toast';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { FiExternalLink, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { Spinner } from './components/Spinner';
import { XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { AppSidebar } from './components/app-sidebar';
import { RiGoogleFill } from "react-icons/ri";
import { SidebarTrigger } from './components/ui/sidebar';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
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
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const [workspaceStats, setWorkspaceStats] = useState<{ accessCount: number } | null>(null);
  const [numberStats, setNumberStats] = useState<{ number: string; accessCount: number }[]>([]);
  const [selectedWorkspaceStats, setSelectedWorkspaceStats] = useState<{ accessCount: number, numberStats: { number: string, accessCount: number }[] } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userData = await createOrUpdateUser(fbUser);
        setUser(userData);
        console.log(user)
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

  useEffect(() => {
    if (selectedWorkspace) {
      axios.get(`${API_BASE_URL}/api/workspaces/${selectedWorkspace._id}/stats`)
        .then(response => setWorkspaceStats(response.data))
        .catch(error => console.error("Erro ao buscar estatísticas do workspace:", error));

      axios.get(`${API_BASE_URL}/api/workspaces/${selectedWorkspace._id}/numbers/stats`)
        .then(response => setNumberStats(response.data))
        .catch(error => console.error("Erro ao buscar estatísticas dos números:", error));
      axios.get(`${API_BASE_URL}/api/workspace/:id/qrcode`)
        .then(response => setNumberStats(response.data))
        .catch(error => console.error("Erro ao buscar o qr code", error));
    }


  }, [selectedWorkspace]);

  const fetchWorkspaces = async (userId: string) => {
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
    console.log(numberStats)
  };

  // USER ROUTES

  const createOrUpdateUser = async (fbUser: FirebaseUser): Promise<User> => {
    try {
      const response = await axios.post<User>(`${API_BASE_URL}/api/user`, {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName
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

      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  const signOut = () => {
    auth.signOut();
    toast({
      title: "Logout realizado com sucesso",

    });
  };

  // email e senha

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSignInWithEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirecionar ou realizar alguma ação após login bem-sucedido
    } catch (error) {
      setErrorLogin('Erro ao fazer login. Verifique suas credenciais.');
    }
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
      setCreateWorkspace(false)
      fetchWorkspaces(firebaseUser.uid);
      toast({
        title: response.data.message
      });
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 409) {
          toast({
            title: "Erro ao criar o workspace",
            description: "Esta URL personalizada já está sendo utilizada. Escolha uma URL diferente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao atualizar workspace",
            description: error.response.data.message || "Não foi possível criar o workspace. Tente novamente.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro ao criar workspace",
          description: "Não foi possível criar o workspace. Tente novamente.",
          variant: "destructive",
        });
      }
    }
    setNewWorkspaceName('');
    setNewWorkspaceUrl('');
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
      });
      setIsConfiguringWorkspace(false)
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
    fetchWorkspaceStats(workspace._id);
    fetchQrCode(workspace._id);
  };

  const handleEditWorkSpace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setIsConfiguringWorkspace(true);
    fetchNumbers(workspace._id);
  };

  // WORK SPACE STATUS DASH BOARD
  const fetchWorkspaceStats = async (workspaceId: string) => {
    try {
      const [workspaceResponse, numbersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/workspaces/${workspaceId}/stats`),
        axios.get(`${API_BASE_URL}/api/workspaces/${workspaceId}/numbers/stats`)
      ]);

      setSelectedWorkspaceStats({
        accessCount: workspaceResponse.data.accessCount,
        numberStats: numbersResponse.data
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do workspace:', error);
    }
  };

  // const handleViewStats = (workspace: Workspace) => {
  //   fetchWorkspaceStats(workspace._id);
  // };

  // QR CODE

  const fetchQrCode = async (workspaceId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/workspace/${workspaceId}/qrcode`, {
        headers: { 'Firebase-UID': firebaseUser?.uid }
      });
      setQrCodeUrl(response.data.qrCodeDataUrl);
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    }
    console.log(setQrCodeUrl)
  };

  if (!firebaseUser && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black w-full">
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 mb-16">
          <img src={logo} alt='logo Zaplinker' width={'60'}></img>
          <h1 className='text-white font-semibold text-4xl'>Bem vindo a Zaplinker</h1>
          <Button
            onClick={signInWithGoogle}
            className="bg-zinc-800 text-white mb-4 w-full"
          >
            Continue com o Google <RiGoogleFill />
          </Button>
          <hr className='border-white/50 border-t w-full'></hr>
          <div className='flex flex-col gap-4 w-full'>
            <Input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Email"
              className="p-2 border border-zinc-300 rounded w-full text-zinc-50"
            />
            <Input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Senha"
              className="p-2 border border-zinc-300 rounded w-full text-zinc-50"
            />
            <div className='flex flex-col'>
              <Button
                onClick={handleSignInWithEmail}
                className="bg-zinc-800 text-white"
              >
                Entrar
              </Button>
              <a href="/registro" className='text-zinc-400 tracking-tight mt-1'>Não possui conta? <span className='font-semibold hover:underline'>Registre-se</span></a>
            </div>
          </div>


          {errorLogin && <p className="text-red-500">{errorLogin}</p>}
        </div>
      </div>
    );
  }

  return (

    //login
    <div className='flex justify-between w-full'>
      <AppSidebar logout={signOut} />
      <SidebarTrigger />
      <main className="max-w-5xl w-full mx-auto mt-14 bg-white px-4">

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
                          variant={'outline'}
                        >
                          Deletar
                        </Button>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </>
              ) : (
                <DialogHeader>
                  <DialogTitle className='text-[28px] mb-6'>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-justify">
                      Tem certeza que deseja deletar o workspace <strong className='text-base'>"{selectedWorkspace?.name}"</strong> ?</p>
                    <p>Esta ação não pode ser desfeita.</p>

                    <div className='flex gap-4 justify-between items-center mt-6'>
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
            <p className="text-black text-sm mb-2"><span className=''>Bem-vindo, </span>{firebaseUser?.displayName}</p>
            <div className='flex justify-between flex-wrap gap-4 mb-8 md:mb-16'>
              <h2 className="text-4xl md:text-5xl font-bold text-zinc-800">Workspaces</h2>
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
                    <TableHead className='text-center'>Acessar</TableHead>
                    <TableHead className='text-center'>Editar</TableHead>
                    {/* <TableHead className='text-center'>Detalhes</TableHead> */}
                  </TableRow>
                </TableHeader>

                {workspaces.map((workspace) => (
                  <TableBody>
                    <TableRow key={workspace._id}>
                      <TableCell className='capitalize'><button onClick={() => handleSelectWorkspace(workspace)}>{workspace.name}</button></TableCell>
                      <TableCell className='text-center'>
                        <button onClick={() => handleSelectWorkspace(workspace)}><FiExternalLink size={'18px'} /></button>
                      </TableCell>
                      <TableCell className='text-center'>
                        <button onClick={() => handleEditWorkSpace(workspace)}>
                          <FiMoreVertical />
                        </button>
                      </TableCell>
                      {/* <TableCell className='text-center'>
                        <button onClick={() => handleViewStats(workspace)}>Ver Detalhes</button>
                      </TableCell> */}

                    </TableRow>
                  </TableBody>
                ))}

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
                    <h2 className="text-5xl font-bold text-zinc-800 mb-16 capitalize">{selectedWorkspace.name}</h2>
                    <div className="flex flex-col gap-4 mb-4">
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
                      className="w-full bg-zinc-800 text-white h-10"
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

                  <section className=''>
                    <div className="mt-8">
                      {workspaceStats && (
                        <div className='flex flex-col justify-between'>
                          <h3 className="text-xl font-bold mb-4">Estatísticas do Workspace</h3>
                          <p className='mb-2'>Total de acessos: {workspaceStats.accessCount}</p>
                          <BarChart width={500} height={150} data={selectedWorkspaceStats?.numberStats}>
                            <XAxis dataKey="number" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="accessCount" fill="#8884d8" />
                          </BarChart>
                        </div>
                      )}

                      <div className="mt-8">
                        <h3 className="text-xl font-bold">QR Code do Workspace</h3>
                        <img src={qrCodeUrl ?? ""} alt="QR Code" />
                        <a
                          href={qrCodeUrl ?? ""}
                          download="workspace-qrcode.png"
                          className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
                        >
                          Baixar QR Code
                        </a>
                      </div>
                    </div>
                  </section>

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