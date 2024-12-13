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
import { link } from 'fs'

interface PlansModalProps {
  role: string;
}

const plans = [
  {
    title: 'Plano Básico',
    name: 'free',
    price: 'R$0',
    description: 'Ideal para iniciantes, com funcionalidades essenciais.',
    features: [
      { name: '1 link', included: true },
      { name: '2 números', included: true },
      { name: 'Url personalizavel', included: false },
      { name: 'Metricas de trafego', included: false },
      { name: 'Personalização de UTMS', included: false },
    ],
  },
  {
    title: 'Plano Pro',
    name: 'pro',
    price: 'R$30.00',
    description: 'Para negócios em crescimento, com mais recursos.',
    features: [
      { name: '5 links', included: true },
      { name: '10 números', included: true },
      { name: 'Url personalizavel', included: true },
      { name: 'Metricas de trafego', included: true },
      { name: 'Personalização de UTMS', included: false },
    ],
    link: 'https://buy.stripe.com/bIY9CKbQ207x7EQ288'
  },
  {
    title: 'Plano Premium',
    name: 'premium',
    price: 'R$130.00',
    description: 'Completo e ilimitado para máxima flexibilidade.',
    features: [
      { name: 'Links ilimitados', included: true },
      { name: 'Sem limite de numeros', included: true },
      { name: 'Url personalizavel', included: true },
      { name: 'Metricas de trafego', included: true },
      { name: 'Personalização de UTMS', included: true },
    ],
    link: 'https://buy.stripe.com/eVa4iqbQ27zZ7EQaEF'
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
                    <span className="ml-2 text-sm text-green-500">(Plano Atual)</span>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal">/mês</span></p>
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

