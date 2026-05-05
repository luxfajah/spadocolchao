/*
  Warnings:

  - You are about to drop the column `yieldQuantity` on the `ProductRecipe` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `ProductRecipeItem` table. All the data in the column will be lost.
  - Added the required column `baseQuantity` to the `ProductRecipeItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ProductRecipeItemRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productRecipeItemId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "computedQuantity" REAL,
    "multiplier" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductRecipeItemRule_productRecipeItemId_fkey" FOREIGN KEY ("productRecipeItemId") REFERENCES "ProductRecipeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productServiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" TEXT,
    "description" TEXT,
    "operationalCategory" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "consumesStock" BOOLEAN NOT NULL DEFAULT false,
    "generatesProductionOrder" BOOLEAN NOT NULL DEFAULT false,
    "usesCommercialSize" BOOLEAN NOT NULL DEFAULT false,
    "usesActualDimensions" BOOLEAN NOT NULL DEFAULT false,
    "usesMattressType" BOOLEAN NOT NULL DEFAULT false,
    "usesDensity" BOOLEAN NOT NULL DEFAULT false,
    "usesBoxType" BOOLEAN NOT NULL DEFAULT false,
    "usesFabricSelection" BOOLEAN NOT NULL DEFAULT false,
    "usesServiceOptions" BOOLEAN NOT NULL DEFAULT false,
    "lossPercentage" REAL NOT NULL DEFAULT 0,
    "estimatedProductionMinutes" INTEGER,
    "estimatedLaborCost" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductRecipe_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "ProductService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductRecipe" ("createdAt", "description", "id", "isActive", "isDefault", "lossPercentage", "name", "productServiceId", "updatedAt", "variant") SELECT "createdAt", "description", "id", "isActive", "isDefault", "lossPercentage", "name", "productServiceId", "updatedAt", "variant" FROM "ProductRecipe";
DROP TABLE "ProductRecipe";
ALTER TABLE "new_ProductRecipe" RENAME TO "ProductRecipe";
CREATE INDEX "ProductRecipe_productServiceId_idx" ON "ProductRecipe"("productServiceId");
CREATE INDEX "ProductRecipe_isDefault_idx" ON "ProductRecipe"("isDefault");
CREATE INDEX "ProductRecipe_isActive_idx" ON "ProductRecipe"("isActive");
CREATE TABLE "new_ProductRecipeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productRecipeId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "componentPart" TEXT,
    "baseQuantity" REAL NOT NULL,
    "unit" TEXT,
    "multiplier" REAL NOT NULL DEFAULT 1,
    "wastePercentage" REAL NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductRecipeItem_productRecipeId_fkey" FOREIGN KEY ("productRecipeId") REFERENCES "ProductRecipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductRecipeItem_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "SupplyItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductRecipeItem" ("createdAt", "id", "notes", "productRecipeId", "supplyItemId", "unit", "updatedAt", "wastePercentage") SELECT "createdAt", "id", "notes", "productRecipeId", "supplyItemId", "unit", "updatedAt", "wastePercentage" FROM "ProductRecipeItem";
DROP TABLE "ProductRecipeItem";
ALTER TABLE "new_ProductRecipeItem" RENAME TO "ProductRecipeItem";
CREATE INDEX "ProductRecipeItem_productRecipeId_idx" ON "ProductRecipeItem"("productRecipeId");
CREATE INDEX "ProductRecipeItem_supplyItemId_idx" ON "ProductRecipeItem"("supplyItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProductRecipeItemRule_productRecipeItemId_idx" ON "ProductRecipeItemRule"("productRecipeItemId");
