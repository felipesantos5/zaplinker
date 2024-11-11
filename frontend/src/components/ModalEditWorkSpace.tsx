import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"

export const ModalEditWorkSpace = () => {
  const { handleUpdateWorkspace } = useWorkspace();

  return (
    <Dialog open={isConfiguringWorkspace} onOpenChange={setIsConfiguringWorkspace}>
      <DialogContent className='p-12 w-[1600px]'>
        <DialogHeader>
          <DialogTitle className='text-[28px] mb-10'>Editar Workspace</DialogTitle>
          <DialogDescription>
            <section className="">
              <div className="flex flex-col gap-2 mb-4">
                <div className='mb-2 flex flex-col gap-2'>
                  <label htmlFor="">Nome do workspace</label>
                  <Input
                    type="text"
                    // value={selectedWorkspace.name}
                    // onChange={(e) => setSelectedWorkspace({ ...selectedWorkspace, name: e.target.value })}
                    placeholder="Nome do workspace"
                  />
                </div>
                <div className='mb-8 flex flex-col gap-2'>
                  <label htmlFor="">Url personalizada</label>
                  <Input
                    type="text"
                    // value={selectedWorkspace.customUrl}
                    // onChange={(e) => setSelectedWorkspace({ ...selectedWorkspace, customUrl: e.target.value })}
                    placeholder="URL personalizada"
                  />
                </div>


              </div>
            </section>
            <div className='flex gap-4 justify-between items-center'>
              <Button onClick={handleUpdateWorkspace} className='w-[50%] h-10' >Atualizar</Button>
              <Button onClick={handleUpdateWorkspace} className='w-[50%]' variant='outline'  >Sair</Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}