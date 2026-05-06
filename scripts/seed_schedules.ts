import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const schedules = [
  {
    name: 'Escala Produção Integral',
    weeklyHours: 40,
    mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '08:00', out1: '12:00', in2: '14:00', out2: '18:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Produção Compacta',
    weeklyHours: 35,
    mondayMinutes: 420, tuesdayMinutes: 420, wednesdayMinutes: 420, thursdayMinutes: 420, fridayMinutes: 420, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '08:00', out1: '12:00', in2: '14:00', out2: '17:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Aprendiz Administrativo',
    weeklyHours: 20,
    mondayMinutes: 240, tuesdayMinutes: 240, wednesdayMinutes: 240, thursdayMinutes: 240, fridayMinutes: 240, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 0,
    times: { in1: '14:00', out1: '18:00', in2: null, out2: null },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Aprendiz Operacional',
    weeklyHours: 20,
    mondayMinutes: 240, tuesdayMinutes: 240, wednesdayMinutes: 240, thursdayMinutes: 240, fridayMinutes: 240, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 0,
    times: { in1: '14:00', out1: '18:00', in2: null, out2: null },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Logística Matinal',
    weeklyHours: 40,
    mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '07:00', out1: '12:00', in2: '14:00', out2: '17:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Logística Padrão',
    weeklyHours: 40,
    mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '08:00', out1: '12:00', in2: '14:00', out2: '18:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Comercial Padrão',
    weeklyHours: 35,
    mondayMinutes: 420, tuesdayMinutes: 420, wednesdayMinutes: 420, thursdayMinutes: 420, fridayMinutes: 420, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '09:00', out1: '12:00', in2: '14:00', out2: '18:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala SDR e Atendimento',
    weeklyHours: 35,
    mondayMinutes: 420, tuesdayMinutes: 420, wednesdayMinutes: 420, thursdayMinutes: 420, fridayMinutes: 420, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '09:00', out1: '12:00', in2: '14:00', out2: '18:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Marketing Operacional',
    weeklyHours: 30,
    mondayMinutes: 360, tuesdayMinutes: 360, wednesdayMinutes: 360, thursdayMinutes: 360, fridayMinutes: 360, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '10:00', out1: '12:00', in2: '14:00', out2: '18:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Administrativo Padrão',
    weeklyHours: 40,
    mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '08:00', out1: '12:00', in2: '14:00', out2: '18:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Administrativo Compacta',
    weeklyHours: 30,
    mondayMinutes: 360, tuesdayMinutes: 360, wednesdayMinutes: 360, thursdayMinutes: 360, fridayMinutes: 360, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '09:00', out1: '12:00', in2: '14:00', out2: '17:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Limpeza e Fechamento',
    weeklyHours: 10,
    mondayMinutes: 120, tuesdayMinutes: 120, wednesdayMinutes: 120, thursdayMinutes: 120, fridayMinutes: 120, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 0,
    times: { in1: '17:00', out1: '19:00', in2: null, out2: null },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Meio Período Manhã',
    weeklyHours: 20,
    mondayMinutes: 240, tuesdayMinutes: 240, wednesdayMinutes: 240, thursdayMinutes: 240, fridayMinutes: 240, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 0,
    times: { in1: '08:00', out1: '12:00', in2: null, out2: null },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Meio Período Tarde',
    weeklyHours: 20,
    mondayMinutes: 240, tuesdayMinutes: 240, wednesdayMinutes: 240, thursdayMinutes: 240, fridayMinutes: 240, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 0,
    times: { in1: '14:00', out1: '18:00', in2: null, out2: null },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Sábado Operacional',
    weeklyHours: 4,
    mondayMinutes: 0, tuesdayMinutes: 0, wednesdayMinutes: 0, thursdayMinutes: 0, fridayMinutes: 0, saturdayMinutes: 240, sundayMinutes: 0,
    expectedLunchMinutes: 0,
    times: { in1: '08:00', out1: '12:00', in2: null, out2: null },
    days: ['saturday']
  },
  {
    name: 'Escala Sábado Comercial',
    weeklyHours: 4,
    mondayMinutes: 0, tuesdayMinutes: 0, wednesdayMinutes: 0, thursdayMinutes: 0, fridayMinutes: 0, saturdayMinutes: 240, sundayMinutes: 0,
    expectedLunchMinutes: 0,
    times: { in1: '09:00', out1: '13:00', in2: null, out2: null },
    days: ['saturday']
  },
  {
    name: 'Escala Plantão Técnico',
    weeklyHours: 40,
    mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 60,
    times: { in1: null, out1: null, in2: null, out2: null },
    days: []
  },
  {
    name: 'Escala White Label Externo',
    weeklyHours: 40,
    mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 60,
    times: { in1: null, out1: null, in2: null, out2: null },
    days: []
  },
  {
    name: 'Escala Produção Estendida',
    weeklyHours: 50,
    mondayMinutes: 600, tuesdayMinutes: 600, wednesdayMinutes: 600, thursdayMinutes: 600, fridayMinutes: 600, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '07:00', out1: '12:00', in2: '14:00', out2: '19:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    name: 'Escala Coordenação Geral',
    weeklyHours: 40,
    mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, saturdayMinutes: 0, sundayMinutes: 0,
    expectedLunchMinutes: 120,
    times: { in1: '08:00', out1: '12:00', in2: '14:00', out2: '18:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }
];

async function main() {
  console.log('Iniciando cadastro de escalas (WorkSchedules)...');

  for (const s of schedules) {
    console.log(`Processando: ${s.name}`);
    
    // Build the dynamic times payload
    const timesPayload: any = {};
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      if (s.days.includes(day)) {
        timesPayload[`${day}In1`] = s.times.in1;
        timesPayload[`${day}Out1`] = s.times.out1;
        timesPayload[`${day}In2`] = s.times.in2;
        timesPayload[`${day}Out2`] = s.times.out2;
      } else {
        timesPayload[`${day}In1`] = null;
        timesPayload[`${day}Out1`] = null;
        timesPayload[`${day}In2`] = null;
        timesPayload[`${day}Out2`] = null;
      }
    }

    const payload = {
      name: s.name,
      weeklyHours: s.weeklyHours,
      mondayMinutes: s.mondayMinutes,
      tuesdayMinutes: s.tuesdayMinutes,
      wednesdayMinutes: s.wednesdayMinutes,
      thursdayMinutes: s.thursdayMinutes,
      fridayMinutes: s.fridayMinutes,
      saturdayMinutes: s.saturdayMinutes,
      sundayMinutes: s.sundayMinutes,
      expectedLunchMinutes: s.expectedLunchMinutes,
      toleranceMinutes: 10,
      ...timesPayload,
      isActive: true
    };

    await prisma.workSchedule.upsert({
      where: { name: s.name },
      update: payload,
      create: payload
    });
  }

  console.log('Escalas cadastradas com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
