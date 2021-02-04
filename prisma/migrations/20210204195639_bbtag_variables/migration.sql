-- CreateEnum
CREATE TYPE "enum_bbtag_variables_type" AS ENUM ('GUILD_TAG', 'GUILD_CC', 'LOCAL_TAG', 'LOCAL_CC', 'AUTHOR', 'GLOBAL');

-- CreateTable
CREATE TABLE "bbtag_variables" (
    "name" TEXT NOT NULL,
    "type" "enum_bbtag_variables_type" NOT NULL,
    "scope" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("name","type","scope")
);
