import { getUsersData } from "@/lib/configuration-queries"
import { UserManagementClient } from "@/components/usuarios/UserManagementClient"

type UsuariosPageProps = {
  searchParams?: {
    user?: string
  }
}

export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  const data = await getUsersData(searchParams?.user)
  
  // Preparing data for the client component
  // We need all roles and permissions regardless of selected user
  const initialData = {
    users: data.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      status: u.status,
      jobTitle: u.jobTitle,
      department: u.department,
      lastLoginAt: u.lastLoginAt,
      avatarUrl: (u as any).avatarUrl,
      primaryRole: u.primaryRole ? { name: u.primaryRole.name } : undefined
    })),
    roles: data.roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      isSystem: r.isSystem,
      users: (r as any).users || [],
      permissions: (r as any).permissions || []
    })),
    permissions: data.permissions.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      module: p.module,
      description: p.description
    })),
    employees: data.employees.map(e => ({
      id: e.id,
      fullName: e.fullName
    }))
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">
      <UserManagementClient initialData={initialData} />
    </div>
  )
}
