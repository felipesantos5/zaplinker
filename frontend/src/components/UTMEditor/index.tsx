import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/constants/urlApi';
import { LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type UTMFields = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

type Props = {
  workspaceId: string;
  userId: any;
};

export const UTMEditor = ({ workspaceId, userId }: Props) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<UTMFields>({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/stats`, {
          method: 'GET',
          headers: { 'Firebase-UID': userId },
        });

        const data = await response.json();

        setFormData({
          utm_source: data.utmParameters.utm_source || '',
          utm_medium: data.utmParameters.utm_medium || '',
          utm_campaign: data.utmParameters.utm_campaign || '',
          utm_term: data.utmParameters.utm_term || '',
          utm_content: data.utmParameters.utm_content || ''
        });
      } catch (error) {
        console.error('Error loading UTM params:', error);
      } finally {
        setIsLoading(false);
      }
    };

    open && loadData();
  }, [open, workspaceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/workspace/${workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Firebase-UID': userId },
        body: JSON.stringify({ utmParameters: formData }),
      });

      if (!response.ok) throw new Error('Failed to save UTM parameters');
      toast({
        title: "UTM editada com sucesso.",

      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Falha ao editar a UTM.",
        variant: "destructive",
      });
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LocateFixed /> UTM
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[650px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configurações de UTM</DialogTitle>
            <DialogDescription>
              Aqui você pode adicionar as UTM necessárias para meu trackeamento digital. (todos os campos são opcionais).
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="text-base font-medium">
                  {key.replace('_', ' ').toUpperCase()}
                </Label>
                <Input
                  name={key}
                  value={value}
                  onChange={handleInputChange}
                  placeholder={`Enter ${key.replace('_', ' ')}`}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Savando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};