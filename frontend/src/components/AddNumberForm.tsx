import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { addNumber } from '../services/api';
import { FirebaseUserType } from '../types';

interface AddNumberFormProps {
  firebaseUser: FirebaseUserType;
  onNumberAdded: () => void;
}

const AddNumberForm: React.FC<AddNumberFormProps> = ({ firebaseUser, onNumberAdded }) => {
  const [number, setNumber] = useState('');
  const [text, setText] = useState('');
  const { toast } = useToast();

  const validateWhatsAppNumber = (num: string) => {
    const regex = /^[1-9]\d{10}$/;
    return regex.test(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await addNumber(firebaseUser.uid, cleanNumber, text);
      setNumber('');
      setText('');
      onNumberAdded();
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

  return (
    <form onSubmit={handleSubmit} className="mb-8 max-w-[30%] w-full">
      <div className="flex flex-col gap-4 mb-4">
        <h2 className="text-2xl font-semibold mb-8 text-zinc-800">Números cadastrados:</h2>
        <Input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Número do WhatsApp (ex: 48991319311)"
          required
        />
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Texto (opcional)"
        />
      </div>
      <Button type="submit" className="w-full bg-zinc-800 text-white">
        Adicionar
      </Button>
    </form>
  );
};

export default AddNumberForm;