import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { generatePlanSchema, updatePlannedMealSchema, type GeneratePlanInput, type UpdatePlannedMealInput } from '@nutriplan/core';
import { CurrentUser } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth.service';
import { ApiZodBody, ZodPipe } from '../common/zod';
import { PlanningService } from './planning.service';

@ApiTags('Planning')
@ApiBearerAuth()
@Controller('meal-plans')
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Post('generate')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiZodBody(generatePlanSchema)
  @ApiOperation({ summary: 'Générer un programme personnalisé (et sa liste de courses)' })
  generate(@CurrentUser() user: AuthUser, @Body(new ZodPipe(generatePlanSchema)) body: GeneratePlanInput) {
    return this.planning.generate(user.id, body);
  }

  @Get('current')
  @ApiOperation({ summary: 'Programme en cours (null si aucun)' })
  async current(@CurrentUser() user: AuthUser) {
    return { plan: await this.planning.current(user.id) };
  }

  @Get()
  @ApiOperation({ summary: 'Historique des programmes' })
  history(@CurrentUser() user: AuthUser) {
    return this.planning.history(user.id);
  }

  @Get(':planId')
  get(@CurrentUser() user: AuthUser, @Param('planId', ParseUUIDPipe) planId: string) {
    return this.planning.get(user.id, planId);
  }

  @Patch(':planId/meals/:mealId')
  @ApiZodBody(updatePlannedMealSchema)
  @ApiOperation({ summary: 'Modifier un repas : portions, date, créneau, recette, réalisé' })
  updateMeal(
    @CurrentUser() user: AuthUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Body(new ZodPipe(updatePlannedMealSchema)) body: UpdatePlannedMealInput,
  ) {
    return this.planning.updateMeal(user.id, planId, mealId, body);
  }

  @Get(':planId/meals/:mealId/alternatives')
  alternatives(@CurrentUser() user: AuthUser, @Param('planId', ParseUUIDPipe) planId: string, @Param('mealId', ParseUUIDPipe) mealId: string) {
    return this.planning.alternatives(user.id, planId, mealId);
  }

  @Post(':planId/meals/:mealId/replace')
  @ApiOperation({ summary: 'Remplacer automatiquement par la meilleure alternative compatible' })
  replace(@CurrentUser() user: AuthUser, @Param('planId', ParseUUIDPipe) planId: string, @Param('mealId', ParseUUIDPipe) mealId: string) {
    return this.planning.replace(user.id, planId, mealId);
  }
}
