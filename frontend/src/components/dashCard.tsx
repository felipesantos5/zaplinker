import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Computer, Globe, Smartphone } from 'lucide-react';

interface WorkspaceStats {
  _id: string;
  customUrl: string;
  accessCount: number;
  desktopAccessCount: number
  mobileAccessCount: number
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
            <p className='flex gap-2 items-center'><Smartphone size={22} />Mobile</p>
            <span className='font-bold text-2xl'>{stats.mobileAccessCount}</span>
          </Card>
          <Card className='sm:w-1/3 h-28 p-4 flex flex-col justify-between'>
            <p className='flex gap-2 items-center'><Computer size={22} /> Desktop</p>
            <span className='font-bold text-2xl'>{stats.desktopAccessCount}</span>
          </Card>
        </div>
      )}
    </>
  );
};

export default WorkspaceStatsCard;