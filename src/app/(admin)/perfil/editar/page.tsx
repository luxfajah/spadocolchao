import Link from "next/link"
import { ArrowRight, PencilLine } from "lucide-react"
import { getUserAccessProfile } from "@/lib/access-control"
import { requireAuthenticatedUser } from "@/lib/auth"
import { getUserAvatarUrl } from "@/lib/user-avatar"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { EditProfileForm } from "../EditProfileForm"

export default async function EditarPerfilPage() {
  const user = await requireAuthenticatedUser()
  const avatarUrl = await getUserAvatarUrl(user.id)
  const accessProfile = await getUserAccessProfile(user)

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Editar Perfil"
        subtitle="ATUALIZE NOME, NOME SOCIAL, E-MAIL E TELEFONE DA SUA CONTA SEM ALTERAR O ESCOPO OPERACIONAL."
        icon={<PencilLine className="h-8 w-8" />}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/perfil">
              <Button
                variant="outline"
                className="h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em]"
              >
                Meu perfil
              </Button>
            </Link>

            <Link href={accessProfile.defaultRoute}>
              <Button className="h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em]">
                Voltar ao painel <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <EditProfileForm
        user={{
          name: user.name,
          socialName: user.socialName,
          email: user.email,
          phone: user.phone,
          username: user.username,
          jobTitle: user.jobTitle,
          department: user.department,
          avatarUrl,
        }}
        roleNames={accessProfile.roleNames}
        defaultRoute={accessProfile.defaultRoute}
      />
    </main>
  )
}
