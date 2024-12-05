import axios from 'axios';
import React, { useEffect, useState } from 'react';
// import { io } from 'socket.io-client';
import { Card } from './card';
import { Computer, Globe, Smartphone } from 'lucide-react';

interface DeviceStats {
  desktop: number;
  mobile: number;
}

interface WorkspaceStats {
  _id: string;
  customUrl: string;
  accessCount: number;
  deviceStats: DeviceStats;
}

interface WorkspaceStatsCardProps {
  id: string;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const WorkspaceStatsCard: React.FC<WorkspaceStatsCardProps> = ({ id }) => {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // const socket = io("http://localhost:5000"); // Conectar ao servidor de WebSocket

    // // Escutar eventos de atualização
    // socket.on("connect", () => {
    //   console.log("Conectado ao servidor de WebSocket");
    // });

    // socket.on("message", (data) => {
    //   console.log("Mensagem do servidor:", data);
    // });

    // socket.on("disconnect", () => {
    //   console.log("Desconectado do servidor de WebSocket");
    // });

    const loadStats = async () => {
      try {
        console.log(`Carregando estatísticas para o ID: ${id}`);
        const data = await fetchWorkspaceStats(id);
        setStats(data);
        console.log(data);
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setError('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
        console.log('Dados carregados:', stats);
      }
    };

    loadStats();

    // Limpeza na desmontagem do componente
    // return () => {
    //   socket.disconnect();
    // };
  }, [id]);

  const fetchWorkspaceStats = async (id: string): Promise<WorkspaceStats> => {
    try {
      const response = await axios.get<WorkspaceStats>(`${API_BASE_URL}/api/workspaces/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do workspace:', error);
      throw error;
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      {stats && (
        <div className='flex flex-col sm:flex-row gap-8'>
          <Card className='sm:w-1/3 h-28 p-4 flex flex-col justify-between'>
            <p className='flex gap-2 items-center'><Globe size={22} /> Total de Acessos</p>
            <span className='font-bold text-2xl'>{stats.accessCount}</span>
          </Card>
          <Card className='sm:w-1/3 h-28 p-4 flex flex-col justify-between'>
            <p className='flex gap-2 items-center'><Computer size={22} /> Desktop</p>
            <span>em breve...</span>
            {/* {stats.deviceStats.desktop} */}
          </Card>
          <Card className='sm:w-1/3 h-28 p-4 flex flex-col justify-between'>
            <p className='flex gap-2 items-center'><Smartphone size={22} />Mobile</p>
            <span>em breve...</span>
            {/* {stats.deviceStats.mobile} */}
          </Card>
        </div>
      )}
    </>
  );
};

export default WorkspaceStatsCard;