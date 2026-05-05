import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TratativaDePontoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tratativa De Ponto</h1>
        <p className="text-muted-foreground">Esta página ainda está em construção.</p>
      </div>

      <Card className="border-brand-900/20 bg-brand-900/5">
        <CardHeader>
          <CardTitle>Módulo em desenvolvimento</CardTitle>
          <CardDescription>
            Funcionalidades para Tratativa De Ponto estarão disponíveis em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-brand-900/20 rounded-xl">
            <p>Placeholder para a página de Tratativa De Ponto</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
