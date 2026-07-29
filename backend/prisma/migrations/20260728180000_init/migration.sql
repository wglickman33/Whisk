-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "defaultUnitCategory" TEXT NOT NULL DEFAULT 'volume',
    "resetTokenHash" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'food',
    "servings" DOUBLE PRECISION NOT NULL,
    "servingUnit" TEXT NOT NULL DEFAULT 'servings',
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "notes" TEXT,
    "sourceUrl" TEXT,
    "unitSystem" TEXT NOT NULL DEFAULT 'inherit',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "categoryId" TEXT,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "timerMinutes" DOUBLE PRECISION,
    "imageUrl" TEXT,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeMetrics" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,

    CONSTRAINT "RecipeMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeTag" (
    "recipeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("recipeId","tagId")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "shareCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListMember" (
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ShoppingListMember_pkey" PRIMARY KEY ("listId","userId")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" TEXT,
    "note" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "addedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeMetrics_recipeId_key" ON "RecipeMetrics"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_name_key" ON "Folder"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_label_key" ON "Tag"("userId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingList_shareCode_key" ON "ShoppingList"("shareCode");

-- CreateIndex
CREATE INDEX "ShoppingList_ownerUserId_idx" ON "ShoppingList"("ownerUserId");

-- CreateIndex
CREATE INDEX "ShoppingListMember_userId_idx" ON "ShoppingListMember"("userId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_listId_idx" ON "ShoppingListItem"("listId");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeMetrics" ADD CONSTRAINT "RecipeMetrics_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListMember" ADD CONSTRAINT "ShoppingListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListMember" ADD CONSTRAINT "ShoppingListMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

