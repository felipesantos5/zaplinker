import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/auth'; // ajuste o caminho conforme necessário
import { Spinner } from '@/components/Spinner';

interface PrivateRouteProps {
  children: React.ReactNode;
  path: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, path }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-[300px]">
        <Spinner />
      </div>)
  }


  if (!user) {
    // Se o usuário não estiver autenticado, redireciona para a página de login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário estiver autenticado, renderiza o componente filho
  return <Routes>
    <Route path={path} element={children} />
  </Routes>;
};

export default PrivateRoute;