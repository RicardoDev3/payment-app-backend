import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DYNAMODB_CLIENT, createDynamoDBClient } from '../config/dynamodb.config';
import { PRODUCT_REPOSITORY, CUSTOMER_REPOSITORY, TRANSACTION_REPOSITORY, DELIVERY_REPOSITORY } from '../../domain/repositories';
import { DynamoDBProductRepository } from './dynamodb/product.repository.impl';
import { DynamoDBCustomerRepository } from './dynamodb/customer.repository.impl';
import { DynamoDBTransactionRepository } from './dynamodb/transaction.repository.impl';
import { DynamoDBDeliveryRepository } from './dynamodb/delivery.repository.impl';

@Module({
  providers: [
    // Proveedor del cliente DynamoDB
    {
      provide: DYNAMODB_CLIENT,
      useFactory: (configService: ConfigService) => {
        return createDynamoDBClient(configService);
      },
      inject: [ConfigService],
    },
    // Repositorios
    {
      provide: PRODUCT_REPOSITORY,
      useClass: DynamoDBProductRepository,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: DynamoDBCustomerRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: DynamoDBTransactionRepository,
    },
    {
      provide: DELIVERY_REPOSITORY,
      useClass: DynamoDBDeliveryRepository,
    },
  ],
  exports: [PRODUCT_REPOSITORY, CUSTOMER_REPOSITORY, TRANSACTION_REPOSITORY, DELIVERY_REPOSITORY],
})
export class PersistenceModule {}
