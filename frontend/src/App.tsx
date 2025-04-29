import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth } from '@/config/firebase-config';
import { User as FirebaseUser } from 'firebase/auth';
import { Button } from './components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Switch } from './components/ui/switch';
import { useToast } from './hooks/use-toast';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { FiExternalLink, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { Spinner } from './components/Spinner';
import { AppSidebar } from './components/app-sidebar';
import { SidebarTrigger } from './components/ui/sidebar';
import WorkspaceStatsCard from './components/dashboard/dashCard';
import { ChartLine, ClipboardCopy, QrCode } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { formatPhone } from './helper/formaterPhone';

// Interfaces
interface WhatsappNumber {
  _id: string;
  number: string;
  text?: string;
  isActive: boolean;
}

export interface Workspace {
  _id: string;
  name: string;
  customUrl: string;
}

export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  role?: string
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
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [metrics, setMetrics] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const { toast } = useToast();
  const { isDarkMode } = useTheme();

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

  // useEffect(() => {
  //   if (selectedWorkspace) {
  //     axios.get(`${API_BASE_URL}/api/workspaces/${selectedWorkspace._id}/numbers/stats`)
  //       .then(response => { setNumberStats(response.data); })
  //       .catch(error => console.error("Erro ao buscar estatísticas dos números:", error));
  //     axios.get(`${API_BASE_URL}/api/workspace/:id/qrcode`)
  //       .then(response => setNumberStats(response.data))
  //       .catch(error => console.error("Erro ao buscar o qr code", error));
  //   }
  // }, [selectedWorkspace]);

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
    } catch (error: any) {
      console.error('Erro ao adicionar número:', error);
      toast({
        title: "Erro ao adicionar número",
        description: error.response.data.message,
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
            title: "Erro ao criar workspace",
            description: error.response.data.message || "Não foi possível criar o workspace. Tente novamente.",
            variant: "destructive",
          });
          setCreateWorkspace(false)
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

      toast({
        title: "Workspace deletado com sucesso"
      });

      // Atualiza a lista de workspaces
      fetchWorkspaces(firebaseUser.uid);

      // Limpa o workspace selecionado
      setSelectedWorkspace(null);

      // Fecha qualquer modal ou dropdown de confirmação, se necessário
      setIsConfiguringWorkspace(false);

      setIsConfirmingDelete(false)

      // Mostra toast de sucesso

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

  const handleCopy = () => {
    // Seleciona o texto do input
    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999); // Para dispositivos móveis

      // Copia o texto selecionado
      setIsCopied(true)
      navigator.clipboard.writeText(inputRef.current.value)
    }
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setIsConfiguring(true);
    fetchNumbers(workspace._id);
    fetchQrCode(workspace._id);
  };

  const handleEditWorkSpace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setIsConfiguringWorkspace(true);
    fetchNumbers(workspace._id);
  };


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
  };

  const handleMetrics = () => {
    setMetrics(!metrics)
  }

  const handleBreadCrumb = () => {
    if (metrics) {
      setMetrics(false)
      return
    }
    setIsConfiguring(false)
    setMetrics(false)
  }

  const handleHome = () => {
    setIsConfiguring(false)
    setMetrics(false)
  }

  return (
    <div className='flex justify-between w-full'>
      {user && (
        <AppSidebar user={user} handleHome={handleHome} />
      )}
      <SidebarTrigger className='md:hidden' />
      <main className={`max-w-5xl ${metrics && `max-w-[1200px]`} ${selectedWorkspace && `max-w-[1200px]`} w-full mx-auto mt-14 pr-6`}>

        {/* criar workspace */}
        {createWorkspace &&
          <Dialog open={createWorkspace} onOpenChange={setCreateWorkspace}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='mb-6'>Criar workspace</DialogTitle>
                <DialogDescription className='flex flex-col gap-4'>
                  <div className='flex flex-col gap-1'>
                    <label htmlFor="newWorkspaceName">Nome *</label>
                    <Input
                      type="text"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="Nome do novo workspace"
                    /></div>
                  <div className='flex flex-col gap-1'>
                    <label htmlFor="newWorkspaceUrl">Url *</label>
                    <Input
                      type="text"
                      value={newWorkspaceUrl}
                      onChange={(e) => setNewWorkspaceUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                      placeholder="URL personalizada"
                    />
                  </div>
                  <Button onClick={handleCreateWorkspace} className='h-10 mb-2'>Criar Workspace</Button>
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
                    <DialogTitle className='mb-6'>Editar Workspace</DialogTitle>
                    <DialogDescription>
                      <section>
                        <div className="flex flex-col gap-2">
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
                          <div className='mb-6 flex flex-col gap-2'>
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
                    <p className="text- text-justify">
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
            <p className="text-black dark:text-white text-base mb-2"><span className=''>Bem-vindo, </span>{user?.displayName}</p>
            <div className='flex justify-between flex-wrap gap-4 mb-8 md:mb-16'>
              <h2 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-white">Workspaces</h2>
              <Button onClick={() => setCreateWorkspace(true)} className='h-10'>Criar workspace</Button>
            </div>
            {isLoadingWorkspaces ? (
              <div className="flex justify-center items-center w-full h-full">
                <Spinner />
              </div>
            ) : (

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[85%]'>Nome</TableHead>
                    <TableHead className='text-center'>Acessar</TableHead>
                    <TableHead className='text-center'>Editar</TableHead>
                  </TableRow>
                </TableHeader>

                {workspaces.map((workspace) => (
                  <TableBody>
                    <TableRow key={workspace._id}>
                      <TableCell onClick={() => handleSelectWorkspace(workspace)} className='cursor-pointer'><button onClick={() => handleSelectWorkspace(workspace)} className='capitalize'>{workspace.name}</button></TableCell>
                      <TableCell className='text-center' onClick={() => handleSelectWorkspace(workspace)}>
                        <button><FiExternalLink size={'18px'} /></button>
                      </TableCell>
                      <TableCell className='text-center'>
                        <button onClick={() => handleEditWorkSpace(workspace)} className='z-20'>
                          <FiMoreVertical />
                        </button>
                      </TableCell>
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
                <path d="M15 19L8 12L15 5" stroke={isDarkMode ? 'white' : 'black'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <a onClick={handleBreadCrumb} className="cursor-pointer hover:underline font-bo">Voltar</a>
            </div>

            {selectedWorkspace && (

              <>
                {metrics ? <WorkspaceStatsCard id={selectedWorkspace?._id} /> :
                  <section className='flex flex-col mb-10'>

                    <div className='flex items-center justify-between mb-16 flex-wrap gap-y-3'>
                      <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold capitalize">{selectedWorkspace.name}</h2>
                      <div className="flex gap-3">
                        {user?.role !== 'free' &&
                          <Button onClick={handleMetrics}>
                            <ChartLine /> metricas
                          </Button>
                        }
                        {/* <UTMEditor workspaceId={selectedWorkspace._id} userId={firebaseUser?.uid} /> */}
                        <a
                          href={qrCodeUrl ?? ""}
                          download={`${selectedWorkspace.name}-qrcode.png`}
                        >
                          <Button><QrCode /> Baixar QR Code</Button>
                        </a>
                      </div>
                    </div>
                    <form onSubmit={handleSubmit}>

                      <div className="flex flex-col gap-4 mb-4">
                        <div className='flex flex-col gap-2'>
                          <label htmlFor="">Número <span className='text-xs'>*</span></label>
                          <Input
                            type="text"
                            value={formatPhone(number)}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="Número do WhatsApp"
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
                        className="w-full h-10"
                      >
                        Adicionar número
                      </Button>
                    </form>
                    <div className="border p-4 rounded-xl mt-6">
                      <p className="font-semibold mb-2 text-zinc-700 dark:text-zinc-300">URL personalizada:</p>
                      <div className="flex items-center gap-4">
                        <a href={`${API_BASE_URL}/${selectedWorkspace.customUrl}`} className='w-full'>
                          <Input
                            ref={inputRef}
                            type="text"
                            readOnly
                            value={`${API_BASE_URL}/${selectedWorkspace.customUrl}`}
                            className='pointer-events-none'
                          />
                        </a>
                        <Button
                          onClick={handleCopy}
                          className={`flex gap-2 items-center ${isCopied && `bg-zinc-400`}`}
                        >
                          <ClipboardCopy /> {isCopied ? 'URL copiada' : 'Copiar URL'}
                        </Button>
                      </div>
                    </div>

                    <div className=' border p-4 rounded-xl mt-10'>
                      {isLoadingNumbers ? (
                        <div className="flex justify-center items-center w-full h-full">
                          <Spinner />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Número</TableHead>
                              <TableHead>Mensagem</TableHead>
                              <TableHead className='text-right'>Status</TableHead>
                              <TableHead className='text-right'>Deletar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {numbers.map((num) => (
                              <TableRow key={num._id}>
                                <TableCell className="font-medium">{formatPhone(num.number)}</TableCell>
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
                }

              </>
            )}

          </div>
        )}
      </main >
    </div>
  );
};

export default App;