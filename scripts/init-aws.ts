/* eslint-disable @typescript-eslint/no-floating-promises */

import { CreateTableCommand, DynamoDBClient, ListTablesCommand, AttributeDefinition, KeySchemaElement, BillingMode } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Cargar variables de producción
dotenv.config({ path: '.env.prod' });

// Cliente para AWS (sin endpoint local)
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Definición de tablas (igual que local)
const tables = [
  {
    TableName: 'Products',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }] as KeySchemaElement[],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }] as AttributeDefinition[],
    BillingMode: 'PAY_PER_REQUEST' as BillingMode,
  },
  {
    TableName: 'Customers',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }] as KeySchemaElement[],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }] as AttributeDefinition[],
    BillingMode: 'PAY_PER_REQUEST' as BillingMode,
  },
  {
    TableName: 'Transactions',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }] as KeySchemaElement[],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }] as AttributeDefinition[],
    BillingMode: 'PAY_PER_REQUEST' as BillingMode,
  },
  {
    TableName: 'Deliveries',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }] as KeySchemaElement[],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }] as AttributeDefinition[],
    BillingMode: 'PAY_PER_REQUEST' as BillingMode,
  },
];

// Productos de prueba (mismo que local)
const seedProducts = [
  {
    id: uuidv4(),
    name: 'Laptop Gaming Pro',
    description: 'Laptop de alta gama para gaming y diseño. Intel i9, 32GB RAM, RTX 4080, SSD 1TB.',
    price: 4500000,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Smartphone Ultra',
    description: 'Smartphone flagship con cámara de 108MP, 5G, 256GB almacenamiento.',
    price: 2800000,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Auriculares Inalámbricos',
    description: 'Auriculares con cancelación de ruido activa, batería 30h, Bluetooth 5.3.',
    price: 450000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Smartwatch Fitness',
    description: 'Reloj inteligente con monitor cardíaco, GPS, resistente al agua.',
    price: 850000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Tablet Pro 12"',
    description: 'Tablet profesional con stylus incluido, pantalla OLED, 512GB.',
    price: 3200000,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function createTables() {
  console.log('🔍 Checking existing tables in AWS...');
  console.log('📡 Connecting to AWS DynamoDB (us-east-1)');

  try {
    const listTablesCommand = new ListTablesCommand({});
    const existingTables = await client.send(listTablesCommand);
    console.log('📥 Existing tables:', existingTables.TableNames || []);

    for (const table of tables) {
      if (existingTables.TableNames?.includes(table.TableName)) {
        console.log(`✅ Table ${table.TableName} already exists`);
      } else {
        console.log(`📦 Creating table ${table.TableName}...`);
        const command = new CreateTableCommand(table);
        await client.send(command);
        console.log(`✅ Table ${table.TableName} created successfully`);

        // Esperar a que la tabla esté activa
        console.log(`⏳ Waiting for ${table.TableName} to be active...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

async function seedData() {
  console.log('\n🌱 Seeding products to AWS DynamoDB...');

  try {
    for (const product of seedProducts) {
      console.log(`📝 Inserting product: ${product.name}...`);
      const command = new PutCommand({
        TableName: 'Products',
        Item: product,
      });
      await docClient.send(command);
      console.log(`✅ Product "${product.name}" created (ID: ${product.id})`);
    }

    console.log('\n✨ Database initialized successfully!');
    console.log(`📊 Created ${seedProducts.length} products in AWS`);

    console.log('\n📝 Product IDs for testing:');
    seedProducts.forEach((p) => {
      console.log(`  - ${p.name}: ${p.id}`);
    });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

async function init() {
  try {
    console.log('🚀 Starting AWS DynamoDB initialization...\n');
    await createTables();
    await seedData();
    console.log('\n✅ All done!');
    console.log('🌐 Ready to deploy backend to AWS!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing AWS database:', error);
    process.exit(1);
  }
}

init();
