import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { personalGoalSchema, weightEntrySchema } from '@nutriplan/core';
import { z } from 'zod';
import { CurrentUser } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth.service';
import { ApiZodBody, ZodPipe } from '../common/zod';
import { ProgressService } from './progress.service';

const goalUpdateSchema = personalGoalSchema.partial();

@ApiTags('Tableau de bord et suivi')
@ApiBearerAuth()
@Controller()
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tableau de bord personnalisé' })
  dashboard(@CurrentUser() user: AuthUser) {
    return this.progress.dashboard(user.id);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Suivi des habitudes (8 dernières semaines)' })
  get(@CurrentUser() user: AuthUser) {
    return this.progress.progress(user.id);
  }

  @Get('progress/weights')
  weights(@CurrentUser() user: AuthUser) {
    return this.progress.weights(user.id);
  }

  @Post('progress/weights')
  @ApiZodBody(weightEntrySchema)
  @ApiOperation({ summary: 'Ajouter une mesure de poids (facultatif)' })
  addWeight(@CurrentUser() user: AuthUser, @Body(new ZodPipe(weightEntrySchema)) body: z.infer<typeof weightEntrySchema>) {
    return this.progress.addWeight(user.id, body.date, body.weightKg);
  }

  @Delete('progress/weights/:id')
  deleteWeight(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.progress.deleteWeight(user.id, id);
  }

  @Get('progress/goals')
  goals(@CurrentUser() user: AuthUser) {
    return this.progress.goals(user.id);
  }

  @Post('progress/goals')
  @ApiZodBody(personalGoalSchema)
  addGoal(@CurrentUser() user: AuthUser, @Body(new ZodPipe(personalGoalSchema)) body: z.infer<typeof personalGoalSchema>) {
    return this.progress.addGoal(user.id, body.title);
  }

  @Patch('progress/goals/:id')
  @ApiZodBody(goalUpdateSchema)
  updateGoal(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(goalUpdateSchema)) body: z.infer<typeof goalUpdateSchema>) {
    return this.progress.updateGoal(user.id, id, body);
  }

  @Delete('progress/goals/:id')
  deleteGoal(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.progress.deleteGoal(user.id, id);
  }
}
