-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductService" (
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
    "updatedAt" DATETIME NOT NULL,
    "operationalCategory" TEXT,
    "internalNotes" TEXT,
    "minimumPrice" REAL,
    "allowPriceChangeInPDV" BOOLEAN NOT NULL DEFAULT false,
    "requirePriceChangeJustification" BOOLEAN NOT NULL DEFAULT false,
    "defaultCommission" REAL,
    "averageLeadTime" INTEGER,
    "highlightInPDV" BOOLEAN NOT NULL DEFAULT false,
    "catalogOrder" INTEGER NOT NULL DEFAULT 0,
    "operationalConfig" TEXT,
    "useTechnicalSheet" BOOLEAN NOT NULL DEFAULT false,
    "consumesStock" BOOLEAN NOT NULL DEFAULT false,
    "generatesProductionOrder" BOOLEAN NOT NULL DEFAULT false,
    "estimatedLaborCost" REAL,
    "wastePercentage" REAL NOT NULL DEFAULT 0,
    "managesStock" BOOLEAN NOT NULL DEFAULT false,
    "minimumStock" REAL NOT NULL DEFAULT 0,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "primarySupplierId" TEXT,
    "lastCost" REAL,
    "stockLocation" TEXT,
    "purchaseLeadTime" INTEGER,
    "ncm" TEXT,
    "cest" TEXT,
    "cfop" TEXT,
    "taxOrigin" TEXT,
    "taxNotes" TEXT,
    CONSTRAINT "ProductService_primarySupplierId_fkey" FOREIGN KEY ("primarySupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductService" ("code", "createdAt", "defaultCost", "defaultPrice", "description", "id", "isActive", "name", "productionTimeMinutes", "type", "unit", "updatedAt") SELECT "code", "createdAt", "defaultCost", "defaultPrice", "description", "id", "isActive", "name", "productionTimeMinutes", "type", "unit", "updatedAt" FROM "ProductService";
DROP TABLE "ProductService";
ALTER TABLE "new_ProductService" RENAME TO "ProductService";
CREATE UNIQUE INDEX "ProductService_code_key" ON "ProductService"("code");
CREATE INDEX "ProductService_name_idx" ON "ProductService"("name");
CREATE INDEX "ProductService_type_idx" ON "ProductService"("type");
CREATE INDEX "ProductService_operationalCategory_idx" ON "ProductService"("operationalCategory");
CREATE INDEX "ProductService_primarySupplierId_idx" ON "ProductService"("primarySupplierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
