/*
  Warnings:

  - You are about to drop the `_NextStations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_NextStations" DROP CONSTRAINT "_NextStations_A_fkey";

-- DropForeignKey
ALTER TABLE "_NextStations" DROP CONSTRAINT "_NextStations_B_fkey";

-- DropTable
DROP TABLE "_NextStations";

-- CreateTable
CREATE TABLE "StationConnection" (
    "stationConnectionId" SERIAL NOT NULL,
    "startStationId" TEXT NOT NULL,
    "endStationId" TEXT NOT NULL,

    CONSTRAINT "StationConnection_pkey" PRIMARY KEY ("stationConnectionId")
);

-- CreateTable
CREATE TABLE "Route" (
    "routeId" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "travelTime" INTEGER NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("routeId")
);
