/*
  Warnings:

  - The primary key for the `Form` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "FormSubmission" DROP CONSTRAINT "FormSubmission_formId_fkey";

-- AlterTable
ALTER TABLE "Form" DROP CONSTRAINT "Form_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Form_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Form_id_seq";

-- AlterTable
ALTER TABLE "FormSubmission" ALTER COLUMN "formId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
