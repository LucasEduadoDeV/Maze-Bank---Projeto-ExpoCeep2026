-- CreateEnum
CREATE TYPE "UserThemes" AS ENUM ('Light', 'Dark');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "theme" "UserThemes" NOT NULL DEFAULT 'Light';
