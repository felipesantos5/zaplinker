import React from 'react';
import { Button } from './ui/button';
import logo from '../assets/zapfy-logo-white.png';
import { FirebaseUserType } from '../types';

interface HeaderProps {
  firebaseUser: FirebaseUserType;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ firebaseUser, onSignOut }) => {
  return (
    <header className="bg-zinc-900 py-3">
      <div className='flex justify-between items-center max-w-6xl m-auto'>
        <div className='flex gap-4 items-center  text-white'>
          <img className='w-10' src={logo} alt="" />
          <h1 className="text-3xl font-bold">Zapfy</h1>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-white"> <span className=''>Bem-vindo,</span> {firebaseUser.displayName}</p>
          <Button onClick={onSignOut} className="bg-zinc-800 text-white">
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;