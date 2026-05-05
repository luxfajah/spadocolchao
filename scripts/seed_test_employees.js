const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate a valid-looking but fake CPF
function generateCPF() {
    const num = () => Math.floor(Math.random() * 9);
    const n = Array.from({ length: 9 }, num);
    
    let d1 = n.reduce((acc, curr, idx) => acc + (curr * (10 - idx)), 0);
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    
    let d2 = [...n, d1].reduce((acc, curr, idx) => acc + (curr * (11 - idx)), 0);
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    
    return `${n.join('')}${d1}${d2}`;
}

const firstNames = ["Gabriel", "Lucas", "Mateus", "Vitoria", "Juliana", "Marcos", "Beatriz", "Rafael", "Aline", "Fernando", "Camila", "Rodrigo", "Larissa", "Gustavo", "Leticia", "Bruno", "Eduarda", "Thiago", "Isabela", "Diego", "Priscila", "Andre", "Thais", "Felipe", "Renata", "Leonardo", "Daniela", "Marcelo", "Tatiane", "Ricardo"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas"];

const cities = ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André"];
const states = ["SP", "SP", "SP", "SP", "SP"];

async function main() {
    console.log('--- STARTING HR TEST SEED ---');

    // 1. Create Cost Centers if they don't exist
    const costCenterNames = ["Administrativo", "Produção", "Vendas", "Logística"];
    const costCenters = {};
    for (const name of costCenterNames) {
        const code = name.substring(0, 3).toUpperCase();
        costCenters[name] = await prisma.costCenter.upsert({
            where: { code },
            update: { name, isActive: true },
            create: { code, name, isActive: true }
        });
    }

    // 2. Fetch Job Titles and Work Schedules
    const jobTitles = await prisma.jobTitle.findMany({ where: { isActive: true } });
    const workSchedules = await prisma.workSchedule.findMany({ where: { isActive: true } });

    if (jobTitles.length === 0 || workSchedules.length === 0) {
        console.error("No active JobTitles or WorkSchedules found. Please run base seeds first.");
        return;
    }

    // 3. Update JobTitles with CostCenters if they don't have one
    for (const jt of jobTitles) {
        if (!jt.costCenterId) {
            let dept = jt.department || "Administrativo";
            if (!costCenters[dept]) dept = "Administrativo";
            await prisma.jobTitle.update({
                where: { id: jt.id },
                data: { costCenterId: costCenters[dept].id }
            });
        }
    }

    // 4. Generate 30 Employees
    console.log('Generating 30 employees...');
    for (let i = 0; i < 30; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
        const cpf = generateCPF();
        const birthday = new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const admission = new Date(2023 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        
        const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        const workSchedule = workSchedules[Math.floor(Math.random() * workSchedules.length)];
        const costCenter = costCenters[jobTitle.department] || costCenters["Administrativo"];

        // Benefits logic
        const salaryBase = 2000 + Math.floor(Math.random() * 5000);
        const vtDaily = Math.random() > 0.3 ? 10 + Math.floor(Math.random() * 15) : 0;
        const foodAllowance = 300 + Math.floor(Math.random() * 600);
        const healthPlan = Math.random() > 0.5;
        const density = Math.floor(Math.random() * 100);

        await prisma.employee.create({
            data: {
                fullName,
                cpf,
                email,
                admissionDate: admission,
                birthDate: birthday,
                contractType: i % 5 === 0 ? "PJ" : "CLT",
                status: "ACTIVE",
                jobTitleId: jobTitle.id,
                workScheduleId: workSchedule.id,
                costCenterId: costCenter.id,
                salaryBase,
                vtDailyValue: vtDaily,
                vtWorkDaysPerMonth: vtDaily > 0 ? 22 : 0,
                foodAllowance,
                healthPlan,
                dentalPlan: healthPlan && Math.random() > 0.5,
                lifeInsurance: Math.random() > 0.4,
                address: `Rua Exemplo ${i + 1}`,
                city: cities[i % cities.length],
                state: states[i % states.length],
                zipCode: `01000-0${i < 10 ? '0' + i : i}`,
                phone: `119${80000000 + i}`,
                whatsapp: `119${80000000 + i}`,
                bankName: i % 3 === 0 ? "Itaú" : (i % 3 === 1 ? "Bradesco" : "Santander"),
                bankBranch: "0001",
                bankAccount: `${10000 + i}-X`,
                pixKey: email,
                pixKeyType: "EMAIL"
            }
        });
    }

    console.log('--- SEED COMPLETED SUCCESSFULLY ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
