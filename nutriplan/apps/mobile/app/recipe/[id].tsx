import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RecipeDetailView } from '../../src/components/recipe-detail';
import { ErrorState, IconButton, Loading, Screen } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { useRecipe, useToggleFavorite } from '../../src/lib/queries';
import { colors } from '../../src/theme/tokens';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [servings, setServings] = useState<number | undefined>();
  const { data, isLoading, isError, error, refetch } = useRecipe(id, servings);
  const favorite = useToggleFavorite();

  if (isLoading) return <Loading />;
  if (isError || !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={refetch} /></Screen>;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon={data.isFavorite ? 'heart' : 'heart-outline'}
              color={data.isFavorite ? colors.danger : colors.primary}
              label={data.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              onPress={() => favorite.mutate({ recipeId: data.id, favorite: !data.isFavorite })}
            />
          ),
        }}
      />
      <RecipeDetailView recipe={data} servings={servings ?? data.servings} onServings={setServings} />
    </Screen>
  );
}
