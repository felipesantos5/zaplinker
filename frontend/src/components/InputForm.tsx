import React, { useState } from 'react';

interface InputFormProps {
  onSubmit: (phoneNumber: string, message: string) => void;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      onSubmit(phoneNumber, message);
      setPhoneNumber('');
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          Número de WhatsApp
        </label>
        <input
          type="text"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Ex: +5511999999999"
          required
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Mensagem (opcional)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Digite sua mensagem aqui"
          rows={3}
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Adicionar Número
      </button>
    </form>
  );
};

export default InputForm;