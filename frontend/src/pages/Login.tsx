
import { useAuth } from '../hooks/auth'; // ajuste o caminho conforme necessário
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import logo from "@/assets/zapfy-logo-white.png"


import { RiGoogleFill } from "react-icons/ri";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from 'react-router-dom';

export const Login = () => {
  const {
    email,
    password,
    showPassword,
    errorLogin,
    setEmail,
    setPassword,
    signInWithGoogle,
    handleSignInWithEmail,
    toggleShowPassword,
  } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black w-full">
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 mb-16">
        <img src={logo} alt='logo Zaplinker' width={'60'}></img>
        <h1 className='text-white font-semibold text-4xl'>Bem vindo a Zaplinker</h1>
        <Button
          onClick={signInWithGoogle}
          className="mb-4 w-full"
        >
          Continue com o Google <RiGoogleFill />
        </Button>
        <hr className='border-white/50 border-t w-full'></hr>
        <div className='flex flex-col gap-4 w-full'>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="p-2 border border-zinc-300 rounded w-full text-zinc-50"
          />
          <div className='relative'>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="p-2 border border-zinc-300 rounded w-full text-zinc-50"
            />
            <span
              onClick={toggleShowPassword}
              className="absolute top-[10px] right-[10px] text-white"
              role="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>
          <div className='flex flex-col'>
            <Button
              onClick={handleSignInWithEmail}
              className=""
            >
              Entrar
            </Button>
            <Link to="/registrar" className='text-zinc-400 tracking-tight mt-2'>Não possui conta? <span className='font-semibold hover:underline text-zinc-100'>Registre-se</span></Link>
          </div>
          {errorLogin && <p className="text-red-500">{errorLogin}</p>}
        </div>
      </div>
    </div>
  );
}