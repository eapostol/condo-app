import { Module } from '@nestjs/common';

import { ReportsNestController } from './reports.controller.js';
import { ReportsNestService } from './reports.service.js';

@Module({
  controllers: [ReportsNestController],
  providers: [ReportsNestService],
})
export class ReportsNestModule {}
