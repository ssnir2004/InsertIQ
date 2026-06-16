-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "substrate" TEXT NOT NULL,
    "coatingType" TEXT,
    "description" TEXT,
    "advantages" TEXT[],
    "disadvantages" TEXT[],
    "isoMaterials" TEXT[],
    "conditions" TEXT[],
    "applications" TEXT[],
    "vcMin" DOUBLE PRECISION,
    "vcMax" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insert" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "application" TEXT NOT NULL,
    "geometry" TEXT,
    "gradeId" TEXT NOT NULL,
    "advantages" TEXT[],
    "disadvantages" TEXT[],
    "materials" TEXT[],
    "conditions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResult" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grade_code_key" ON "Grade"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Insert_code_key" ON "Insert"("code");

-- AddForeignKey
ALTER TABLE "Insert" ADD CONSTRAINT "Insert_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
