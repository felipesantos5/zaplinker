import React, { useState } from 'react';
import { auth } from '@/config/firebase-config';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from "@/assets/zapfy-logo-white.png"
import { FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiGoogleFill } from 'react-icons/ri';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const RegisterCheckOut = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const planType = params.get('plan');

  const toggleShowPassword = () => {
    setShowPassword(prevState => !prevState);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(prevState => !prevState);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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

  const handleCheckoutRedirect = (e: any) => {
    e.preventDefault();

    const baseUrl = "https://buy.stripe.com/";
    let targetUrl;

    if (planType === 'mensal') {
      targetUrl = `${baseUrl}eVa6qy07k9I76AM8wz`;
    } else if (planType === 'anual') {
      targetUrl = `${baseUrl}cN27uC9HUbQf9MYeUY`;
    } else {
      return;
    }

    window.location.href = targetUrl;
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

      const response = await axios.post<User>(`${API_BASE_URL}/api/user`, {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        displayName: name
      });
      if (planType === 'mensal') {
        window.location.href = ('https://buy.stripe.com/eVa6qy07k9I76AM8wz');
      } else if (planType === 'anual') {
        window.location.href = ('https://buy.stripe.com/cN27uC9HUbQf9MYeUY');
      } else {
        navigate('/');
      }
      return response.data;
    } catch (error) {
      setError('Erro ao cadastrar. Por favor, tente novamente.');
    }
    setIsLoading(false)
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);

      if (planType === 'mensal') {
        window.location.href = ('https://buy.stripe.com/eVa6qy07k9I76AM8wz');
      } else if (planType === 'anual') {
        window.location.href = ('https://buy.stripe.com/cN27uC9HUbQf9MYeUY');
      } else {
        navigate('/');
      }
    } catch (error) {
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black w-full">
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 mb-16">
        <img src={logo} alt='logo Zaplinker' width={'60'}></img>
        <div className='flex flex-col gap-2'>
          <h1 className='text-white font-semibold text-4xl'>Bem vindo a Zaplinker</h1>
          <p className='text-white/80 text-center'>cadastre-se para assinar seu plano</p>
        </div>
        <Button
          onClick={signInWithGoogle}
          className="mb-4 w-full"
        >
          Continue com o Google <RiGoogleFill />
        </Button>

        <div className="flex items-center w-full">
          <div className="flex-grow border-t border-zinc-800 w-full"></div>
          <span className="mx-4 text-zinc-500">OU</span>
          <div className="flex-grow border-t border-zinc-800 w-full"></div>
        </div>

        <form className='flex flex-col gap-4 w-full text-white' onSubmit={handleSignup}>
          <Input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Nome"
            className="p-2 border border-zinc-300 rounded w-full"
          />
          <Input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Email"
            className="p-2 border border-zinc-300 rounded w-full"
          />
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Senha"
              className="p-2 border border-zinc-300 rounded w-full"
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
              type='submit'
            >
              {isLoading ? 'Entrando...' : 'Cadastrar'}
            </Button>
            <button onClick={handleCheckoutRedirect} className='text-zinc-400 tracking-tight mt-2'>Já possui uma conta? <span className='font-semibold hover:underline text-zinc-100'>Continue sua assinatura</span></button>
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default RegisterCheckOut;