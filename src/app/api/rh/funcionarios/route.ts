import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      socialName,
      cpf,
      rg,
      rgExpeditor,
      pis,
      birthDate,
      birthCity,
      birthState,
      gender,
      maritalStatus,
      educationLevel,
      nationality,
      phone,
      whatsapp,
      email,
      photoUrl,
      isPCD,
      pcdDetails,
      hasHealthCondition,
      healthConditionDetails,
      cep,
      address,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      contractType,
      admissionDate,
      salaryBase,
      jobTitleId,
      department,
      workScheduleId,
      costCenterId,
      isCustomSchedule,
      customScheduleData,
      schoolName,
      schoolShift,
      technicalCourse,
      apprenticeshipEnd,
      vtDailyValue,
      vtWorkDaysPerMonth,
      transportationAllowance,
      transportationPayrollDeductionEnabled,
      transportationPayrollDeductionPercent,
      foodAllowance,
      foodPayrollDeductionEnabled,
      foodPayrollDeductionPercent,
      fuelAllowance,
      healthPlan,
      healthPlanDetails,
      dentalPlan,
      lifeInsurance,
      attendanceBonusEnabled,
      attendanceBonusAmount,
      pharmacyAllowance,
      childcareAllowance,
      otherBenefits,
      bankName,
      bankBranch,
      bankAccount,
      bankAccountType,
      pixKey,
      pixKeyType,
      serialId,
      pointMachineId,
      rgIssuanceDate,
      voterCardNumber,
      voterCardZone,
      voterCardSection,
      professionalCouncilNumber,
      professionalCouncilName,
      ctpsNumber,
      ctpsSeries,
      ctpsIssuanceDate,
      ctpsUf,
      cnhNumber,
      cnhCategory,
      militaryDocumentNumber,
      militaryDocumentCategory,
      raceColor,
      fgtsOptionDate,
      fgtsAccount,
      fgtsRectificationDate,
    } = body

    if (!fullName || !contractType || !jobTitleId) {
      return NextResponse.json(
        { error: "Nome, tipo de contrato e cargo são obrigatórios. O centro de custo pode vir do cargo ou ser escolhido pelo RH." },
        { status: 400 }
      )
    }

    const jobTitle = await prisma.jobTitle.findUnique({
      where: { id: jobTitleId },
      select: { id: true, isActive: true, department: true, costCenterId: true },
    })

    if (!jobTitle?.isActive) {
      return NextResponse.json({ error: "Selecione um cargo válido." }, { status: 400 })
    }

    const finalCostCenterId = costCenterId || jobTitle.costCenterId

    if (!finalCostCenterId) {
      return NextResponse.json(
        { error: "O cargo precisa estar vinculado a um centro de custo ou o RH deve escolher um manualmente." },
        { status: 400 }
      )
    }

    const costCenter = await prisma.costCenter.findUnique({
      where: { id: finalCostCenterId },
      select: { id: true, isActive: true },
    })

    if (!costCenter?.isActive) {
      return NextResponse.json({ error: "Selecione um centro de custo válido." }, { status: 400 })
    }

    let finalSerialIdNum = serialId ? parseInt(serialId) : null
    if (!finalSerialIdNum) {
      const lastEmp = await (prisma as any).employee.findFirst({
        orderBy: { serialId: "desc" },
        where: { NOT: { serialId: null } },
      })
      finalSerialIdNum = (lastEmp?.serialId || 0) + 1
    }

    const existing = await (prisma as any).employee.findUnique({
      where: { serialId: finalSerialIdNum! },
    })
    if (existing) {
      return NextResponse.json({ error: `O ID #${finalSerialIdNum} já está em uso.` }, { status: 400 })
    }

    if (finalSerialIdNum! > 10000) {
      return NextResponse.json({ error: "Limite de 10.000 funcionários atingido." }, { status: 400 })
    }

    let finalWorkScheduleId = workScheduleId
    if (isCustomSchedule && customScheduleData) {
      const customSchedule = await (prisma as any).workSchedule.create({
        data: {
          name: `Individual - ${fullName} (#${finalSerialIdNum})`,
          weeklyHours: parseFloat(customScheduleData.weeklyHours || "0"),
          mondayMinutes: parseInt(customScheduleData.mondayMinutes || "0"),
          mondayIn1: customScheduleData.mondayIn1,
          mondayOut1: customScheduleData.mondayOut1,
          mondayIn2: customScheduleData.mondayIn2,
          mondayOut2: customScheduleData.mondayOut2,
          tuesdayMinutes: parseInt(customScheduleData.tuesdayMinutes || "0"),
          tuesdayIn1: customScheduleData.tuesdayIn1,
          tuesdayOut1: customScheduleData.tuesdayOut1,
          tuesdayIn2: customScheduleData.tuesdayIn2,
          tuesdayOut2: customScheduleData.tuesdayOut2,
          wednesdayMinutes: parseInt(customScheduleData.wednesdayMinutes || "0"),
          wednesdayIn1: customScheduleData.wednesdayIn1,
          wednesdayOut1: customScheduleData.wednesdayOut1,
          wednesdayIn2: customScheduleData.wednesdayIn2,
          wednesdayOut2: customScheduleData.wednesdayOut2,
          thursdayMinutes: parseInt(customScheduleData.thursdayMinutes || "0"),
          thursdayIn1: customScheduleData.thursdayIn1,
          thursdayOut1: customScheduleData.thursdayOut1,
          thursdayIn2: customScheduleData.thursdayIn2,
          thursdayOut2: customScheduleData.thursdayOut2,
          fridayMinutes: parseInt(customScheduleData.fridayMinutes || "0"),
          fridayIn1: customScheduleData.fridayIn1,
          fridayOut1: customScheduleData.fridayOut1,
          fridayIn2: customScheduleData.fridayIn2,
          fridayOut2: customScheduleData.fridayOut2,
          saturdayMinutes: parseInt(customScheduleData.saturdayMinutes || "0"),
          saturdayIn1: customScheduleData.saturdayIn1,
          saturdayOut1: customScheduleData.saturdayOut1,
          saturdayIn2: customScheduleData.saturdayIn2,
          saturdayOut2: customScheduleData.saturdayOut2,
          sundayMinutes: parseInt(customScheduleData.sundayMinutes || "0"),
          sundayIn1: customScheduleData.sundayIn1,
          sundayOut1: customScheduleData.sundayOut1,
          sundayIn2: customScheduleData.sundayIn2,
          sundayOut2: customScheduleData.sundayOut2,
          expectedLunchMinutes: parseInt(customScheduleData.expectedLunchMinutes || "60"),
          toleranceMinutes: 5,
        },
      })
      finalWorkScheduleId = customSchedule.id
    }

    const employee = await (prisma as any).employee.create({
      data: {
        fullName,
        socialName,
        cpf,
        rg,
        rgExpeditor,
        rgIssuanceDate: rgIssuanceDate ? new Date(rgIssuanceDate) : null,
        pis,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthCity,
        birthState,
        gender,
        maritalStatus,
        educationLevel,
        nationality,
        raceColor,
        voterCardNumber,
        voterCardZone,
        voterCardSection,
        professionalCouncilNumber,
        professionalCouncilName,
        ctpsNumber,
        ctpsSeries,
        ctpsIssuanceDate: ctpsIssuanceDate ? new Date(ctpsIssuanceDate) : null,
        ctpsUf,
        cnhNumber,
        cnhCategory,
        militaryDocumentNumber,
        militaryDocumentCategory,
        phone,
        whatsapp,
        email,
        photoUrl,
        isPCD,
        pcdDetails,
        hasHealthCondition,
        healthConditionDetails,
        zipCode: cep,
        address,
        street: street || address,
        number,
        complement,
        neighborhood,
        city,
        state,
        contractType,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        salaryBase: salaryBase ? parseFloat(salaryBase) : null,
        jobTitleId,
        department: department || jobTitle.department || null,
        costCenterId: finalCostCenterId,
        workScheduleId: finalWorkScheduleId || null,
        schoolName,
        schoolShift,
        technicalCourse,
        apprenticeshipEnd: apprenticeshipEnd ? new Date(apprenticeshipEnd) : null,
        vtDailyValue: vtDailyValue ? parseFloat(vtDailyValue) : null,
        vtWorkDaysPerMonth: vtWorkDaysPerMonth ? parseInt(vtWorkDaysPerMonth) : null,
        transportationAllowance: transportationAllowance ? parseFloat(transportationAllowance) : null,
        transportationPayrollDeductionEnabled: Boolean(transportationPayrollDeductionEnabled),
        transportationPayrollDeductionPercent:
          transportationPayrollDeductionPercent !== undefined &&
          transportationPayrollDeductionPercent !== null &&
          transportationPayrollDeductionPercent !== ""
            ? parseFloat(transportationPayrollDeductionPercent)
            : null,
        foodAllowance: foodAllowance ? parseFloat(foodAllowance) : null,
        foodPayrollDeductionEnabled: Boolean(foodPayrollDeductionEnabled),
        foodPayrollDeductionPercent:
          foodPayrollDeductionPercent !== undefined &&
          foodPayrollDeductionPercent !== null &&
          foodPayrollDeductionPercent !== ""
            ? parseFloat(foodPayrollDeductionPercent)
            : null,
        fuelAllowance: fuelAllowance ? parseFloat(fuelAllowance) : null,
        healthPlan,
        healthPlanDetails,
        dentalPlan,
        lifeInsurance,
        attendanceBonusEnabled,
        attendanceBonusAmount: attendanceBonusAmount ? parseFloat(attendanceBonusAmount) : null,
        pharmacyAllowance: pharmacyAllowance ? parseFloat(pharmacyAllowance) : null,
        childcareAllowance: childcareAllowance ? parseFloat(childcareAllowance) : null,
        otherBenefits,
        fgtsOptionDate: fgtsOptionDate ? new Date(fgtsOptionDate) : null,
        fgtsAccount,
        fgtsRectificationDate: fgtsRectificationDate ? new Date(fgtsRectificationDate) : null,
        bankName,
        bankBranch,
        bankAccount,
        bankAccountType,
        pixKey,
        pixKeyType,
        serialId: finalSerialIdNum!,
        pointMachineId: pointMachineId || finalSerialIdNum!.toString(),
        status: "ACTIVE",
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error: any) {
    console.error("Erro ao criar funcionário:", error)
    return NextResponse.json(
      { error: "Erro interno ao criar funcionário.", detail: error.message },
      { status: 500 }
    )
  }
}
