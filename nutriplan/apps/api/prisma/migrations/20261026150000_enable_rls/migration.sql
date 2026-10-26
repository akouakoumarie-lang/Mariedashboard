-- Si la base est hébergée par Supabase, l'API REST automatique (PostgREST) exposerait le schéma public
-- avec la clé publique. On active la RLS sans aucune politique : seul le propriétaire des tables
-- (le rôle utilisé par l'API NestJS via Prisma) peut lire et écrire. Sans effet sur un PostgreSQL classique.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DietaryPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Allergy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ingredient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeIngredient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MealPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlannedMeal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShoppingList" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShoppingListItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FavoriteRecipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FoodInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeightEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonalGoal" ENABLE ROW LEVEL SECURITY;
