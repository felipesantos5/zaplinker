import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { toggleNumberStatus, deleteNumber } from '../services/api';
import { WhatsappNumber, FirebaseUserType } from '../types';

interface NumberListProps {
  numbers: WhatsappNumber[];
  firebaseUser: FirebaseUserType;
  onNumbersChange: () => void;
}

const NumberList: React.FC<NumberListProps> = ({ numbers, firebaseUser, onNumbersChange }) => {
  const { toast } = useToast();

  const handleToggleStatus = async (numberId: string, currentStatus: boolean) => {
    try {
      await toggleNumberStatus(firebaseUser.uid, numberId, currentStatus);
      onNumbersChange();
      toast({
        title: "Status do número alterado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao alterar status do número:', error);
    }
  };

  const handleDelete = async (numberId: string) => {
    try {
      await deleteNumber(firebaseUser.uid, numberId);
      onNumbersChange();
      toast({
        title: "Número deletado com sucesso.",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao deletar número:', error);
    }
  };

  return (
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
                  onCheckedChange={() => handleToggleStatus(num._id, num.isActive)}
                />
              </TableCell>
              <TableCell className='text-right'>
                <Button onClick={() => handleDelete(num._id)}>
                  Deletar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NumberList;