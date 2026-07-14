/*
  Warnings:

  - The primary key for the `Feedback` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Feedback` table. All the data in the column will be lost.
  - The primary key for the `Seat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Seat` table. All the data in the column will be lost.
  - The primary key for the `SeatClass` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `SeatClass` table. All the data in the column will be lost.
  - The primary key for the `Shift` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Shift` table. All the data in the column will be lost.
  - The primary key for the `Ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `seat_id` on the `Ticket` table. All the data in the column will be lost.
  - The primary key for the `Trip` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Trip` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seatId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seatId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_seatClassId_fkey";

-- DropForeignKey
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_tripId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_seat_id_fkey";

-- DropIndex
DROP INDEX "Ticket_seat_id_key";

-- AlterTable
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_pkey",
DROP COLUMN "id",
ADD COLUMN     "feedbackId" SERIAL NOT NULL,
ADD CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedbackId");

-- AlterTable
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_pkey",
DROP COLUMN "id",
ADD COLUMN     "seatId" SERIAL NOT NULL,
ADD CONSTRAINT "Seat_pkey" PRIMARY KEY ("seatId");

-- AlterTable
ALTER TABLE "SeatClass" DROP CONSTRAINT "SeatClass_pkey",
DROP COLUMN "id",
ADD COLUMN     "seatClassId" SERIAL NOT NULL,
ADD CONSTRAINT "SeatClass_pkey" PRIMARY KEY ("seatClassId");

-- AlterTable
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_pkey",
DROP COLUMN "id",
ADD COLUMN     "shiftId" SERIAL NOT NULL,
ADD CONSTRAINT "Shift_pkey" PRIMARY KEY ("shiftId");

-- AlterTable
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_pkey",
DROP COLUMN "id",
DROP COLUMN "seat_id",
ADD COLUMN     "seatId" INTEGER NOT NULL,
ADD COLUMN     "ticketId" SERIAL NOT NULL,
ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("ticketId");

-- AlterTable
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_pkey",
DROP COLUMN "id",
ADD COLUMN     "tripId" SERIAL NOT NULL,
ADD CONSTRAINT "Trip_pkey" PRIMARY KEY ("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_seatId_key" ON "Ticket"("seatId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("seatId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_seatClassId_fkey" FOREIGN KEY ("seatClassId") REFERENCES "SeatClass"("seatClassId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("tripId") ON DELETE RESTRICT ON UPDATE CASCADE;
