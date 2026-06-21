-- CreateTable
CREATE TABLE "TriviaCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriviaCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriviaQuestion" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "answer" INTEGER NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriviaQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TriviaCategory_name_key" ON "TriviaCategory"("name");

-- AddForeignKey
ALTER TABLE "TriviaQuestion" ADD CONSTRAINT "TriviaQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TriviaCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
