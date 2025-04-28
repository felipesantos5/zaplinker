import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const getMonthName = (monthNumber: number) => {
  const date = new Date()
  date.setMonth(monthNumber)
  return date.toLocaleString('pt-BR', { month: 'long' })
}

export function MonthlyAccessChart({ filteredAccessDetails }: any) {
  const chartData = useMemo(() => {
    const monthlyData: Record<number, number> = {}

    filteredAccessDetails.forEach(({ timestamp }: any) => {
      const date = new Date(timestamp)
      const month = date.getMonth()
      monthlyData[month] = (monthlyData[month] || 0) + 1
    })

    // Garante que todos os meses estejam representados, mesmo que não haja acessos
    const allMonthsData = Array.from({ length: 12 }).map((_, index) => ({
      month: getMonthName(index),
      accesses: monthlyData[index] || 0
    }))

    return allMonthsData
  }, [filteredAccessDetails])

  // Calcula o total de acessos para exibir no CardFooter
  const totalAccesses = useMemo(() => {
    return chartData.reduce((sum, data) => sum + data.accesses, 0)
  }, [chartData])

  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">Acessos Mensais</CardTitle>

          <p className="text-muted-foreground pr-[30px]">Total de acessos: <span className="font-medium">{totalAccesses}</span></p>
        </div>
        <CardDescription className="text-muted-foreground flex justify-between">
          Distribuição de acessos em {new Date().getFullYear()}

        </CardDescription>

      </CardHeader>

      <CardContent className="p-0">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--foreground))' }}
            />

            <Bar
              dataKey="accesses"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="accesses"
                position="center"
                fill="hsl(var(--primary-foreground))"
                fontSize={12}
                fontWeight="500"
                formatter={(value: number) => value > 0 ? value : ''}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}