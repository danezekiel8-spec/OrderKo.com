-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "orderCode" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "customerAccessToken" TEXT,
    "customerName" TEXT,
    "customerNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "totalCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "canceledAt" DATETIME,
    "completedAt" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'Customer',
    CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("canceledAt", "completedAt", "createdAt", "customerAccessToken", "customerName", "customerNote", "id", "orderCode", "orderNumber", "paidAt", "paymentStatus", "restaurantId", "status", "submissionKey", "totalCents", "updatedAt") SELECT "canceledAt", "completedAt", "createdAt", "customerAccessToken", "customerName", "customerNote", "id", "orderCode", "orderNumber", "paidAt", "paymentStatus", "restaurantId", "status", "submissionKey", "totalCents", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");
CREATE UNIQUE INDEX "Order_submissionKey_key" ON "Order"("submissionKey");
CREATE UNIQUE INDEX "Order_customerAccessToken_key" ON "Order"("customerAccessToken");
CREATE INDEX "Order_restaurantId_orderNumber_idx" ON "Order"("restaurantId", "orderNumber");
CREATE INDEX "Order_restaurantId_status_paymentStatus_createdAt_idx" ON "Order"("restaurantId", "status", "paymentStatus", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
