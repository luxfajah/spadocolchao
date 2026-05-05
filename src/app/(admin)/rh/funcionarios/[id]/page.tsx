import { getEmployeeDetails } from "./actions"
import { notFound } from "next/navigation"
import { UserCircle, Briefcase, FileText, AlertTriangle, CalendarDays, Receipt, PowerOff, Clock, GraduationCap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmployeeDocumentsTab } from "../components/EmployeeDocumentsTab"
import { StartTerminationModal } from "../../components/StartTerminationModal"
import { QuickActionsPanel } from "./QuickActionsPanel"
import { EmployeeAttendanceMirrors } from "./EmployeeAttendanceMirrors"
import { EmployeePayrollHistory } from "./EmployeePayrollHistory"

export default async function EmployeeDetailsPage({
  params
}: {
  params: { id: string }
}) {
  const employee = await getEmployeeDetails(params.id) as any

  if (!employee) {
    notFound()
  }

  const primaryName = employee.socialName || employee.fullName
  const legalName = employee.socialName ? employee.fullName : null

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Foto ou iniciais */}
          {employee.photoUrl ? (
            <div className="h-20 w-20 rounded-[2rem] overflow-hidden shadow-xl flex-shrink-0">
              <img src={employee.photoUrl} alt={primaryName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-xl shadow-blue-500/20 flex items-center justify-center text-white text-3xl font-black font-outfit uppercase flex-shrink-0">
              {(primaryName || "??").slice(0, 2)}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black text-primary font-outfit uppercase tracking-tight flex items-center gap-3">
              {primaryName}
              <Badge variant="secondary" className={`text-xs tracking-widest rounded-full border-none ${
                employee.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                employee.status === 'VACATION' ? 'bg-amber-50 text-amber-600' :
                employee.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-500'
              }`}>
                {employee.status === 'ACTIVE' ? 'Ativo' : employee.status === 'VACATION' ? 'Férias' :
                 employee.status === 'SUSPENDED' ? 'Afastado' : 'Inativo'}
              </Badge>
              {employee.isPCD && (
                <Badge className="bg-violet-50 text-violet-600 border-none text-[9px] uppercase tracking-widest px-2 rounded-full">PcD</Badge>
              )}
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
              {legalName ? `Nome Legal: ${legalName} • ` : ""}ID #{employee.serialId?.toString().padStart(4, '0') ?? "----"} • {employee.jobTitle?.name || "Cargo não definido"} • {employee.costCenter?.name || "Sem CC"}
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <QuickActionsPanel
          employeeId={employee.id}
          employeeName={primaryName}
          isActive={employee.status === 'ACTIVE'}
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-6 md:p-8">
        <Tabs defaultValue="geral" className="w-full">
          <div className="overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
            <TabsList className="bg-slate-50 border border-slate-100 p-2 rounded-2xl h-14 flex items-center justify-start min-w-max gap-2">
              <TabsTrigger value="geral" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <UserCircle className="w-4 h-4" /> Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="contrato" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <Briefcase className="w-4 h-4" /> RH & Contrato
              </TabsTrigger>
              <TabsTrigger value="ponto" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <Clock className="w-4 h-4" /> Ponto
              </TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <FileText className="w-4 h-4" /> Documentos
              </TabsTrigger>
              <TabsTrigger value="disciplina" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4" /> Disciplina
              </TabsTrigger>
              <TabsTrigger value="ferias" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <CalendarDays className="w-4 h-4" /> Férias
              </TabsTrigger>
              <TabsTrigger value="folha" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <Receipt className="w-4 h-4" /> Recibos & Folha
              </TabsTrigger>
              <TabsTrigger value="desligamento" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-xs flex gap-2">
                <PowerOff className="w-4 h-4" /> Desligamento
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-8">
            <TabsContent value="geral" className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-slate-100 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black font-outfit uppercase text-slate-800">Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Nome Social</p>
                      <p className="font-semibold text-slate-700">{employee.socialName || "---"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">CPF</p>
                      <p className="font-semibold text-slate-700">{employee.cpf || "---"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">RG</p>
                      <p className="font-semibold text-slate-700">{employee.rg || "---"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Data Nascimento</p>
                      <p className="font-semibold text-slate-700">
                        {employee.birthDate ? new Date(employee.birthDate).toLocaleDateString("pt-BR") : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Nacionalidade / Estado Civil</p>
                      <p className="font-semibold text-slate-700">{employee.nationality || "---"} • {employee.maritalStatus || "---"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black font-outfit uppercase text-slate-800">Contato e Endereço</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">E-mail</p>
                      <p className="font-semibold text-slate-700">{employee.email || "---"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Telefone / WhatsApp</p>
                      <p className="font-semibold text-slate-700">{employee.phone || "---"} / {employee.whatsapp || "---"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Endereço</p>
                      <p className="font-semibold text-slate-700 text-sm">
                        {employee.street ? `${employee.street}, ${employee.number} ${employee.complement ? `- ${employee.complement}` : ''}` : "---"}
                        <br />
                        {employee.neighborhood} {employee.city}/{employee.state} - {employee.zipCode}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs uppercase tracking-widest font-black text-rose-400 mb-1">Contato de Emergência</p>
                      <p className="font-semibold text-slate-700">
                        {employee.emergencyContactName || "---"} ({employee.emergencyContactPhone || "---"})
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black font-outfit uppercase text-slate-800">Filiação e Bancário</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Mãe / Pai</p>
                      <p className="font-semibold text-slate-700">{employee.motherName || "---"}</p>
                      <p className="font-semibold text-slate-500 text-sm">{employee.fatherName || "---"}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Banco / Ag. / C.C.</p>
                      <p className="font-semibold text-slate-700">
                        {employee.bankName || "---"} • {employee.bankBranch || "---"} • {employee.bankAccount || "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Chave Pix</p>
                      <p className="font-semibold text-slate-700">{employee.pixKey || "---"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contrato" className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-100 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Jornada e Ponto</CardTitle>
                    <CardDescription>Escala de horários, regime de trabalho e controle de horas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Jornada Atribuída</p>
                        <p className="font-semibold text-slate-700">{employee.workSchedule?.name || "Não definida"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Carga Semanal</p>
                        <p className="font-semibold text-slate-700">{employee.workSchedule?.weeklyHours ? `${employee.workSchedule.weeklyHours}h` : "---"}</p>
                      </div>
                    </div>

                    {employee.workSchedule && (
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead>
                            <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-widest">
                              <th className="py-2 px-3">Dia</th>
                              <th className="py-2 px-3">Entrada 1</th>
                              <th className="py-2 px-3">Saída 1</th>
                              <th className="py-2 px-3">Entrada 2</th>
                              <th className="py-2 px-3">Saída 2</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {[
                               { d: 'Seg', in1: 'mondayIn1', out1: 'mondayOut1', in2: 'mondayIn2', out2: 'mondayOut2' },
                               { d: 'Ter', in1: 'tuesdayIn1', out1: 'tuesdayOut1', in2: 'tuesdayIn2', out2: 'tuesdayOut2' },
                               { d: 'Qua', in1: 'wednesdayIn1', out1: 'wednesdayOut1', in2: 'wednesdayIn2', out2: 'wednesdayOut2' },
                               { d: 'Qui', in1: 'thursdayIn1', out1: 'thursdayOut1', in2: 'thursdayIn2', out2: 'thursdayOut2' },
                               { d: 'Sex', in1: 'fridayIn1', out1: 'fridayOut1', in2: 'fridayIn2', out2: 'fridayOut2' },
                               { d: 'Sáb', in1: 'saturdayIn1', out1: 'saturdayOut1', in2: 'saturdayIn2', out2: 'saturdayOut2' },
                               { d: 'Dom', in1: 'sundayIn1', out1: 'sundayOut1', in2: 'sundayIn2', out2: 'sundayOut2' },
                             ].map(day => (
                               <tr key={day.d} className="hover:bg-white transition-colors">
                                 <td className="py-2 px-3 font-bold text-slate-600">{day.d}</td>
                                 <td className="py-2 px-3 text-slate-500">{employee.workSchedule[day.in1] || '--:--'}</td>
                                 <td className="py-2 px-3 text-slate-500">{employee.workSchedule[day.out1] || '--:--'}</td>
                                 <td className="py-2 px-3 text-slate-500">{employee.workSchedule[day.in2] || '--:--'}</td>
                                 <td className="py-2 px-3 text-slate-500">{employee.workSchedule[day.out2] || '--:--'}</td>
                               </tr>
                             ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Pacote de Remuneração</CardTitle>
                    <CardDescription>Salário base, adicionais e benefícios aplicáveis.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500 mb-1">Salário Base</p>
                        <p className="text-xl font-black text-emerald-700">
                          {employee.salaryBase?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Tipo de Contrato</p>
                        <p className="font-black text-slate-700 uppercase tracking-widest">{employee.contractType}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">VT:</span><br/>
                        <span className="font-semibold text-slate-700">{employee.transportationAllowance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "---"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">VR/VA:</span><br/>
                        <span className="font-semibold text-slate-700">{employee.foodAllowance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "---"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Farmácia:</span><br/>
                        <span className="font-semibold text-slate-700">{employee.pharmacyAllowance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "---"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Creche:</span><br/>
                        <span className="font-semibold text-slate-700">{employee.childcareAllowance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "---"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Assiduidade:</span><br/>
                        <span className="font-semibold text-slate-700">{employee.attendanceBonusAmount?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "---"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Seguro:</span><br/>
                        <span className="font-semibold text-slate-700">{employee.lifeInsurance ? "Sim" : "Não"}</span>
                      </div>
                    </div>

                    {employee.otherBenefits && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outros Benefícios & Obs</p>
                         <p className="text-slate-600 leading-relaxed font-medium">{employee.otherBenefits}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {employee.contractType === 'APPRENTICE' && (
                  <Card className="border-indigo-100 shadow-sm rounded-2xl bg-indigo-50/10">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-indigo-500" />
                        Dados Escolares (Aprendiz)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Escola / Instituição</p>
                          <p className="font-bold text-slate-700 text-sm">{employee.schoolName || "---"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Turno</p>
                          <p className="font-bold text-slate-700 text-sm uppercase">{employee.schoolShift || "---"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Curso / Aprendizagem</p>
                          <p className="font-bold text-slate-700 text-sm">{employee.technicalCourse || "---"}</p>
                        </div>
                        {employee.apprenticeshipEnd && (
                          <div className="col-span-2 pt-2 border-t border-indigo-100/50">
                             <p className="text-[10px] uppercase tracking-widest font-black text-indigo-400 mb-1">Previsão Término Contrato</p>
                             <p className="font-black text-indigo-600 text-sm">{new Date(employee.apprenticeshipEnd).toLocaleDateString("pt-BR")}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="docs" className="animate-in fade-in zoom-in-95 duration-500">
               <EmployeeDocumentsTab 
                 employeeId={employee.id}
                 employeeName={primaryName}
                 documents={employee.documents || []}
               />
            </TabsContent>

            <TabsContent value="disciplina" className="animate-in fade-in zoom-in-95 duration-500">
              <Card className="border-rose-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-rose-50/50 border-b border-rose-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg text-rose-700">Histórico Disciplinar</CardTitle>
                      <CardDescription className="text-rose-600/70">Advertências, suspensões e registros formais de feedback disciplinar.</CardDescription>
                    </div>
                    <button className="bg-white border-rose-200 border shadow-sm px-4 py-2 font-bold text-xs uppercase tracking-widest rounded-xl text-rose-600 hover:bg-rose-50 transition-colors">
                      Nova Ocorrência
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {employee.disciplinaryActions.length === 0 ? (
                    <div className="text-center py-16 px-6 text-emerald-500">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm ring-1 ring-emerald-100">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="font-bold uppercase tracking-widest text-xs">Exemplar!</p>
                      <p className="text-xs mt-2 text-slate-400">Este colaborador não possui ocorrências no prontuário.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 p-6">
                       {/* Timeline visual construction logic here */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ponto" className="animate-in fade-in zoom-in-95 duration-500">
               <EmployeeAttendanceMirrors mirrors={employee.attendanceMirrors || []} />
            </TabsContent>

            <TabsContent value="ferias" className="animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center py-16 px-6 text-slate-400 border border-dashed rounded-2xl">
                 <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 <p className="font-bold uppercase tracking-widest text-xs">Controle de Férias Trabalhado na próxima Etapa</p>
              </div>
            </TabsContent>

            <TabsContent value="folha" className="animate-in fade-in zoom-in-95 duration-500">
              <EmployeePayrollHistory employeeId={employee.id} payrolls={employee.payrolls || []} />
            </TabsContent>

            <TabsContent value="desligamento" className="animate-in fade-in zoom-in-95 duration-500">
              <Card className="border-rose-200 shadow-sm rounded-2xl overflow-hidden bg-rose-50/10">
                <CardHeader className="bg-rose-50 border-b border-rose-100">
                  <div>
                    <CardTitle className="text-lg text-rose-700">Procedimento de Off-board</CardTitle>
                    <CardDescription className="text-rose-600/70">Checklist e documentação para desligamento.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {employee.terminations.length > 0 ? (
                    <div>Em andamento/Concluído (Etapa 6)</div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600 mb-6 max-w-lg mx-auto leading-relaxed">
                        Iniciar o processo de desligamento congelará a geração de folha para os próximos ciclos 
                        e preparará a checklist de devolução de equipamentos e rescisão financeira.
                      </p>
                      <StartTerminationModal employeeId={employee.id} />
                    </div>
                  )}

                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  )
}
