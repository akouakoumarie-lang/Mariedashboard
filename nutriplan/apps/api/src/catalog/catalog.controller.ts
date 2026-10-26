import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { recipeQuerySchema, type RecipeQuery } from '@nutriplan/core';
import { z } from 'zod';
import { CurrentUser } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth.service';
import { ZodPipe } from '../common/zod';
import { CatalogService } from './catalog.service';

const servingsQuery = z.object({ servings: z.coerce.number().int().min(1).max(20).optional() });

@ApiTags('Catalogue')
@ApiBearerAuth()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('ingredients')
  @ApiQuery({ name: 'search', required: false })
  ingredients(@Query(new ZodPipe(z.object({ search: z.string().trim().max(80).optional() }))) q: { search?: string }) {
    return this.catalog.ingredients(q.search);
  }

  @Get('recipes')
  @ApiOperation({ summary: 'Rechercher des recettes (compatibles avec mes contraintes par défaut)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'maxTime', required: false, type: Number })
  @ApiQuery({ name: 'maxCostPerServingCents', required: false, type: Number })
  @ApiQuery({ name: 'diet', required: false })
  @ApiQuery({ name: 'ingredientId', required: false })
  @ApiQuery({ name: 'favoritesOnly', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'compatibleOnly', required: false, enum: ['true', 'false'] })
  list(@CurrentUser() user: AuthUser, @Query(new ZodPipe(recipeQuerySchema)) q: RecipeQuery) {
    return this.catalog.list(user.id, q);
  }

  @Get('recipes/:id')
  @ApiQuery({ name: 'servings', required: false, type: Number })
  detail(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query(new ZodPipe(servingsQuery)) q: z.infer<typeof servingsQuery>) {
    return this.catalog.detail(user.id, id, q.servings);
  }

  @Post('recipes/:id/favorite')
  addFavorite(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.addFavorite(user.id, id);
  }

  @Delete('recipes/:id/favorite')
  removeFavorite(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.removeFavorite(user.id, id);
  }
}
