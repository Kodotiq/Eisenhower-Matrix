-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "reminderTime" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Task" ("createdAt", "id", "importance", "title", "urgency") SELECT "createdAt", "id", "importance", "title", "urgency" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
