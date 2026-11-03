/*
  Warnings:

  - Changed the type of `validate_date` on the `cards` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "cards" DROP COLUMN "validate_date",
ADD COLUMN     "validate_date" TIMESTAMP(3) NOT NULL;
