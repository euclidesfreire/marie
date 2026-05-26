-- Dynamic clinical flow for Marie.

CREATE TYPE "AppointmentStepStatus" AS ENUM ('PENDING', 'CURRENT', 'COMPLETED', 'NEEDS_REVIEW', 'SKIPPED');
CREATE TYPE "MarieSuggestionStatus" AS ENUM ('DRAFT', 'PROPOSED', 'APPLIED', 'REJECTED', 'CANCELED');
CREATE TYPE "FollowUpType" AS ENUM ('RETURN', 'FOLLOW_UP', 'PROTOCOL_REVIEW', 'EVOLUTION_CHECK', 'INTERCURRENCE');
CREATE TYPE "FollowUpStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELED');

ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'REOPENED';
ALTER TYPE "AppointmentStep" ADD VALUE IF NOT EXISTS 'CARE_PLAN';
ALTER TYPE "AppointmentStep" ADD VALUE IF NOT EXISTS 'COMPLETION';

UPDATE "Appointment"
SET "currentStep" = 'CARE_PLAN'
WHERE "currentStep"::text IN ('SUGGESTION', 'VALIDATION', 'FINAL_PROTOCOL');

UPDATE "Appointment"
SET "currentStep" = 'COMPLETION'
WHERE "currentStep"::text = 'COMPLETED';

BEGIN;
CREATE TYPE "AppointmentStep_new" AS ENUM ('PREPARATION', 'ANAMNESIS', 'ASSESSMENT', 'CARE_PLAN', 'EXECUTION', 'EVOLUTION', 'COMPLETION');
ALTER TABLE "Appointment" ALTER COLUMN "currentStep" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "currentStep" TYPE "AppointmentStep_new" USING ("currentStep"::text::"AppointmentStep_new");
ALTER TYPE "AppointmentStep" RENAME TO "AppointmentStep_old";
ALTER TYPE "AppointmentStep_new" RENAME TO "AppointmentStep";
DROP TYPE "AppointmentStep_old";
ALTER TABLE "Appointment" ALTER COLUMN "currentStep" SET DEFAULT 'PREPARATION';
COMMIT;

ALTER TABLE "Appointment"
ADD COLUMN "reopenReason" TEXT,
ADD COLUMN "reopenedAt" TIMESTAMP(3);

CREATE TABLE "AppointmentStepState" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "step" "AppointmentStep" NOT NULL,
  "status" "AppointmentStepStatus" NOT NULL DEFAULT 'PENDING',
  "completedAt" TIMESTAMP(3),
  "reopenedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppointmentStepState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarieSuggestion" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "step" "AppointmentStep" NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "payload" JSONB NOT NULL,
  "status" "MarieSuggestionStatus" NOT NULL DEFAULT 'PROPOSED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  CONSTRAINT "MarieSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppointmentFollowUp" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" "FollowUpType" NOT NULL,
  "summary" TEXT NOT NULL,
  "patientResponse" TEXT,
  "professionalNotes" TEXT,
  "adjustments" TEXT,
  "nextSteps" TEXT,
  "status" "FollowUpStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppointmentFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppointmentStepState_appointmentId_step_key" ON "AppointmentStepState"("appointmentId", "step");

ALTER TABLE "AppointmentStepState" ADD CONSTRAINT "AppointmentStepState_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarieSuggestion" ADD CONSTRAINT "MarieSuggestion_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarieSuggestion" ADD CONSTRAINT "MarieSuggestion_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentFollowUp" ADD CONSTRAINT "AppointmentFollowUp_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentFollowUp" ADD CONSTRAINT "AppointmentFollowUp_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
