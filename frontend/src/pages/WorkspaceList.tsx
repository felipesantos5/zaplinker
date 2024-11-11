import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
// import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog';
import { FiMoreVertical } from "react-icons/fi";
import { useUser } from '@/contexts/UserContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { CreateWorkspaceDialog } from '@/components/CreateWorkspaceDialog';
// import { Workspace } from '@/utils/types/types';

const WorkspaceList = () => {
  const { firebaseUser } = useUser();
  const { workspaces, fetchWorkspaces } = useWorkspace();
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  return (
    <section>
      <p className="text-black text-sm mb-2">
        <span className=''>Bem-vindo, </span>{firebaseUser?.displayName}
      </p>
      <div className='flex justify-between mb-8'>
        <h2 className="text-5xl font-bold text-zinc-800">Workspaces</h2>
        <Button onClick={() => setCreateWorkspaceOpen(true)}>Criar workspace</Button>
      </div>
      <Table className='mt-10'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[600px]'>Nome</TableHead>
            <TableHead className='text-center translate-x-6'>Entrar</TableHead>
            <TableHead className='text-right'>Editar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((workspace) => (
            <TableRow key={workspace._id}>
              <TableCell>{workspace.name}</TableCell>
              <TableCell className='text-center'>
                <Link to={`/workspace/${workspace._id}`}>
                  <Button>Acessar</Button>
                </Link>
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
      <CreateWorkspaceDialog
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
      />


    </section>
  );
};

export default WorkspaceList;