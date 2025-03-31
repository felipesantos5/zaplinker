import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CalendarIcon, DownloadIcon, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { API_BASE_URL } from '@/constants/urlApi'

interface Visitor {
  visitorId: string;
  ip: string;
  userAgent: string;
  visitCount: number;
}

interface WorkspaceStats {
  _id: string
  accessCount: number
  desktopAccessCount: number
  mobileAccessCount: number
  accessDetails: Array<{
    timestamp: string
    deviceType: 'desktop' | 'mobile'
    visitorId: string
  }>
  visitors: Visitor[];
}

export default function WorkspaceStatsCard(id: any) {
  const [timeRange, setTimeRange] = useState('7d')
  const [data, setData] = useState<WorkspaceStats | null>(null)
  const [loading, setLoading] = useState(true)

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
  const { filteredData, totals, chartData } = useMemo(() => {
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
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
    </div>
  )
}