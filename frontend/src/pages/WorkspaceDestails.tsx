import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNumber } from "@/contexts/NumberContext";
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/utils/types/types";
import axios from "axios";
import { useEffect } from "react";

export const WorkspaceDetails = () => {
  const { numbers, fetchNumbers } = useNumber();
  const { selectedWorkspace } = useWorkspace();
  const { firebaseUser } = useUser();

  useEffect(() => {
    fetchNumbers('67280461aabad9824a4a8332');
  }, []);

  const toggleNumberStatus = async (numberId: string, currentStatus: boolean) => {
    if (!firebaseUser) return;

    try {
      await axios.put(`${API_BASE_URL}/api/whatsapp/${numberId}/toggle`,
        { isActive: !currentStatus },
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchNumbers(firebaseUser.uid);
      toast({
        title: "Status do número alterado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao alterar status do número:', error);
    }
  };

  const deleteNumber = async (numberId: string) => {
    if (!firebaseUser) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/whatsapp/${numberId}`,
        { headers: { 'Firebase-UID': firebaseUser.uid } }
      );
      fetchNumbers(firebaseUser.uid);
      toast({
        title: "Número deletado com sucesso.",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao deletar número:', error);
    }
  };

  return (
    <div className='border border-gray-200 p-4 rounded-xl mt-16 w-[1000px]'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Número</TableHead>
            <TableHead>Texto</TableHead>
            <TableHead className='text-right'>Status</TableHead>
            <TableHead className='text-right'>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {numbers.map((num) => (
            <TableRow key={num._id}>
              <TableCell className="font-medium">{num.number}</TableCell>
              <TableCell>{num.text || 'Sem texto'}</TableCell>
              <TableCell className='text-right'>
                <Switch
                  checked={num.isActive}
                  onCheckedChange={() => toggleNumberStatus(num._id, num.isActive)}
                />
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  onClick={() => deleteNumber(num._id)}
                >
                  Deletar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 