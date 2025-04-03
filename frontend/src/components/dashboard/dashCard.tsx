import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CalendarIcon, ChevronRight, Monitor, RefreshCcw, Smartphone, UserRoundCheck } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { API_BASE_URL } from '@/constants/urlApi'
import { Spinner } from '../Spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import ReactCountryFlag from "react-country-flag"
import { Workspace } from '@/types/workspace'
import { MonthlyAccessChart } from './monthlyAccessChart'
import { formaterDate } from '@/helper/formaterDate'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination'
import { addDays, format } from 'date-fns'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import { Calendar } from '../ui/calendar'
import { ptBR } from 'date-fns/locale';

const formatUtm = (utmKey: string, utmValue: string | null | undefined) => {
  if (!utmValue) return null;
  const utmName = utmKey.replace('utm_', '').charAt(0).toUpperCase() + utmKey.replace('utm_', '').slice(1);
  return `${utmName}: ${utmValue}`;
};

export default function WorkspaceStatsCard(id: any) {
  const [timeRange, setTimeRange] = useState({
    period: '7d',
    start: addDays(new Date(), -7),
    end: new Date()
  });
  const [data, setData] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7), // Data de início padrão: 7 dias atrás
    to: new Date(), // Data de fim padrão: hoje
  });

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

  const handleTimeRangeChange = (value: string) => {
    const end = new Date();
    let start = new Date();

    // Define a data de início com base no período selecionado
    switch (value) {
      case '1d':
        start = addDays(end, -1);
        break;
      case '7d':
        start = addDays(end, -7);
        break;
      case '30d':
        start = addDays(end, -30);
        break;
      case '90d':
        start = addDays(end, -90);
        break;
      case 'custom':
        // Se o período for custom, usa as datas selecionadas no DatePicker
        if (date?.from && date?.to) {
          start = date.from;
          end = date.to;
        }
        break;
    }

    // Atualiza o estado timeRange com o novo período e as datas de início e fim
    setTimeRange({ period: value, start, end });
  };

  // Processar dados filtrados
  const { totals, chartData, filteredAccessDetails } = useMemo(() => {
    if (!data) return { totals: null, chartData: [], filteredAccessDetails: [] };

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
      new Date(entry.timestamp) >= timeRange.start && new Date(entry.timestamp) <= timeRange.end
    );

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

    return { totals, chartData, filteredAccessDetails: filtered };
  }, [data, timeRange]);


  const handleDateChange = (newDate: DateRange | undefined) => {
    // Atualiza o estado date com o novo intervalo de datas
    setDate(newDate);
    // Se um intervalo de datas válido for selecionado, atualiza o timeRange para 'custom'
    if (newDate?.from && newDate?.to) {
      setTimeRange({ period: 'custom', start: newDate.from, end: newDate.to });
    }
  };

  function refreshPage() {
    window.location.reload();
  }

  // pagination config

  const itemsPerPage = 15;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAccessDetails
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(startIndex, endIndex);


  if (!data) return <div className="p-4">Carregando...</div>

  if (loading) return (
    <div className="flex justify-center items-center w-full h-[300px]">
      <Spinner />
    </div>
  )


  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-primary">Estatísticas de Acesso</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Select para escolher o intervalo de tempo */}
          <Select value={timeRange.period} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Renderiza o DatePicker apenas se o período selecionado for 'custom' */}
          <div className='flex gap-2'>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {/* Exibe o intervalo de datas selecionado no botão */}
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(date.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {/* Componente Calendar do shadcn/ui */}
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={refreshPage}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
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
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <UserRoundCheck className="h-4 w-4" />
              Visitantes Únicos
            </div>
            <div className="text-3xl font-bold">{totals?.unique?.toLocaleString('pt-BR') || 0}</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Monitor className="h-4 w-4" />
              Acessos Desktop
            </div>
            <div className="text-3xl font-bold">{totals?.desktop?.toLocaleString('pt-BR') || 0}</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              Acessos Mobile
            </div>
            <div className="text-3xl font-bold">{totals?.mobile?.toLocaleString('pt-BR') || 0}</div>
          </div>
        </Card>
      </div>

      <div className='flex gap-4 justify-between'>
        <MonthlyAccessChart filteredAccessDetails={data.accessDetails} />
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

        {/* <Card className="p-6">
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
        </Card> */}
      </div>

      <Card className="p-6 mt-8 min-h-[555px] flex flex-col justify-between">
        <div className='flex flex-col'>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-semibold">Histórico de Acessos</h2>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead >UTM</TableHead>
                <TableHead>Dispositivo</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentItems.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{formaterDate(log.timestamp)}</span>
                    </div>
                  </TableCell>

                  <TableCell>{log.ipAddress}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.country !== "Desconhecido" && log.country !== "Local" &&
                        <ReactCountryFlag
                          countryCode={log.country}
                          svg
                          style={{
                            width: '1.5em',
                          }}
                          title={log.country}
                        />
                      }
                      {log.country || 'Desconhecido'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {log.utmParameters && Object.entries(log.utmParameters).map(([key, value]) => {
                        const formattedUtm = formatUtm(key, value as string);
                        return formattedUtm && (
                          <span key={key} className="">{formattedUtm}</span>
                        );
                      })}
                    </div>
                  </TableCell>

                  <TableCell className='text-right'>
                    <div className="flex items-center gap-2">
                      {log.deviceType === 'desktop' ? (
                        <Monitor className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-green-500" />
                      )}
                      <span className="capitalize">{log.deviceType}</span>
                    </div>
                  </TableCell>


                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className='cursor-pointer'
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                Anterior
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>{currentPage}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredAccessDetails.length / itemsPerPage)))}
                className='cursor-pointer'
                disabled={currentPage === Math.ceil(filteredAccessDetails.length / itemsPerPage)}
                aria-label="Página posterior"
              >
                <ChevronRight className="h-4 w-4 ml-2" />
                Proxima
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Card>
    </div>
  )
}