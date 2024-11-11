import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Workspace } from '@/utils/types/types';

const WorkspaceEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWorkspace, updateWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (id) {
        try {
          console.log(id)
          const data = await getWorkspace(id);
          setWorkspace(data);
        } catch (error) {
          console.error('Erro ao buscar workspace:', error);
          // Você pode adicionar um toast aqui para notificar o usuário sobre o erro
        }
      }
    };
    fetchWorkspace();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workspace) {
      try {
        await updateWorkspace(workspace);
        navigate('/');
      } catch (error) {
        console.error('Erro ao atualizar workspace:', error);
        // Você pode adicionar um toast aqui para notificar o usuário sobre o erro
      }
    }
  };

  if (!workspace) return <div>Carregando...</div>;

  return (
    <section className="p-12 w-[1600px]">
      <h2 className='text-[28px] mb-10'>Editar Workspace</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className='flex flex-col gap-2'>
          <label htmlFor="name">Nome do workspace</label>
          <Input
            id="name"
            type="text"
            value={workspace.name}
            onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
            placeholder="Nome do workspace"
          />
        </div>
        <div className='flex flex-col gap-2'>
          <label htmlFor="customUrl">URL personalizada</label>
          <Input
            id="customUrl"
            type="text"
            value={workspace.customUrl}
            onChange={(e) => setWorkspace({ ...workspace, customUrl: e.target.value })}
            placeholder="URL personalizada"
          />
        </div>
        <div className='flex gap-4 justify-between items-center mt-8'>
          <Button type="submit" className='w-[50%] h-10'>Atualizar</Button>
          <Button onClick={() => navigate('/')} className='w-[50%]' variant='outline'>Voltar</Button>
        </div>
      </form>
    </section>
  );
};

export default WorkspaceEdit;