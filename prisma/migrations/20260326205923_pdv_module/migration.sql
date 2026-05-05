-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "oldData" TEXT,
    "newData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "entityName" TEXT,
    "entityId" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "allowsInstallments" BOOLEAN NOT NULL DEFAULT false,
    "maxInstallments" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeadSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobTitle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weeklyHours" REAL NOT NULL,
    "mondayMinutes" INTEGER NOT NULL DEFAULT 0,
    "tuesdayMinutes" INTEGER NOT NULL DEFAULT 0,
    "wednesdayMinutes" INTEGER NOT NULL DEFAULT 0,
    "thursdayMinutes" INTEGER NOT NULL DEFAULT 0,
    "fridayMinutes" INTEGER NOT NULL DEFAULT 0,
    "saturdayMinutes" INTEGER NOT NULL DEFAULT 0,
    "sundayMinutes" INTEGER NOT NULL DEFAULT 0,
    "expectedLunchMinutes" INTEGER NOT NULL DEFAULT 0,
    "toleranceMinutes" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "personType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "fullName" TEXT NOT NULL,
    "document" TEXT,
    "stateRegistration" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "whatsapp" TEXT,
    "contactPerson" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "personType" TEXT NOT NULL DEFAULT 'COMPANY',
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "stateRegistration" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "contactPerson" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL',
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "defaultCommissionRate" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "fullName" TEXT NOT NULL,
    "socialName" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "birthDate" DATETIME,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "admissionDate" DATETIME,
    "terminationDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contractType" TEXT NOT NULL,
    "salaryBase" REAL,
    "transportationAllowance" REAL,
    "foodAllowance" REAL,
    "attendanceBonus" REAL,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccount" TEXT,
    "pixKey" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobTitleId" TEXT,
    "workScheduleId" TEXT,
    "costCenterId" TEXT,
    CONSTRAINT "Employee_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Employee_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Employee_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SERVICE',
    "description" TEXT,
    "unit" TEXT,
    "defaultPrice" REAL,
    "defaultCost" REAL,
    "productionTimeMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplyCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplyItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "minimumStock" REAL NOT NULL DEFAULT 0,
    "averageCost" REAL NOT NULL DEFAULT 0,
    "lastPurchaseCost" REAL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT,
    "primarySupplierId" TEXT,
    CONSTRAINT "SupplyItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SupplyCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SupplyItem_primarySupplierId_fkey" FOREIGN KEY ("primarySupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplyItemId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL,
    "totalCost" REAL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT,
    "customerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "leadSourceId" TEXT NOT NULL,
    "cashRegisterSessionId" TEXT,
    "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotalAmount" REAL NOT NULL DEFAULT 0,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "surchargeAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "financialStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_cashRegisterSessionId_fkey" FOREIGN KEY ("cashRegisterSessionId") REFERENCES "CashRegisterSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productServiceId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT,
    "originalPrice" REAL NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "ProductService" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleInstallment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleInstallment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleInstallment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sellerId" TEXT,
    "leadSourceId" TEXT,
    "productServiceId" TEXT,
    "calculationType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "percentage" REAL,
    "fixedAmount" REAL,
    "minimumSaleAmount" REAL,
    "maximumSaleAmount" REAL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommissionRule_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommissionRule_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommissionRule_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "ProductService" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommissionEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "commissionRuleId" TEXT,
    "leadSourceId" TEXT,
    "calculationType" TEXT NOT NULL,
    "baseAmount" REAL NOT NULL,
    "percentage" REAL,
    "fixedAmount" REAL,
    "commissionAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommissionEntry_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommissionEntry_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommissionEntry_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "CommissionRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommissionEntry_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'SOLD',
    "promisedDate" DATETIME,
    "productionStartedAt" DATETIME,
    "readyForDeliveryAt" DATETIME,
    "deliveryDate" DATETIME,
    "deliveredAt" DATETIME,
    "paidAt" DATETIME,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "changedById" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productServiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" TEXT,
    "description" TEXT,
    "yieldQuantity" REAL NOT NULL DEFAULT 1,
    "lossPercentage" REAL NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductRecipe_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "ProductService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductRecipeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productRecipeId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "wastePercentage" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductRecipeItem_productRecipeId_fkey" FOREIGN KEY ("productRecipeId") REFERENCES "ProductRecipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductRecipeItem_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashRegisterSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "openingBalance" REAL NOT NULL DEFAULT 0,
    "closingBalance" REAL,
    "expectedBalance" REAL,
    "difference" REAL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashRegisterSession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashRegisterSession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashRegisterMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethodId" TEXT,
    "description" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashRegisterMovement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashRegisterSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CashRegisterMovement_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashRegisterMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItemDetailMattressReform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleItemId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "commercialSize" TEXT NOT NULL,
    "actualWidth" REAL NOT NULL,
    "actualLength" REAL NOT NULL,
    "actualHeight" REAL NOT NULL,
    "mattressType" TEXT NOT NULL,
    "density" TEXT,
    "optTotalReplacement" BOOLEAN NOT NULL DEFAULT false,
    "optSpringSystemRepl" BOOLEAN NOT NULL DEFAULT false,
    "optSpringSystemRepair" BOOLEAN NOT NULL DEFAULT false,
    "optFullFabricRepl" BOOLEAN NOT NULL DEFAULT false,
    "optPartialFabricRepl" BOOLEAN NOT NULL DEFAULT false,
    "optLeveling" BOOLEAN NOT NULL DEFAULT false,
    "optWaterproofing" BOOLEAN NOT NULL DEFAULT false,
    "topFabricSupplyItemId" TEXT,
    "topFabricColor" TEXT,
    "bottomFabricSupplyItemId" TEXT,
    "bottomFabricColor" TEXT,
    "sideFabricSupplyItemId" TEXT,
    "sideFabricColor" TEXT,
    "technicalNotes" TEXT,
    CONSTRAINT "SaleItemDetailMattressReform_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailMattressReform_topFabricSupplyItemId_fkey" FOREIGN KEY ("topFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailMattressReform_bottomFabricSupplyItemId_fkey" FOREIGN KEY ("bottomFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailMattressReform_sideFabricSupplyItemId_fkey" FOREIGN KEY ("sideFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItemDetailBoxReform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleItemId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "boxType" TEXT NOT NULL,
    "commercialSize" TEXT NOT NULL,
    "actualWidth" REAL NOT NULL,
    "actualLength" REAL NOT NULL,
    "actualHeight" REAL NOT NULL,
    "optTotalReplacement" BOOLEAN NOT NULL DEFAULT false,
    "optFullFabricRepl" BOOLEAN NOT NULL DEFAULT false,
    "optPartialFabricRepl" BOOLEAN NOT NULL DEFAULT false,
    "optStructureReinforce" BOOLEAN NOT NULL DEFAULT false,
    "optStructureRepair" BOOLEAN NOT NULL DEFAULT false,
    "optHardwareReplacement" BOOLEAN NOT NULL DEFAULT false,
    "optWaterproofing" BOOLEAN NOT NULL DEFAULT false,
    "topFabricSupplyItemId" TEXT,
    "topFabricColor" TEXT,
    "sideFabricSupplyItemId" TEXT,
    "sideFabricColor" TEXT,
    "technicalNotes" TEXT,
    CONSTRAINT "SaleItemDetailBoxReform_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailBoxReform_topFabricSupplyItemId_fkey" FOREIGN KEY ("topFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailBoxReform_sideFabricSupplyItemId_fkey" FOREIGN KEY ("sideFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItemDetailNewMattress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleItemId" TEXT NOT NULL,
    "commercialSize" TEXT NOT NULL,
    "actualWidth" REAL NOT NULL,
    "actualLength" REAL NOT NULL,
    "actualHeight" REAL NOT NULL,
    "mattressType" TEXT NOT NULL,
    "density" TEXT,
    "topFabricSupplyItemId" TEXT,
    "topFabricColor" TEXT,
    "bottomFabricSupplyItemId" TEXT,
    "bottomFabricColor" TEXT,
    "sideFabricSupplyItemId" TEXT,
    "sideFabricColor" TEXT,
    "technicalNotes" TEXT,
    CONSTRAINT "SaleItemDetailNewMattress_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailNewMattress_topFabricSupplyItemId_fkey" FOREIGN KEY ("topFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailNewMattress_bottomFabricSupplyItemId_fkey" FOREIGN KEY ("bottomFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailNewMattress_sideFabricSupplyItemId_fkey" FOREIGN KEY ("sideFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItemDetailNewBox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleItemId" TEXT NOT NULL,
    "boxType" TEXT NOT NULL,
    "commercialSize" TEXT NOT NULL,
    "actualWidth" REAL NOT NULL,
    "actualLength" REAL NOT NULL,
    "actualHeight" REAL NOT NULL,
    "topFabricSupplyItemId" TEXT,
    "topFabricColor" TEXT,
    "sideFabricSupplyItemId" TEXT,
    "sideFabricColor" TEXT,
    "technicalNotes" TEXT,
    CONSTRAINT "SaleItemDetailNewBox_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailNewBox_topFabricSupplyItemId_fkey" FOREIGN KEY ("topFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItemDetailNewBox_sideFabricSupplyItemId_fkey" FOREIGN KEY ("sideFabricSupplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItemDetailUpholsteryCleaning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleItemId" TEXT NOT NULL,
    "technicalNotes" TEXT,
    CONSTRAINT "SaleItemDetailUpholsteryCleaning_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItemDetailUpholsteryCleaningRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleItemDetailUpholsteryCleaningId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "observation" TEXT,
    CONSTRAINT "SaleItemDetailUpholsteryCleaningRow_saleItemDetailUpholsteryCleaningId_fkey" FOREIGN KEY ("saleItemDetailUpholsteryCleaningId") REFERENCES "SaleItemDetailUpholsteryCleaning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "AuditLog_entityName_entityId_idx" ON "AuditLog"("entityName", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE INDEX "FileAttachment_entityName_entityId_idx" ON "FileAttachment"("entityName", "entityId");

-- CreateIndex
CREATE INDEX "FileAttachment_uploadedById_idx" ON "FileAttachment"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_code_key" ON "CostCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_code_key" ON "PaymentMethod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialCategory_code_key" ON "FinancialCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSource_code_key" ON "LeadSource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSource_name_key" ON "LeadSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobTitle_name_key" ON "JobTitle"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_name_key" ON "WorkSchedule"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE INDEX "Customer_fullName_idx" ON "Customer"("fullName");

-- CreateIndex
CREATE INDEX "Customer_document_idx" ON "Customer"("document");

-- CreateIndex
CREATE INDEX "Customer_city_state_idx" ON "Customer"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_document_key" ON "Supplier"("document");

-- CreateIndex
CREATE INDEX "Supplier_legalName_idx" ON "Supplier"("legalName");

-- CreateIndex
CREATE INDEX "Supplier_tradeName_idx" ON "Supplier"("tradeName");

-- CreateIndex
CREATE INDEX "Supplier_city_state_idx" ON "Supplier"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_code_key" ON "Seller"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_document_key" ON "Seller"("document");

-- CreateIndex
CREATE INDEX "Seller_name_idx" ON "Seller"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cpf_key" ON "Employee"("cpf");

-- CreateIndex
CREATE INDEX "Employee_fullName_idx" ON "Employee"("fullName");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "Employee_jobTitleId_idx" ON "Employee"("jobTitleId");

-- CreateIndex
CREATE INDEX "Employee_workScheduleId_idx" ON "Employee"("workScheduleId");

-- CreateIndex
CREATE INDEX "Employee_costCenterId_idx" ON "Employee"("costCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductService_code_key" ON "ProductService"("code");

-- CreateIndex
CREATE INDEX "ProductService_name_idx" ON "ProductService"("name");

-- CreateIndex
CREATE INDEX "ProductService_type_idx" ON "ProductService"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyCategory_name_key" ON "SupplyCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyItem_code_key" ON "SupplyItem"("code");

-- CreateIndex
CREATE INDEX "SupplyItem_name_idx" ON "SupplyItem"("name");

-- CreateIndex
CREATE INDEX "SupplyItem_categoryId_idx" ON "SupplyItem"("categoryId");

-- CreateIndex
CREATE INDEX "SupplyItem_primarySupplierId_idx" ON "SupplyItem"("primarySupplierId");

-- CreateIndex
CREATE INDEX "SupplyItem_currentStock_idx" ON "SupplyItem"("currentStock");

-- CreateIndex
CREATE INDEX "StockMovement_supplyItemId_idx" ON "StockMovement"("supplyItemId");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE INDEX "StockMovement_referenceType_referenceId_idx" ON "StockMovement"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_number_key" ON "Sale"("number");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_sellerId_idx" ON "Sale"("sellerId");

-- CreateIndex
CREATE INDEX "Sale_leadSourceId_idx" ON "Sale"("leadSourceId");

-- CreateIndex
CREATE INDEX "Sale_cashRegisterSessionId_idx" ON "Sale"("cashRegisterSessionId");

-- CreateIndex
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_financialStatus_idx" ON "Sale"("financialStatus");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_productServiceId_idx" ON "SaleItem"("productServiceId");

-- CreateIndex
CREATE INDEX "SaleInstallment_paymentMethodId_idx" ON "SaleInstallment"("paymentMethodId");

-- CreateIndex
CREATE INDEX "SaleInstallment_dueDate_idx" ON "SaleInstallment"("dueDate");

-- CreateIndex
CREATE INDEX "SaleInstallment_status_idx" ON "SaleInstallment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SaleInstallment_saleId_installmentNumber_key" ON "SaleInstallment"("saleId", "installmentNumber");

-- CreateIndex
CREATE INDEX "CommissionRule_sellerId_idx" ON "CommissionRule"("sellerId");

-- CreateIndex
CREATE INDEX "CommissionRule_leadSourceId_idx" ON "CommissionRule"("leadSourceId");

-- CreateIndex
CREATE INDEX "CommissionRule_productServiceId_idx" ON "CommissionRule"("productServiceId");

-- CreateIndex
CREATE INDEX "CommissionRule_isActive_priority_idx" ON "CommissionRule"("isActive", "priority");

-- CreateIndex
CREATE INDEX "CommissionEntry_saleId_idx" ON "CommissionEntry"("saleId");

-- CreateIndex
CREATE INDEX "CommissionEntry_sellerId_idx" ON "CommissionEntry"("sellerId");

-- CreateIndex
CREATE INDEX "CommissionEntry_commissionRuleId_idx" ON "CommissionEntry"("commissionRuleId");

-- CreateIndex
CREATE INDEX "CommissionEntry_status_idx" ON "CommissionEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_saleId_key" ON "Order"("saleId");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_sellerId_idx" ON "Order"("sellerId");

-- CreateIndex
CREATE INDEX "Order_currentStatus_idx" ON "Order"("currentStatus");

-- CreateIndex
CREATE INDEX "Order_promisedDate_idx" ON "Order"("promisedDate");

-- CreateIndex
CREATE INDEX "Order_deliveryDate_idx" ON "Order"("deliveryDate");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_changedById_idx" ON "OrderStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_changedAt_idx" ON "OrderStatusHistory"("changedAt");

-- CreateIndex
CREATE INDEX "ProductRecipe_productServiceId_idx" ON "ProductRecipe"("productServiceId");

-- CreateIndex
CREATE INDEX "ProductRecipe_isDefault_idx" ON "ProductRecipe"("isDefault");

-- CreateIndex
CREATE INDEX "ProductRecipe_isActive_idx" ON "ProductRecipe"("isActive");

-- CreateIndex
CREATE INDEX "ProductRecipeItem_supplyItemId_idx" ON "ProductRecipeItem"("supplyItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRecipeItem_productRecipeId_supplyItemId_key" ON "ProductRecipeItem"("productRecipeId", "supplyItemId");

-- CreateIndex
CREATE INDEX "CashRegisterSession_openedById_idx" ON "CashRegisterSession"("openedById");

-- CreateIndex
CREATE INDEX "CashRegisterSession_status_idx" ON "CashRegisterSession"("status");

-- CreateIndex
CREATE INDEX "CashRegisterMovement_sessionId_idx" ON "CashRegisterMovement"("sessionId");

-- CreateIndex
CREATE INDEX "CashRegisterMovement_type_idx" ON "CashRegisterMovement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItemDetailMattressReform_saleItemId_key" ON "SaleItemDetailMattressReform"("saleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItemDetailBoxReform_saleItemId_key" ON "SaleItemDetailBoxReform"("saleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItemDetailNewMattress_saleItemId_key" ON "SaleItemDetailNewMattress"("saleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItemDetailNewBox_saleItemId_key" ON "SaleItemDetailNewBox"("saleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItemDetailUpholsteryCleaning_saleItemId_key" ON "SaleItemDetailUpholsteryCleaning"("saleItemId");
