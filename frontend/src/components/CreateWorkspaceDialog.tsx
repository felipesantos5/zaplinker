// src/components/CreateWorkspaceDialog.tsx

import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({ isOpen, onClose }) => {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceUrl, setNewWorkspaceUrl] = useState('');
  const { createWorkspace } = useWorkspace();
  const { toast } = useToast();

  const validateCustomUrl = (url: string) => {
    const urlRegex = /^[a-zA-Z0-9_-]+$/;
    return urlRegex.test(url);
  };

  const handleCreateWorkspace = async () => {
    if (!validateCustomUrl(newWorkspaceUrl)) {
      toast({
        title: "URL inválida",
        description: "Use apenas letras, números, underscores e hífens.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createWorkspace(newWorkspaceName, newWorkspaceUrl);
      setNewWorkspaceName('');
      setNewWorkspaceUrl('');
      onClose();
    } catch (error) {
      console.error('Erro ao criar workspace:', error);
      toast({
        title: "Erro ao criar workspace",
        description: "Não foi possível criar o workspace. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
  );
};