ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "primaryTreatmentConcern" TEXT;
ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "mainFinding" TEXT;
ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "photoprotection" TEXT;
ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "sunExposure" TEXT;
ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "acidRetinoidUse" TEXT;
ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "sensitizingMedication" TEXT;
ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "structuredContraindications" TEXT;
ALTER TABLE "AestheticAssessment" ADD COLUMN IF NOT EXISTS "structuredHabits" TEXT;
