-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('perte_de_poids', 'maintien', 'prise_de_muscle', 'equilibre');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('sedentaire', 'leger', 'modere', 'actif', 'tres_actif');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('femme', 'homme', 'non_precise');

-- CreateEnum
CREATE TYPE "Allergen" AS ENUM ('gluten', 'crustaces', 'oeufs', 'poissons', 'arachides', 'soja', 'lait', 'fruits_a_coque', 'celeri', 'moutarde', 'sesame', 'sulfites', 'lupin', 'mollusques');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('intolerance', 'allergie', 'severe');

-- CreateEnum
CREATE TYPE "Diet" AS ENUM ('vegetarien', 'vegan', 'pescetarien', 'sans_porc', 'sans_gluten', 'sans_lactose', 'sans_alcool');

-- CreateEnum
CREATE TYPE "DietFlag" AS ENUM ('viande', 'porc', 'volaille', 'poisson', 'fruits_de_mer', 'laitier', 'lactose', 'oeuf', 'miel', 'gelatine', 'alcool');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('plaques', 'four', 'micro_ondes', 'mixeur', 'air_fryer', 'cuiseur_vapeur');

-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('fruits', 'legumes', 'feculents', 'proteines', 'produits_frais', 'epicerie', 'autres');

-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('g', 'ml', 'piece');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('g', 'kg', 'ml', 'cl', 'l', 'cs', 'cc', 'piece');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('petit_dejeuner', 'collation', 'dejeuner', 'gouter', 'diner');

-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('petit_dejeuner', 'entree', 'plat', 'salade', 'soupe', 'dessert', 'collation');

-- CreateEnum
CREATE TYPE "SlotKind" AS ENUM ('petit_dejeuner', 'repas', 'collation');

-- CreateEnum
CREATE TYPE "PreferenceType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "PlanSource" AS ENUM ('rules');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "age" INTEGER NOT NULL,
    "sex" "Sex",
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "activityLevel" "ActivityLevel" NOT NULL,
    "goal" "Goal" NOT NULL,
    "trainingSessionsPerWeek" INTEGER,
    "householdSize" INTEGER NOT NULL DEFAULT 1,
    "weeklyBudgetCents" INTEGER,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 3,
    "planningDays" INTEGER NOT NULL DEFAULT 7,
    "cookingTimePreference" INTEGER,
    "equipment" "Equipment"[],
    "diets" "Diet"[],
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "preferenceType" "PreferenceType" NOT NULL,
    "value" UUID NOT NULL,

    CONSTRAINT "DietaryPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "allergen" "Allergen" NOT NULL,
    "severity" "AllergySeverity",

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "IngredientCategory" NOT NULL,
    "unit" "BaseUnit" NOT NULL,
    "gramsPerPiece" DOUBLE PRECISION,
    "densityGPerMl" DOUBLE PRECISION,
    "allergens" "Allergen"[],
    "mayContain" "Allergen"[],
    "dietFlags" "DietFlag"[],
    "isPantryStaple" BOOLEAN NOT NULL DEFAULT false,
    "nutritionalValues" JSONB,
    "nutritionSource" TEXT,
    "priceEstimateCents" INTEGER,
    "priceQuantity" DOUBLE PRECISION,
    "packageSize" DOUBLE PRECISION,
    "priceSource" TEXT,
    "priceUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT[],
    "preparationTime" INTEGER NOT NULL,
    "cookingTime" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "category" "RecipeCategory" NOT NULL,
    "slotKinds" "SlotKind"[],
    "equipment" "Equipment"[],
    "tags" TEXT[],
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "budgetCents" INTEGER,
    "feasible" BOOLEAN NOT NULL DEFAULT true,
    "generationReport" JSONB,
    "source" "PlanSource" NOT NULL DEFAULT 'rules',
    "seed" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedMeal" (
    "id" UUID NOT NULL,
    "mealPlanId" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "servings" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PlannedMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mealPlanId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" UUID NOT NULL,
    "shoppingListId" UUID NOT NULL,
    "ingredientId" UUID,
    "customName" TEXT,
    "category" "IngredientCategory" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL,
    "estimatedPriceCents" INTEGER,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "userEdited" BOOLEAN NOT NULL DEFAULT false,
    "isPantryStaple" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteRecipe" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodInventory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL,
    "expirationDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalGoal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "DietaryPreference_userId_preferenceType_idx" ON "DietaryPreference"("userId", "preferenceType");

-- CreateIndex
CREATE UNIQUE INDEX "DietaryPreference_userId_value_key" ON "DietaryPreference"("userId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Allergy_userId_allergen_key" ON "Allergy"("userId", "allergen");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_slug_key" ON "Ingredient"("slug");

-- CreateIndex
CREATE INDEX "Ingredient_category_idx" ON "Ingredient"("category");

-- CreateIndex
CREATE INDEX "Ingredient_name_idx" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE INDEX "Recipe_category_idx" ON "Recipe"("category");

-- CreateIndex
CREATE INDEX "Recipe_name_idx" ON "Recipe"("name");

-- CreateIndex
CREATE INDEX "RecipeIngredient_ingredientId_idx" ON "RecipeIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_ingredientId_key" ON "RecipeIngredient"("recipeId", "ingredientId");

-- CreateIndex
CREATE INDEX "MealPlan_userId_startDate_idx" ON "MealPlan"("userId", "startDate");

-- CreateIndex
CREATE INDEX "PlannedMeal_mealPlanId_date_idx" ON "PlannedMeal"("mealPlanId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingList_mealPlanId_key" ON "ShoppingList"("mealPlanId");

-- CreateIndex
CREATE INDEX "ShoppingList_userId_idx" ON "ShoppingList"("userId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_shoppingListId_idx" ON "ShoppingListItem"("shoppingListId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteRecipe_userId_recipeId_key" ON "FavoriteRecipe"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodInventory_userId_ingredientId_key" ON "FoodInventory"("userId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "WeightEntry_userId_date_key" ON "WeightEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "PersonalGoal_userId_idx" ON "PersonalGoal"("userId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryPreference" ADD CONSTRAINT "DietaryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryPreference" ADD CONSTRAINT "DietaryPreference_value_fkey" FOREIGN KEY ("value") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedMeal" ADD CONSTRAINT "PlannedMeal_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedMeal" ADD CONSTRAINT "PlannedMeal_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodInventory" ADD CONSTRAINT "FoodInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodInventory" ADD CONSTRAINT "FoodInventory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalGoal" ADD CONSTRAINT "PersonalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
