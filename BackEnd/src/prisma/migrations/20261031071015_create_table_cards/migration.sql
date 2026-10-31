-- CreateEnum
CREATE TYPE "StatusCartao" AS ENUM ('ATIVO', 'BLOQUEADO');

-- CreateTable
CREATE TABLE "cards" (
    "id_card" UUID NOT NULL,
    "card_number" TEXT NOT NULL,
    "cvv" INTEGER NOT NULL,
    "validate_date" TEXT NOT NULL,
    "total_limit" DECIMAL(10,2) NOT NULL,
    "free_limit" DECIMAL(10,2) NOT NULL,
    "status" "StatusCartao" NOT NULL DEFAULT 'ATIVO',
    "user_id" UUID NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id_card")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_card_number_key" ON "cards"("card_number");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
