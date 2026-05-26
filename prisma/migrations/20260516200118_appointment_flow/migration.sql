-- CreateEnum
CREATE TYPE "AppointmentStep" AS ENUM ('PREPARATION', 'ANAMNESIS', 'ASSESSMENT', 'SUGGESTION', 'VALIDATION', 'FINAL_PROTOCOL', 'EXECUTION', 'EVOLUTION', 'COMPLETED');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "currentStep" "AppointmentStep" NOT NULL DEFAULT 'PREPARATION',
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Evolution" ADD COLUMN     "returnDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AppointmentExecution" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "procedurePerformed" TEXT NOT NULL,
    "productsUsed" TEXT,
    "equipmentParameters" TEXT,
    "duration" TEXT,
    "professionalNotes" TEXT,
    "incidents" TEXT,
    "postCareGiven" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentExecution_appointmentId_key" ON "AppointmentExecution"("appointmentId");

-- AddForeignKey
ALTER TABLE "AppointmentExecution" ADD CONSTRAINT "AppointmentExecution_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
