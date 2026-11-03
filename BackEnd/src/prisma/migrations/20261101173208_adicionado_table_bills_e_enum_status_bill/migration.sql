-- CreateEnum
CREATE TYPE "StatusBill" AS ENUM ('Em Aberto', 'Pago', 'Cancelado');

-- CreateTable
CREATE TABLE "Bills" (
    "bill_id" UUID NOT NULL,
    "bill_name" CHAR(50) NOT NULL,
    "biller" CHAR(50) NOT NULL,
    "description" CHAR(50) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "StatusBill" NOT NULL DEFAULT 'Em Aberto',
    "value" DECIMAL(10,2) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "Bills_pkey" PRIMARY KEY ("bill_id")
);

-- AddForeignKey
ALTER TABLE "Bills" ADD CONSTRAINT "Bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
