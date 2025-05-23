import React, { useState } from 'react';
import { auth } from '@/config/firebase-config';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from "@/assets/zapfy-logo-white.png"
import { FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { formatPhone } from '@/helper/formaterPhone';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const Register = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const toggleShowPassword = () => {
    setShowPassword(prevState => !prevState);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(prevState => !prevState);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      console.log(fbUser, fbUser.uid)

      const response = await axios.post(`${API_BASE_URL}/api/user`, {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        phone: phone,
        displayName: name
      });

      navigate('/');
      return response.data;
    } catch (error: any) {
      if (error.message === "Firebase: Password should be at least 6 characters (auth/weak-password).") {
        setError('Senha fraca. Deve ter pelo menos 6 caracteres');
      } else {
        setError('Erro ao cadastrar. Por favor, tente novamente.');
      }
    }

    setIsLoading(false)
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black w-full">
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 mb-16">
        <img src={logo} alt='logo Zaplinker' width={'60'}></img>
        <h1 className='text-white font-semibold text-4xl'>Bem vindo a Zaplinker</h1>
        <form className='flex flex-col gap-4 w-full text-white' onSubmit={handleSignup}>
          <Input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Nome"
            className="p-2 border border-zinc-300 rounded w-full"
            required
          />
          <Input
            type="text"
            value={formatPhone(phone)}
            minLength={11}
            onChange={handlePhoneChange}
            placeholder="Celular"
            className="p-2 border border-zinc-300 rounded w-full"
            required
          />
          <Input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Email"
            className="p-2 border border-zinc-300 rounded w-full"
            required
          />
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Senha"
              className="p-2 border border-zinc-300 rounded w-full"
              required
            />
            <span
              onClick={toggleShowPassword}
              className="absolute top-[10px] right-[10px] "
              role="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirme a Senha"
              className="p-2 border border-zinc-300 rounded w-full"
              required
            />
            <span
              onClick={toggleShowConfirmPassword}
              className="absolute top-[10px] right-[10px] "
              role="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>
          <div className='flex flex-col'>
            <Button
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Cadastrar'}
            </Button>
            <Link to="/login" className='text-zinc-400 tracking-tight mt-2'>Já possui uma conta? <span className='font-semibold hover:underline text-zinc-100'>Entre</span></Link>
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Register;