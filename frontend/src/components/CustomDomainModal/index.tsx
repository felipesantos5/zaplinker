import { useState } from "react"
import { Server, Globe, Clock, Settings, HelpCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function DomainConfigModal() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
        Configure seu domínio
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Configure seu domínio para Zaplinker</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Para usar o Zaplinker com o seu domínio, você precisa configurar o DNS do seu domínio para apontar para o
              nosso servidor. Siga os passos abaixo para fazer isso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Passo 1 */}
            <div className="rounded-lg border p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Server className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Passo 1: Acesse o painel de controle do seu provedor de DNS</h3>
                  <p className="text-muted-foreground">
                    Acesse o painel de controle do seu provedor de DNS (por exemplo, Hostinger) e navegue até a seção de
                    gerenciamento de DNS.
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="rounded-lg border p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Globe className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Passo 2: Crie um registro A</h3>
                  <p className="text-muted-foreground">Crie um registro A com o seguinte valor:</p>
                  <div className="bg-muted p-3 rounded-md space-y-2 font-mono text-base">
                    <p>
                      <span className="font-semibold">Nome:</span> @ ou o nome do seu domínio (por exemplo, exemplo.com)
                    </p>
                    <p>
                      <span className="font-semibold">Valor:</span> 69.62.99.140 (nosso IP)
                    </p>
                    <p>
                      <span className="font-semibold">TTL:</span> Deixe o valor padrão
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="rounded-lg border p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Passo 3: Verifique a propagação do DNS</h3>
                  <p className="text-muted-foreground">
                    Aguarde alguns minutos para que a propagação do DNS seja concluída. Você pode usar ferramentas como
                    o dig ou nslookup para verificar se o DNS foi atualizado corretamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="rounded-lg border p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Settings className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Passo 4: Configure o Zaplinker</h3>
                  <p className="text-muted-foreground">
                    Agora que o DNS foi configurado, você pode configurar o Zaplinker para usar o seu domínio. Acesse o
                    painel de controle do Zaplinker e navegue até a seção de configuração de domínio.
                  </p>
                </div>
              </div>
            </div>

            {/* Dicas e Ajuda */}
            <div className="rounded-lg border p-4 shadow-sm bg-slate-50">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <HelpCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Dicas e Ajuda</h3>
                  <p className="text-muted-foreground">
                    Se você tiver alguma dúvida ou precisar de ajuda, entre em contato conosco pelo suporte.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <div className="flex items-center text-base text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" />
              Configuração simples e rápida
            </div>
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
