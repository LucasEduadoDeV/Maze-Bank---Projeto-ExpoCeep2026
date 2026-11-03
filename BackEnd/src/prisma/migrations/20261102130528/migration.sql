-- CreateEnum
CREATE TYPE "StatusInvoice" AS ENUM ('Em Aberto', 'Pago', 'Cancelado');

-- CreateTable
CREATE TABLE "Invoices" (
    "invoice_id" UUID NOT NULL,
    "invoice_name" VARCHAR(30) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "itens" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "StatusInvoice" NOT NULL DEFAULT 'Em Aberto',
    "user_id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,

    CONSTRAINT "Invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;
