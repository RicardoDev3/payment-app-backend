import { Injectable, Inject } from '@nestjs/common';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Delivery } from '../../../domain/entities/delivery.entity';
import { DeliveryRepository } from '../../../domain/repositories/delivery.repository';
import { DYNAMODB_CLIENT } from '../../config/dynamodb.config';
import { TABLE_NAMES } from '../../config/table-names';

@Injectable()
export class DynamoDBDeliveryRepository implements DeliveryRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT)
    private readonly dynamoDBClient: DynamoDBDocumentClient,
  ) {}

  async findById(id: string): Promise<Delivery | null> {
    const command = new GetCommand({
      TableName: TABLE_NAMES.DELIVERIES,
      Key: { id },
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Item) {
      return null;
    }

    return this.toDomain(result.Item);
  }

  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    const command = new ScanCommand({
      TableName: TABLE_NAMES.DELIVERIES,
      FilterExpression: 'transactionId = :transactionId',
      ExpressionAttributeValues: {
        ':transactionId': transactionId,
      },
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.toDomain(result.Items[0]);
  }

  async findByCustomerId(customerId: string): Promise<Delivery[]> {
    const command = new ScanCommand({
      TableName: TABLE_NAMES.DELIVERIES,
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

  async save(delivery: Delivery): Promise<Delivery> {
    const item = this.toPersistence(delivery);

    const command = new PutCommand({
      TableName: TABLE_NAMES.DELIVERIES,
      Item: item,
    });

    await this.dynamoDBClient.send(command);

    return delivery;
  }

  async update(delivery: Delivery): Promise<Delivery> {
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.DELIVERIES,
      Key: { id: delivery.id },
      UpdateExpression: 'SET address = :address, deliveryNotes = :deliveryNotes, estimatedDeliveryDate = :estimatedDeliveryDate',
      ExpressionAttributeValues: {
        ':address': delivery.address,
        ':deliveryNotes': delivery.deliveryNotes,
        ':estimatedDeliveryDate': delivery.estimatedDeliveryDate.toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.dynamoDBClient.send(command);

    return this.toDomain(result.Attributes);
  }

  private toDomain(item: any): Delivery {
    return new Delivery(item.id, item.transactionId, item.customerId, item.address, item.deliveryNotes, new Date(item.estimatedDeliveryDate), new Date(item.createdAt));
  }

  private toPersistence(delivery: Delivery): any {
    return {
      id: delivery.id,
      transactionId: delivery.transactionId,
      customerId: delivery.customerId,
      address: delivery.address,
      deliveryNotes: delivery.deliveryNotes,
      estimatedDeliveryDate: delivery.estimatedDeliveryDate.toISOString(),
      createdAt: delivery.createdAt.toISOString(),
    };
  }
}
