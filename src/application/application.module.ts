import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { ExternalModule } from '../infrastructure/external/external.module';
import { CreateTransactionUseCase, ProcessPaymentUseCase, GetProductsUseCase, GetProductByIdUseCase, GetTransactionUseCase } from './use-cases';

@Module({
  imports: [PersistenceModule, ExternalModule],
  providers: [CreateTransactionUseCase, ProcessPaymentUseCase, GetProductsUseCase, GetProductByIdUseCase, GetTransactionUseCase],
  exports: [CreateTransactionUseCase, ProcessPaymentUseCase, GetProductsUseCase, GetProductByIdUseCase, GetTransactionUseCase],
})
export class ApplicationModule {}
