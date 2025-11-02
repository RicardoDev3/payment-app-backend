import { Injectable, Inject } from '@nestjs/common';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerRepository } from '../../../domain/repositories/customer.repository';
import { DYNAMODB_CLIENT } from '../../config/dynamodb.config';
import { TABLE_NAMES } from '../../config/table-names';

@Injectable()
export class DynamoDBCustomerRepository implements CustomerRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT)
    private readonly dynamoDBClient: DynamoDBDocumentClient,
  ) {}

  async findById(id: string): Promise<Customer | null> {
    const command = new GetCommand({
      TableName: TABLE_NAMES.CUSTOMERS,
      Key: { id },
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Item) {
      return null;
    }

    return this.toDomain(result.Item);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const command = new ScanCommand({
      TableName: TABLE_NAMES.CUSTOMERS,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.toDomain(result.Items[0]);
  }

  async save(customer: Customer): Promise<Customer> {
    const item = this.toPersistence(customer);

    const command = new PutCommand({
      TableName: TABLE_NAMES.CUSTOMERS,
      Item: item,
    });

    await this.dynamoDBClient.send(command);

    return customer;
  }

  async update(customer: Customer): Promise<Customer> {
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.CUSTOMERS,
      Key: { id: customer.id },
      UpdateExpression: 'SET email = :email, fullName = :fullName, phoneNumber = :phoneNumber',
      ExpressionAttributeValues: {
        ':email': customer.email,
        ':fullName': customer.fullName,
        ':phoneNumber': customer.phoneNumber,
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.dynamoDBClient.send(command);

    return this.toDomain(result.Attributes);
  }

  private toDomain(item: any): Customer {
    return new Customer(item.id, item.email, item.fullName, item.phoneNumber, new Date(item.createdAt));
  }

  private toPersistence(customer: Customer): any {
    return {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      createdAt: customer.createdAt.toISOString(),
    };
  }
}
