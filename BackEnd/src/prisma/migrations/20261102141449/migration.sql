/*
  Warnings:

  - You are about to drop the column `bill_id` on the `invoices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_bill_id_fkey";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "bill_id";
