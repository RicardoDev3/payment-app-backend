import { Injectable, Inject } from '@nestjs/common';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Transaction } from '../../../domain/entities/transaction.entity';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository';
import { DYNAMODB_CLIENT } from '../../config/dynamodb.config';
import { TABLE_NAMES } from '../../config/table-names';
import { TransactionStatus, PaymentMethod } from '../../../shared/types';

@Injectable()
export class DynamoDBTransactionRepository implements TransactionRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT)
    private readonly dynamoDBClient: DynamoDBDocumentClient,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const command = new GetCommand({
      TableName: TABLE_NAMES.TRANSACTIONS,
      Key: { id },
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Item) {
      return null;
    }

    return this.toDomain(result.Item);
  }

  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    const command = new ScanCommand({
      TableName: TABLE_NAMES.TRANSACTIONS,
      FilterExpression: 'customerId = :customerId',
      ExpressionAttributeValues: {
        ':customerId': customerId,
      },
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => this.toDomain(item));
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const item = this.toPersistence(transaction);

    const command = new PutCommand({
      TableName: TABLE_NAMES.TRANSACTIONS,
      Item: item,
    });

    await this.dynamoDBClient.send(command);

    return transaction;
  }

  async update(transaction: Transaction): Promise<Transaction> {
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.TRANSACTIONS,
      Key: { id: transaction.id },
      UpdateExpression: 'SET #status = :status, wompiTransactionId = :wompiTransactionId, wompiReference = :wompiReference, paymentResponse = :paymentResponse, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status', // 'status' puede ser palabra reservada
      },
      ExpressionAttributeValues: {
        ':status': transaction.status,
        ':wompiTransactionId': transaction.wompiTransactionId,
        ':wompiReference': transaction.wompiReference,
        ':paymentResponse': transaction.paymentResponse,
        ':updatedAt': transaction.updatedAt.toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.dynamoDBClient.send(command);

    return this.toDomain(result.Attributes);
  }

  private toDomain(item: any): Transaction {
    return new Transaction(
      item.id,
      item.productId,
      item.customerId,
      item.productAmount,
      item.baseFee,
      item.deliveryFee,
      item.totalAmount,
      item.status as TransactionStatus,
      item.paymentMethod as PaymentMethod,
      item.wompiTransactionId || null,
      item.wompiReference || null,
      item.paymentResponse || null,
      new Date(item.createdAt),
      new Date(item.updatedAt),
    );
  }

  private toPersistence(transaction: Transaction): any {
    return {
      id: transaction.id,
      productId: transaction.productId,
      customerId: transaction.customerId,
      productAmount: transaction.productAmount,
      baseFee: transaction.baseFee,
      deliveryFee: transaction.deliveryFee,
      totalAmount: transaction.totalAmount,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      wompiTransactionId: transaction.wompiTransactionId,
      wompiReference: transaction.wompiReference,
      paymentResponse: transaction.paymentResponse,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }
}
