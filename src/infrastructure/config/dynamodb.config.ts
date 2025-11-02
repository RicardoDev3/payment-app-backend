import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';

export const createDynamoDBClient = (configService: ConfigService): DynamoDBDocumentClient => {
  const client = new DynamoDBClient({
    region: configService.get<string>('AWS_REGION') || 'us-east-1',
    credentials: {
      accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID') || '',
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
    },
    // Para desarrollo local
    endpoint: configService.get<string>('DYNAMODB_ENDPOINT'),
  });

  // DynamoDBDocumentClient facilita el trabajo con objetos JavaScript
  return DynamoDBDocumentClient.from(client);
};

export const DYNAMODB_CLIENT = Symbol('DYNAMODB_CLIENT');
