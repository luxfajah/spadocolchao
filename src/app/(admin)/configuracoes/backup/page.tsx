import { DatabaseBackup, Download, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfigSection, ConfigShell, StatusBadge } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput } from "@/components/configuracoes/ConfigForm"
import { exportDatabaseAction, generateBackupNowAction, restoreBackupAction, saveSettingsCollectionAction } from "../actions"
import { getBackupData } from "@/lib/configuration-queries"

export default async function BackupPage() {
  const data = await getBackupData()
  const lastBackup = data.backups[0]

  return (
    <ConfigShell
      title="Gestão de Backups"
      subtitle="ROTINA DE PROTEÇÃO DO BANCO COM PASTA, FREQUÊNCIA, RETENÇÃO, GERAÇÃO MANUAL, RESTAURAÇÃO E EXPORTAÇÃO."
      icon={<DatabaseBackup className="h-8 w-8 text-primary" />}
      badges={["Continuidade operacional", "Exportacao do banco", "Retencao de versoes"]}
      stats={[
        {
          label: "Ultimo backup",
          value: lastBackup ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(lastBackup.createdAt) : "Nenhum",
          hint: "snapshot mais recente",
          tone: "blue",
        },
        { label: "Registros salvos", value: data.backups.length, hint: "ultimas versoes catalogadas", tone: "green" },
      ]}
    >
      <ConfigSection
        title="Politica de backup"
        description="PASTA, FREQUENCIA E QUANTIDADE DE VERSOES RETIDAS."
        actions={
          <div className="flex gap-2">
            <form action={generateBackupNowAction}>
              <Button className="rounded-2xl">Gerar backup agora</Button>
            </form>
            <form action={exportDatabaseAction}>
              <Button variant="outline" className="rounded-2xl">
                Exportar banco
              </Button>
            </form>
          </div>
        }
      >
        <form action={saveSettingsCollectionAction} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="redirectPath" value="/configuracoes/backup" />
          {data.settings.map((setting) => (
            <FieldGroup key={setting.id} label={setting.label}>
              <input type="hidden" name="settingId" value={setting.id} />
              <FieldInput name={`value:${setting.id}`} defaultValue={setting.value} />
            </FieldGroup>
          ))}
          <div className="md:col-span-3 flex justify-end">
            <Button className="rounded-2xl px-6">Salvar politica</Button>
          </div>
        </form>
      </ConfigSection>

      <ConfigSection
        title="Histórico de backups"
        description="VERSOES GERADAS, TAMANHO, RESPONSAVEL E ACAO DE RESTAURACAO."
        actions={<RefreshCcw className="h-5 w-5 text-blue-600" />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Responsavel</TableHead>
              <TableHead>Ultima restauracao</TableHead>
              <TableHead className="text-right">Acao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell>
                  <div className="font-semibold text-slate-900">{backup.fileName}</div>
                  <div className="text-xs text-slate-500">{backup.filePath}</div>
                </TableCell>
                <TableCell>{backup.backupType}</TableCell>
                <TableCell>
                  <StatusBadge status={backup.status} />
                </TableCell>
                <TableCell>{backup.sizeBytes ? `${(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB` : "-"}</TableCell>
                <TableCell>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(backup.createdAt)}</TableCell>
                <TableCell>{backup.createdBy?.name || "Sistema"}</TableCell>
                <TableCell>
                  {backup.restoredAt
                    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(backup.restoredAt)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <form action={restoreBackupAction}>
                    <input type="hidden" name="backupId" value={backup.id} />
                    <Button variant="outline" className="rounded-2xl">
                      Restaurar
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ConfigSection>
    </ConfigShell>
  )
}
