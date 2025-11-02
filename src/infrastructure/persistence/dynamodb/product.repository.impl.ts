import { Injectable, Inject } from '@nestjs/common';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Product } from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { DYNAMODB_CLIENT } from '../../config/dynamodb.config';
import { TABLE_NAMES } from '../../config/table-names';

@Injectable()
export class DynamoDBProductRepository implements ProductRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT)
    private readonly dynamoDBClient: DynamoDBDocumentClient,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const command = new GetCommand({
      TableName: TABLE_NAMES.PRODUCTS,
      Key: { id },
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Item) {
      return null;
    }

    return this.toDomain(result.Item);
  }

  async findAll(): Promise<Product[]> {
    const command = new ScanCommand({
      TableName: TABLE_NAMES.PRODUCTS,
    });

    const result = await this.dynamoDBClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => this.toDomain(item));
  }

  async save(product: Product): Promise<Product> {
    const item = this.toPersistence(product);

    const command = new PutCommand({
      TableName: TABLE_NAMES.PRODUCTS,
      Item: item,
    });

    await this.dynamoDBClient.send(command);

    return product;
  }

  async update(product: Product): Promise<Product> {
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.PRODUCTS,
      Key: { id: product.id },
      UpdateExpression: 'SET #name = :name, description = :description, price = :price, stock = :stock, imageUrl = :imageUrl, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':name': product.name,
        ':description': product.description,
        ':price': product.price,
        ':stock': product.stock,
        ':imageUrl': product.imageUrl,
        ':updatedAt': product.updatedAt.toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.dynamoDBClient.send(command);

    return this.toDomain(result.Attributes);
  }

  async delete(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAMES.PRODUCTS,
      Key: { id },
    });

    await this.dynamoDBClient.send(command);
  }

  // Métodos auxiliares para conversión
  private toDomain(item: any): Product {
    return new Product(item.id, item.name, item.description, item.price, item.stock, item.imageUrl, new Date(item.createdAt), new Date(item.updatedAt));
  }

  private toPersistence(product: Product): any {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
