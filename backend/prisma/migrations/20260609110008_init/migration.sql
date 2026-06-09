/*
  Warnings:

  - The values [ENDED] on the enum `DropStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DropStatus_new" AS ENUM ('UPCOMING', 'ACTIVE');
ALTER TABLE "public"."Drop" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Drop" ALTER COLUMN "status" TYPE "DropStatus_new" USING ("status"::text::"DropStatus_new");
ALTER TYPE "DropStatus" RENAME TO "DropStatus_old";
ALTER TYPE "DropStatus_new" RENAME TO "DropStatus";
DROP TYPE "public"."DropStatus_old";
ALTER TABLE "Drop" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;
