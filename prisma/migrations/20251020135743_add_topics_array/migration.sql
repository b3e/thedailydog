/*
  Warnings:

  - You are about to drop the column `topic` on the `Article` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Article_topic_idx";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "topic",
ADD COLUMN     "topics" TEXT[];
