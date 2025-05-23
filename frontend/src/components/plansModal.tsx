import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from 'lucide-react'

interface PlansModalProps {
  role: string;
}

const plans = [
  {
    title: 'Plano Básico',
    name: 'free',
    price: 'gratis',
    description: 'Ideal para iniciantes, com funcionalidades essenciais.',
    features: [
      { name: '1 link', included: true },
      { name: '2 números', included: true },
      { name: 'Url personalizavel', included: true },
      { name: 'Metricas de trafego', included: false },
      { name: 'Suporte personalizado', included: false },
    ],
  },
  {
    title: 'Plano Mensal',
    name: 'mensal',
    price: 'R$50.00',
    description: 'Para negócios em crescimento, com mais recursos.',
    features: [
      { name: 'Links ilimitados', included: true },
      { name: 'Sem limite de numeros', included: true },
      { name: 'Url personalizavel', included: true },
      { name: 'Metricas de trafego', included: true },
      { name: 'Personalização de UTMS', included: true },
    ],
    link: 'https://buy.stripe.com/eVa6qy07k9I76AM8wz'
  },
  {
    title: 'Plano Anual',
    name: 'anual',
    price: 'R$35.00',
    description: 'Completo e ilimitado para máxima flexibilidade.',
    features: [
      { name: 'Links ilimitados', included: true },
      { name: 'Sem limite de numeros', included: true },
      { name: 'Url personalizavel', included: true },
      { name: 'Metricas de trafego', included: true },
      { name: 'Suporte personalizado', included: true },
    ],
    link: 'https://buy.stripe.com/cN27uC9HUbQf9MYeUY'
  },
];

export default function PlansModal(props: PlansModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className='mb-2'>
        <Button className='w-full'>Veja os Planos</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className='text-2xl'>Escolha seu plano</DialogTitle>
          <DialogDescription>
            Selecione o plano que melhor se adapta às suas necessidades.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>
                  {plan.title}
                  {props.role === plan.name && (
                    <span className="ml-2 text-base text-green-500">(Plano Atual)</span>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-3xl font-bold">{plan.price}<span className="text-base font-normal">/mês</span></p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center">
                      {feature.included ? (
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <X className="mr-2 h-4 w-4 text-red-500" />
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground'}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>

                <Button className="w-full p-0" disabled={props.role === plan.name}>
                  <a href={plan.link} className='w-full py-2'>
                    {props.role === plan.name ? 'Plano Atual' : 'Assinar Agora'}
                  </a>
                </Button>

              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

