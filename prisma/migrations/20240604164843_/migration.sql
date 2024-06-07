/*
  Warnings:

  - You are about to drop the column `submission` on the `Form` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,userId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Form" DROP COLUMN "submission",
ADD COLUMN     "submissions" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Form_name_userId_key" ON "Form"("name", "userId");
