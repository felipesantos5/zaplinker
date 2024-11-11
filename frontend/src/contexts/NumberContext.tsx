import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { WhatsappNumber, API_BASE_URL } from '../utils/types/types';
import { useToast } from '../hooks/use-toast';

interface NumberContextType {
  numbers: WhatsappNumber[];
  fetchNumbers: (workspaceId: string) => Promise<void>;
  addNumber: (workspaceId: string, number: string, text: string) => Promise<void>;
  toggleNumberStatus: (numberId: string, currentStatus: boolean) => Promise<void>;
  deleteNumber: (numberId: string) => Promise<void>;
}

const NumberContext = createContext<NumberContextType | undefined>(undefined);

export const NumberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [numbers, setNumbers] = useState<WhatsappNumber[]>([]);
  const { firebaseUser } = useUser();
  const { toast } = useToast();

  const fetchNumbers = async (workspaceId: string) => {
    try {
      const response = await axios.get<WhatsappNumber[]>(`${API_BASE_URL}/api/whatsapp/${workspaceId}`, {
        headers: { 'Firebase-UID': firebaseUser?.uid }
      });
      setNumbers(response.data);
    } catch (error) {
      console.error('Erro ao buscar números:', error);
      toast({
        title: "Erro ao buscar números",
        description: "Ocorreu um erro ao tentar buscar os números.",
        variant: "destructive",
      });
    }
  };

  const addNumber = async (workspaceId: string, number: string, text: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/whatsapp`,
        { workspaceId, number, text },
        { headers: { 'Firebase-UID': firebaseUser?.uid } }
      );
      await fetchNumbers(workspaceId);
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
    try {
      await axios.put(`${API_BASE_URL}/api/whatsapp/${numberId}/toggle`,
        { isActive: !currentStatus },
        { headers: { 'Firebase-UID': firebaseUser?.uid } }
      );
      setNumbers(numbers.map(num =>
        num._id === numberId ? { ...num, isActive: !currentStatus } : num
      ));
      toast({
        title: "Status do número alterado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao alterar status do número:', error);
      toast({
        title: "Erro ao alterar status do número",
        description: "Ocorreu um erro ao tentar alterar o status do número.",
        variant: "destructive",
      });
    }
  };

  const deleteNumber = async (numberId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/whatsapp/${numberId}`,
        { headers: { 'Firebase-UID': firebaseUser?.uid } }
      );
      setNumbers(numbers.filter(num => num._id !== numberId));
      toast({
        title: "Número deletado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao deletar número:', error);
      toast({
        title: "Erro ao deletar número",
        description: "Ocorreu um erro ao tentar deletar o número.",
        variant: "destructive",
      });
    }
  };

  return (
    <NumberContext.Provider value={{ numbers, fetchNumbers, addNumber, toggleNumberStatus, deleteNumber }}>
      {children}
    </NumberContext.Provider>
  );
};

export const useNumber = () => {
  const context = useContext(NumberContext);
  if (context === undefined) {
    throw new Error('useNumber must be used within a NumberProvider');
  }
  return context;
};