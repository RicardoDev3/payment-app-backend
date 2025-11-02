import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WompiClient } from './wompi/wompi.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [WompiClient],
  exports: [WompiClient],
})
export class ExternalModule {}
