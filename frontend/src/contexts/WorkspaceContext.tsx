import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { Workspace, API_BASE_URL } from '../utils/types/types';
import { useToast } from '../hooks/use-toast';

interface WorkspaceContextType {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  fetchWorkspaces: () => Promise<void>;
  getWorkspace: (id: string) => Promise<Workspace>;
  createWorkspace: (name: string, customUrl: string) => Promise<void>;
  updateWorkspace: (workspace: Workspace) => Promise<void>;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const { firebaseUser } = useUser();
  const { toast } = useToast();

  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get<Workspace[]>(`${API_BASE_URL}/api/workspaces`, {
        headers: { 'Firebase-UID': firebaseUser?.uid }
      });
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Erro ao buscar workspaces:', error);
      toast({
        title: "Erro ao buscar workspaces",
        description: "Ocorreu um erro ao tentar buscar os workspaces.",
        variant: "destructive",
      });
    }
  };

  const getWorkspace = async (id: string): Promise<Workspace> => {
    try {
      const response = await axios.get<Workspace>(`${API_BASE_URL}/api/workspace/${id}`, {
        headers: { 'Firebase-UID': firebaseUser?.uid }
      });
      console.log(response.data)
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar workspace:', error);
      toast({
        title: "Erro ao buscar workspace",
        description: "Ocorreu um erro ao tentar buscar o workspace.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createWorkspace = async (name: string, customUrl: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/workspace`,
        { name, customUrl },
        { headers: { 'Firebase-UID': firebaseUser?.uid } }
      );
      await fetchWorkspaces();
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
  };

  const updateWorkspace = async (workspace: Workspace) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/workspace/${workspace._id}`,
        { name: workspace.name, customUrl: workspace.customUrl },
        { headers: { 'Firebase-UID': firebaseUser?.uid } }
      );
      await fetchWorkspaces();
      toast({
        title: "Workspace atualizado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao atualizar workspace:', error);
      toast({
        title: "Erro ao atualizar workspace",
        description: "Não foi possível atualizar o workspace. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      selectedWorkspace,
      getWorkspace,
      fetchWorkspaces,
      createWorkspace,
      updateWorkspace,
      setSelectedWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};