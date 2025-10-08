-- AlterTable PasswordReset: Enforce required userId
-- Context: Security improvement to ensure every password reset is tied to an existing user

-- Step 1: Delete orphaned password reset records (safety measure before making userId NOT NULL)
DELETE FROM "PasswordReset" WHERE "userId" IS NULL OR "userId" NOT IN (SELECT id FROM usuarios);

-- Step 2: Make userId NOT NULL
ALTER TABLE "PasswordReset" ALTER COLUMN "userId" SET NOT NULL;
