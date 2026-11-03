/*
  Warnings:

  - You are about to alter the column `cvv` on the `cards` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Char(3)`.

*/
-- AlterTable
ALTER TABLE "cards" ALTER COLUMN "cvv" SET DATA TYPE CHAR(3);
