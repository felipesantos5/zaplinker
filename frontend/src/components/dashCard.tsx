import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Globe, Monitor, RefreshCw, Smartphone } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { API_BASE_URL } from '@/constants/urlApi'
import { Spinner } from './Spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import ReactCountryFlag from "react-country-flag"
import { Workspace } from '@/types/workspace'

// interface WorkspaceStats {
//   _id: string
//   accessCount: number
//   desktopAccessCount: number
//   mobileAccessCount: number
//   accessDetails: Array<{
//     timestamp: string
//     deviceType: 'desktop' | 'mobile'
//     visitorId: string
//   }>
//   visitors: Visitor[];
// }

export default function WorkspaceStatsCard(id: any) {
  const [timeRange, setTimeRange] = useState('7d')
  const [data, setData] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/workspaces/${id.id}/stats`)
      setData(response.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  // Processar dados filtrados
  const { totals, chartData } = useMemo(() => {
    if (!data) return { filteredData: [], totals: null, chartData: [] }

    // Calcular intervalo de datas
    const daysMap: { [key: string]: number } = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    }

    const days = daysMap[timeRange] || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Filtrar dados
    const filtered = data.accessDetails.filter(entry =>
      new Date(entry.timestamp) >= startDate
    )

    // Calcular totais
    const totals = {
      total: filtered.length,
      desktop: filtered.filter(d => d.deviceType === 'desktop').length,
      mobile: filtered.filter(d => d.deviceType === 'mobile').length,
      unique: new Set(filtered.map(d => d.visitorId)).size
    }

    // Preparar dados para gráficos
    const dailyData: { [key: string]: any } = {}

    filtered.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString('pt-BR')
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          total: 0,
          desktop: 0,
          mobile: 0
        }
      }

      dailyData[date].total++
      if (entry.deviceType === 'desktop') dailyData[date].desktop++
      else dailyData[date].mobile++
    })

    const chartData = Object.values(dailyData).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return { filteredData: filtered, totals, chartData }
  }, [data, timeRange])

  if (!data) return <div className="p-4">Carregando...</div>

  if (loading) return (
    <div className="flex justify-center items-center w-full h-full">
      <Spinner />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-primary">Estatísticas de Acesso</h1>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Acessos Totais
            </div>
            <div className="text-3xl font-bold">{totals?.total?.toLocaleString('pt-BR') || 0}</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Visitantes Únicos</div>
            <div className="text-3xl font-bold text-emerald-600">{totals?.unique?.toLocaleString('pt-BR') || 0}</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Acessos Desktop</div>
            <div className="text-3xl font-bold text-blue-600">{totals?.desktop?.toLocaleString('pt-BR') || 0}</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Acessos Mobile</div>
            <div className="text-3xl font-bold text-orange-600">{totals?.mobile?.toLocaleString('pt-BR') || 0}</div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="space-y-8">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Acessos ao Longo do Tempo</h2>
            <p className="text-sm text-muted-foreground">Visão geral dos acessos diários</p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Distribuição por Dispositivo</h2>
            <p className="text-sm text-muted-foreground">Comparação entre desktop e mobile</p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Bar
                  dataKey="desktop"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="mobile"
                  fill="hsl(var(--destructive))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Histórico de Acessos</h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead className="text-right">Visitante</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.accessDetails
              .sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )
              .map((log, index) => {
                const logDate = new Date(log.timestamp)
                const formattedDate = logDate.toLocaleDateString('pt-BR')
                const formattedTime = logDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{formattedDate}</span>
                        <span className="text-sm text-muted-foreground">{formattedTime}</span>
                      </div>
                    </TableCell>

                    <TableCell>{log.ipAddress}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* <MapPin className="h-4 w-4 text-muted-foreground" /> */}
                        {/* {log.country  & */}
                        <ReactCountryFlag
                          countryCode={log.country}
                          svg
                          style={{
                            width: '1.5em',
                            height: '1.5em',
                            borderRadius: '3px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}
                          title={log.country}
                        />
                        {/* } */}
                        {log.country || 'Desconhecido'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.deviceType === 'desktop' ? (
                          <Monitor className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-green-500" />
                        )}
                        <span className="capitalize">{log.deviceType}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono text-sm">
                      <span className="text-muted-foreground">
                        {log.visitorId.slice(0, 6)}...{log.visitorId.slice(-4)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}