import { useState, useEffect } from 'react';
import axios from 'axios';

import { Users, Smartphone, Laptop } from 'lucide-react';
import { API_BASE_URL } from '@/constants/urlApi';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

// Definir tipos
type TimeRange = '7d' | '30days' | '3months';

interface Access {
  timestamp: string;
  deviceType: 'mobile' | 'desktop';
  ipAddress: string;
}

interface WorkspaceStats {
  totalAccesses: number;
  uniqueVisitors: number;
  mobileAccesses: number;
  desktopAccesses: number;
}

interface WorkspaceData {
  _id: string;
  customUrl: string;
  accesses: Access[];
  stats: WorkspaceStats;
}


export const Dashboard = ({ id }: any) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [allData, setAllData] = useState<WorkspaceData | null>(null);
  const [filteredData, setFilteredData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (allData && allData.accesses) {
      setFilteredData(filterDataByTimeRange(allData, timeRange));
    }
  }, [allData, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<WorkspaceData>(`${API_BASE_URL}/api/workspaces/${id}/stats`);
      if (response.data) {
        setAllData(response.data);
        setError(null);
      } else {
        throw new Error('Invalid data structure received from API');
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filterDataByTimeRange = (data: WorkspaceData, range: TimeRange): WorkspaceData => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '3months':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        startDate = new Date(0); // From the beginning of time
    }

    const filteredAccesses = data.accesses.filter(access => new Date(access.timestamp) >= startDate);

    return {
      ...data,
      accesses: filteredAccesses,
      stats: {
        totalAccesses: filteredAccesses.length,
        uniqueVisitors: new Set(filteredAccesses.map(access => access.ipAddress)).size,
        mobileAccesses: filteredAccesses.filter(access => access.deviceType === 'mobile').length,
        desktopAccesses: filteredAccesses.filter(access => access.deviceType === 'desktop').length,
      }
    };
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!filteredData) return null;

  const { stats } = filteredData;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-semibold">Link Analytics</h1>
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          <Tabs defaultValue="7d" value={timeRange} onValueChange={(value: any) => setTimeRange(value as TimeRange)} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
                <TabsTrigger value="3months">3 Months</TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</div>
            </div>

            <TabsContent value={timeRange} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAccesses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">All link redirections</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Unique visitors</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mobile Accesses</CardTitle>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.mobileAccesses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((stats.mobileAccesses / stats.totalAccesses) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Desktop Accesses</CardTitle>
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.desktopAccesses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((stats.desktopAccesses / stats.totalAccesses) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Mobile vs Desktop accesses</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Adicione aqui o conteúdo do gráfico de dispositivos */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};


const filterDataByTimeRange = (data: WorkspaceData, range: TimeRange): WorkspaceData => {
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case '7d':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30days':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case '3months':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    default:
      startDate = new Date(0); // From the beginning of time
  }

  const filteredAccesses = data.accesses?.filter(access => new Date(access.timestamp) >= startDate) || [];

  return {
    ...data,
    accesses: filteredAccesses,
    stats: {
      totalAccesses: filteredAccesses.length,
      uniqueVisitors: new Set(filteredAccesses.map(access => access.ipAddress)).size,
      mobileAccesses: filteredAccesses.filter(access => access.deviceType === 'mobile').length,
      desktopAccesses: filteredAccesses.filter(access => access.deviceType === 'desktop').length,
    }
  };
};