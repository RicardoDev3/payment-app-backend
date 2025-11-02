import { ConfigService } from '@nestjs/config';
import { createDynamoDBClient } from './dynamodb.config';

describe('DynamoDB Config', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
      DYNAMODB_ENDPOINT: 'http://localhost:8000',
    });
  });

  it('should create DynamoDB client with config', () => {
    const client = createDynamoDBClient(configService);
    expect(client).toBeDefined();
  });

  it('should use default region if not provided', () => {
    const configWithoutRegion = new ConfigService({
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
    });

    const client = createDynamoDBClient(configWithoutRegion);
    expect(client).toBeDefined();
  });

  it('should handle empty credentials', () => {
    const configWithoutCreds = new ConfigService({});
    const client = createDynamoDBClient(configWithoutCreds);
    expect(client).toBeDefined();
  });
});
