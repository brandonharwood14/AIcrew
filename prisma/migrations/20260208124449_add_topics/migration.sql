-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aircraft" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Topic_aircraft_idx" ON "Topic"("aircraft");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_aircraft_title_key" ON "Topic"("aircraft", "title");
