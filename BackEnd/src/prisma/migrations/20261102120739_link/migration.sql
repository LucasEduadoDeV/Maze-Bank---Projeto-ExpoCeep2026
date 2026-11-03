-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "card_id" UUID;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id_card") ON DELETE SET NULL ON UPDATE CASCADE;
