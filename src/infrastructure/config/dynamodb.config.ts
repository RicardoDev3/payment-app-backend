import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';

export const createDynamoDBClient = (configService?: ConfigService): DynamoDBDocumentClient => {
  const envEndpoint = process.env.DYNAMODB_ENDPOINT;
  const isLocal = !!(configService?.get('DYNAMODB_ENDPOINT') || envEndpoint);

  const config: any = {
    region: configService?.get('AWS_REGION') || process.env.AWS_REGION || 'us-east-1',
  };

  if (isLocal) {
    config.endpoint = configService?.get('DYNAMODB_ENDPOINT') || envEndpoint;
    config.credentials = {
      accessKeyId: configService?.get('AWS_ACCESS_KEY_ID') || process.env.AWS_ACCESS_KEY_ID || 'dummy',
      secretAccessKey: configService?.get('AWS_SECRET_ACCESS_KEY') || process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
    };
  }

  const client = new DynamoDBClient(config);

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
};

export const DYNAMODB_CLIENT = Symbol('DYNAMODB_CLIENT');
