"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserControlHeader } from "./UserControlHeader"
import { UserTable } from "./UserTable"
import { UserWizardDrawer } from "./UserWizardDrawer"
import { PermissionPopup } from "./PermissionPopup"
import { RoleManagerTab } from "./RoleManagerTab"
import { 
  createUserAction, 
  updateUserGeneralAction, 
  setUserStatusAction,
  duplicateRoleAction,
  toggleRoleStatusAction,
  updateRolePermissionsAction,
  setUserPermissionOverrideAction
} from "@/app/(admin)/configuracoes/actions"
import { Users, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface UserManagementClientProps {
  initialData: {
    users: any[]
    roles: any[]
    permissions: any[]
    employees: any[]
  }
}

export function UserManagementClient({ initialData }: UserManagementClientProps) {
  const [activeTab, setActiveTab ] = useState("usuarios")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  // User Modal State
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Permission Popup State
  const [isPermissionPopupOpen, setIsPermissionPopupOpen] = useState(false)
  const [permissionTarget, setPermissionTarget] = useState<{ type: 'user' | 'role', id: string, name: string } | null>(null)

  const stats = {
    total: initialData.users.length,
    active: initialData.users.filter(u => u.status === "ACTIVE").length,
    pending: initialData.users.filter(u => u.status === "PENDING_ACTIVATION").length,
    blocked: initialData.users.filter(u => u.status === "BLOCKED").length,
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setIsUserDrawerOpen(true)
  }

  const handleNewUser = () => {
    setSelectedUser(null)
    setIsUserDrawerOpen(true)
  }

  const handleUserSave = async (userData: any) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      
      // Filter out non-primitive values and handle "none" for employeeId
      Object.keys(userData).forEach(key => {
        const value = userData[key]
        if (key === 'employeeId' && value === 'none') {
          // Skip appending or append empty string to trigger null in readNullable
          return
        }
        
        if (value !== null && value !== undefined && typeof value !== 'object') {
          formData.append(key, String(value))
        }
      })
      
      if (selectedUser) {
        formData.set("userId", selectedUser.id)
        await updateUserGeneralAction(formData)
        toast({ title: "Usuário atualizado", description: "As alterações foram salvas com sucesso." })
      } else {
        await createUserAction(formData)
        toast({ title: "Usuário criado", description: "O novo usuário já está disponível na lista." })
      }
      
      setIsUserDrawerOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error)
      toast({ 
        title: "Erro ao salvar", 
        description: error.message || "Ocorreu um problema ao processar sua solicitação.",
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserStatusChange = async (userId: string, status: string) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("userId", userId)
      formData.append("status", status)
      await setUserStatusAction(formData)
      toast({ title: "Status atualizado", description: `O usuário agora está ${status}.` })
      router.refresh()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRolePermissions = (role: any) => {
    setPermissionTarget({ type: 'role', id: role.id, name: role.name })
    setIsPermissionPopupOpen(true)
  }

  const handlePermissionSave = async (selectedIds: string[]) => {
    if (!permissionTarget) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      if (permissionTarget.type === 'role') {
        formData.append("roleId", permissionTarget.id)
        selectedIds.forEach(id => formData.append("permissionId", id))
        await updateRolePermissionsAction(formData)
      } else {
        toast({ title: "Em breve", description: "A gravação em lote de permissões extras está sendo finalizada." })
        return
      }
      
      toast({ title: "Permissões salvas", description: "As regras de acesso foram atualizadas." })
      setIsPermissionPopupOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("space-y-8 animate-in fade-in duration-700", isLoading && "opacity-60 pointer-events-none transition-opacity")}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-1">
          <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-200 h-16 w-full md:w-auto">
            <TabsTrigger 
              value="usuarios" 
              className="rounded-[1.75rem] px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all"
            >
              <Users className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-widest italic">Gerenciar Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cargos" 
              className="rounded-[1.75rem] px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all"
            >
              <Shield className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-widest italic">Cargos e Perfis</span>
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "usuarios" && (
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right hidden lg:block">
                Total de {initialData.users.length} membros <br/> na organização
              </p>
            </div>
          )}
        </div>

        <TabsContent value="usuarios" className="space-y-10 focus-visible:outline-none">
          <UserControlHeader stats={stats} onNewUser={handleNewUser} />
          <UserTable 
            users={initialData.users} 
            onEdit={handleEditUser} 
            onStatusChange={handleUserStatusChange}
          />
        </TabsContent>

        <TabsContent value="cargos" className="focus-visible:outline-none">
          <RoleManagerTab 
            roles={initialData.roles}
            onEditPermissions={handleEditRolePermissions}
            onDuplicate={async (roleId) => {
              setIsLoading(true)
              try {
                const formData = new FormData()
                formData.append("roleId", roleId)
                await duplicateRoleAction(formData)
                toast({ title: "Perfil duplicado" })
                router.refresh()
              } catch (error: any) {
                toast({ title: "Erro", description: error.message, variant: "destructive" })
              } finally {
                setIsLoading(false)
              }
            }}
            onStatusChange={async (roleId, status) => {
              setIsLoading(true)
              try {
                const formData = new FormData()
                formData.append("roleId", roleId)
                formData.append("nextStatus", status)
                await toggleRoleStatusAction(formData)
                toast({ title: "Status do cargo alterado" })
                router.refresh()
              } catch (error: any) {
                toast({ title: "Erro", description: error.message, variant: "destructive" })
              } finally {
                setIsLoading(false)
              }
            }}
            onNewRole={() => {
              toast({ title: "Em breve", description: "Interface de criação rápida de cargos." })
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UserWizardDrawer 
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        onSave={handleUserSave}
        roles={initialData.roles}
        employees={initialData.employees}
        initialData={selectedUser}
        onAddPermissions={() => {
          setPermissionTarget({ 
            type: 'user', 
            id: selectedUser?.id || 'new', 
            name: selectedUser?.name || 'Novo Usuário' 
          })
          setIsPermissionPopupOpen(true)
        }}
      />

      <PermissionPopup 
        isOpen={isPermissionPopupOpen}
        onClose={() => setIsPermissionPopupOpen(false)}
        onSave={handlePermissionSave}
        allPermissions={initialData.permissions}
        initialSelectedIds={[]}
        userName={permissionTarget?.name}
      />
    </div>
  )
}
