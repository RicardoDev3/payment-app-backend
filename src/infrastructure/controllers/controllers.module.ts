import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { ProductsController } from './products.controller';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [ProductsController, TransactionsController],
})
export class ControllersModule {}
