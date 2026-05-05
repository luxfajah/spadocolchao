"use client"

import Link from "next/link"
import { type ChangeEvent, useEffect, useMemo, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { ArrowRight, Building2, Home, KeyRound, Save, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  changeOwnPasswordAction,
  type ChangeOwnPasswordState,
  type UpdateOwnProfileState,
  updateOwnProfileAction,
} from "./actions"

const initialProfileState: UpdateOwnProfileState = {
  error: null,
}

const initialPasswordState: ChangeOwnPasswordState = {
  error: null,
  success: null,
}

interface EditProfileFormProps {
  user: {
    name: string
    socialName: string | null
    email: string | null
    phone: string | null
    username: string
    jobTitle: string | null
    department: string | null
    avatarUrl: string | null
  }
  roleNames: string[]
  defaultRoute: string
}

function getInitials(name: string, username: string) {
  const source = (name || username || "US").trim()

  return (
    source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "US"
  )
}

function ProfileSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em]"
    >
      {pending ? "Salvando perfil..." : "Salvar alterações"}
      <Save className="h-4 w-4" />
    </Button>
  )
}

function PasswordSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em]"
    >
      {pending ? "Atualizando senha..." : "Atualizar senha"}
      <KeyRound className="h-4 w-4" />
    </Button>
  )
}

export function EditProfileForm({ user, roleNames, defaultRoute }: EditProfileFormProps) {
  // @ts-ignore
  const [profileState, profileFormAction] = useFormState(updateOwnProfileAction, initialProfileState)
  // @ts-ignore
  const [passwordState, passwordFormAction] = useFormState(changeOwnPasswordAction, initialPasswordState)
  const userInitials = useMemo(() => getInitials(user.name, user.username), [user.name, user.username])
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  const avatarToRender = avatarPreviewUrl || user.avatarUrl

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0]

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl)
      setAvatarPreviewUrl(null)
    }

    if (!nextFile) {
      return
    }

    setAvatarPreviewUrl(URL.createObjectURL(nextFile))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-[2.5rem] border border-slate-100 shadow-lahomes">
        <form action={profileFormAction}>
          <CardHeader className="space-y-3 p-8 md:p-10">
            <span className="inline-flex w-fit rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Edição pessoal
            </span>
            <CardTitle className="font-outfit text-3xl font-black uppercase italic tracking-tight text-primary">
              Atualize seus dados básicos
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm text-slate-500">
              Aqui você ajusta nome, contato e foto da sua conta. Cargo, setor, login e permissões continuam protegidos
              pelo administrativo.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 p-8 pt-0 md:grid-cols-2 md:p-10 md:pt-0">
            {profileState.error ? (
              <div className="md:col-span-2 rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                {profileState.error}
              </div>
            ) : null}

            <div className="md:col-span-2 rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-slate-950 text-lg font-black text-white">
                  {avatarToRender ? (
                    <img src={avatarToRender} alt={`Foto de perfil de ${user.name}`} className="h-full w-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor="profilePhoto"
                    className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"
                  >
                    Foto de perfil
                  </Label>
                  <Input
                    id="profilePhoto"
                    name="profilePhoto"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleProfilePhotoChange}
                    className="h-12 rounded-[1rem] border-slate-200 bg-white file:mr-3 file:rounded-full file:border file:border-slate-200 file:px-3 file:py-1 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em]"
                  />
                  <p className="text-xs text-slate-500">Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo: 5 MB.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Nome completo
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={user.name}
                className="h-14 rounded-[1.4rem] border-slate-200 bg-slate-50 px-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialName" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Nome social
              </Label>
              <Input
                id="socialName"
                name="socialName"
                defaultValue={user.socialName || ""}
                className="h-14 rounded-[1.4rem] border-slate-200 bg-slate-50 px-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Telefone
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={user.phone || ""}
                placeholder="(00) 00000-0000"
                className="h-14 rounded-[1.4rem] border-slate-200 bg-slate-50 px-5"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email || ""}
                placeholder="você@empresa.com"
                className="h-14 rounded-[1.4rem] border-slate-200 bg-slate-50 px-5"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3 p-8 pt-0 md:p-10 md:pt-0">
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em]"
            >
              <Link href="/perfil">Cancelar</Link>
            </Button>
            <ProfileSubmitButton />
          </CardFooter>
        </form>
      </Card>

      <div className="grid gap-6">
        <Card className="rounded-[2.5rem] border border-slate-100 shadow-lahomes">
          <form action={passwordFormAction}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                Alterar senha
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Para trocar a senha, valide primeiro a senha atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-8 pt-0">
              {passwordState.error ? (
                <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {passwordState.error}
                </div>
              ) : null}
              {passwordState.success ? (
                <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {passwordState.success}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label
                  htmlFor="currentPassword"
                  className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"
                >
                  Senha atual
                </Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  className="h-12 rounded-[1rem] border-slate-200 bg-slate-50 px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Nova senha
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  className="h-12 rounded-[1rem] border-slate-200 bg-slate-50 px-4"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmNewPassword"
                  className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"
                >
                  Confirmar nova senha
                </Label>
                <Input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  required
                  minLength={8}
                  className="h-12 rounded-[1rem] border-slate-200 bg-slate-50 px-4"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-8 pt-0">
              <PasswordSubmitButton />
            </CardFooter>
          </form>
        </Card>

        <Card className="rounded-[2.5rem] border border-slate-100 shadow-lahomes">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
              Dados bloqueados
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Estas informações continuam sincronizadas com o perfil operacional do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-8 pt-0">
            <div className="flex items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <UserRound className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Login</p>
                <p className="text-sm font-semibold text-slate-700">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Perfil de acesso</p>
                <p className="text-sm font-semibold text-slate-700">{roleNames.join(" | ") || "Usuário do sistema"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <Building2 className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Estrutura</p>
                <p className="text-sm font-semibold text-slate-700">
                  {[user.jobTitle, user.department].filter(Boolean).join(" | ") || "Não informado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border border-slate-100 shadow-lahomes">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
              Atalhos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-8 pt-0">
            <Link
              href="/perfil"
              className="flex items-center justify-between rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 transition hover:border-primary/20 hover:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <UserRound className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700">Voltar ao perfil</p>
                  <p className="text-sm text-slate-500">Revisar os dados da conta</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              href={defaultRoute}
              className="flex items-center justify-between rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 transition hover:border-primary/20 hover:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700">Ir para o painel</p>
                  <p className="text-sm text-slate-500">Continuar no fluxo principal</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
