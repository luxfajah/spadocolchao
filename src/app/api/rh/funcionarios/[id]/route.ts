import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { uploadFile } from "@/lib/storage-service"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { jobTitle: true, workSchedule: true, costCenter: true },
    })

    if (!emp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(emp)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
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
      status,
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
      motherName,
      fatherName,
    } = body

    if (!jobTitleId) {
      return NextResponse.json(
        { error: "Cargo obrigatório. O centro de custo pode vir do cargo ou ser escolhido pelo RH." },
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

    let finalWorkScheduleId = workScheduleId
    if (isCustomSchedule && customScheduleData) {
      const customSchedule = await (prisma as any).workSchedule.create({
        data: {
          name: `Individual - ${fullName || "Func"} (#${serialId || params.id})`,
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

    let finalPhotoUrl = photoUrl;
    if (photoUrl && photoUrl.startsWith("data:image")) {
      const matches = photoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = matches[1].split('/')[1] || 'png';
        finalPhotoUrl = await uploadFile(`avatars/employee-${params.id}-${Date.now()}.${ext}`, buffer, matches[1]);
      }
    }

    const updated = await (prisma as any).employee.update({
      where: { id: params.id },
      data: {
        fullName,
        socialName,
        cpf,
        rg,
        rgExpeditor,
        rgIssuanceDate: rgIssuanceDate ? new Date(rgIssuanceDate) : undefined,
        pis,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        birthCity,
        birthState,
        gender,
        maritalStatus,
        educationLevel,
        motherName,
        fatherName,
        nationality,
        raceColor,
        voterCardNumber,
        voterCardZone,
        voterCardSection,
        professionalCouncilNumber,
        professionalCouncilName,
        ctpsNumber,
        ctpsSeries,
        ctpsIssuanceDate: ctpsIssuanceDate ? new Date(ctpsIssuanceDate) : undefined,
        ctpsUf,
        cnhNumber,
        cnhCategory,
        militaryDocumentNumber,
        militaryDocumentCategory,
        phone,
        whatsapp,
        email,
        photoUrl: finalPhotoUrl,
        isPCD: isPCD !== undefined ? Boolean(isPCD) : undefined,
        pcdDetails,
        hasHealthCondition: hasHealthCondition !== undefined ? Boolean(hasHealthCondition) : undefined,
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
        admissionDate: admissionDate ? new Date(admissionDate) : undefined,
        salaryBase: salaryBase ? parseFloat(salaryBase) : undefined,
        jobTitleId,
        department: department || jobTitle.department || null,
        costCenterId: finalCostCenterId,
        status,
        workScheduleId: finalWorkScheduleId || undefined,
        schoolName,
        schoolShift,
        technicalCourse,
        apprenticeshipEnd: apprenticeshipEnd ? new Date(apprenticeshipEnd) : undefined,
        vtDailyValue: vtDailyValue ? parseFloat(vtDailyValue) : undefined,
        vtWorkDaysPerMonth: vtWorkDaysPerMonth ? parseInt(vtWorkDaysPerMonth) : undefined,
        transportationAllowance: transportationAllowance ? parseFloat(transportationAllowance) : undefined,
        transportationPayrollDeductionEnabled:
          transportationPayrollDeductionEnabled !== undefined
            ? Boolean(transportationPayrollDeductionEnabled)
            : undefined,
        transportationPayrollDeductionPercent:
          transportationPayrollDeductionPercent !== undefined &&
          transportationPayrollDeductionPercent !== null &&
          transportationPayrollDeductionPercent !== ""
            ? parseFloat(transportationPayrollDeductionPercent)
            : undefined,
        foodAllowance: foodAllowance ? parseFloat(foodAllowance) : undefined,
        foodPayrollDeductionEnabled:
          foodPayrollDeductionEnabled !== undefined
            ? Boolean(foodPayrollDeductionEnabled)
            : undefined,
        foodPayrollDeductionPercent:
          foodPayrollDeductionPercent !== undefined &&
          foodPayrollDeductionPercent !== null &&
          foodPayrollDeductionPercent !== ""
            ? parseFloat(foodPayrollDeductionPercent)
            : undefined,
        fuelAllowance: fuelAllowance ? parseFloat(fuelAllowance) : undefined,
        healthPlan: healthPlan !== undefined ? Boolean(healthPlan) : undefined,
        healthPlanDetails,
        dentalPlan: dentalPlan !== undefined ? Boolean(dentalPlan) : undefined,
        lifeInsurance: lifeInsurance !== undefined ? Boolean(lifeInsurance) : undefined,
        attendanceBonusEnabled:
          attendanceBonusEnabled !== undefined ? Boolean(attendanceBonusEnabled) : undefined,
        attendanceBonusAmount: attendanceBonusAmount ? parseFloat(attendanceBonusAmount) : undefined,
        pharmacyAllowance: pharmacyAllowance ? parseFloat(pharmacyAllowance) : undefined,
        childcareAllowance: childcareAllowance ? parseFloat(childcareAllowance) : undefined,
        otherBenefits,
        fgtsOptionDate: fgtsOptionDate ? new Date(fgtsOptionDate) : undefined,
        fgtsAccount,
        fgtsRectificationDate: fgtsRectificationDate ? new Date(fgtsRectificationDate) : undefined,
        bankName,
        bankBranch,
        bankAccount,
        bankAccountType,
        pixKey,
        pixKeyType,
        serialId: serialId ? parseInt(serialId) : undefined,
        pointMachineId,
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
