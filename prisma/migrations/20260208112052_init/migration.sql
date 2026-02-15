-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aircraft" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "notes" TEXT,
    "rating" INTEGER
);

-- CreateIndex
CREATE INDEX "Session_startedAt_idx" ON "Session"("startedAt");
