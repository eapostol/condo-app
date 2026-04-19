import 'reflect-metadata';

import express, { type Express } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import { ReportsNestModule } from './reports.module.js';

let reportsNestAppPromise: Promise<Express> | null = null;

export function createReportsNestApp(): Promise<Express> {
  if (!reportsNestAppPromise) {
    reportsNestAppPromise = (async () => {
      const nestedExpressApp = express();
      const nestApp = await NestFactory.create(
        ReportsNestModule,
        new ExpressAdapter(nestedExpressApp),
        {
          logger: false,
          bodyParser: false,
        },
      );

      await nestApp.init();

      return nestedExpressApp;
    })();
  }

  return reportsNestAppPromise;
}
