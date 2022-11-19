import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

export class AwsMicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log('__dirname', __dirname);

    /////////////////////////////////////////////////
    // PRODUCT TABLE
    /////////////////////////////////////////////////
    const productTable = new Table(this, 'product', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING 
      },
      tableName: 'product',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    //////////////////////////////////////////////////
    // PRODUCT FUNCTION PROPERTIES
    //////////////////////////////////////////////////
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk']
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: productTable.tableName
      },
      runtime: Runtime.NODEJS_16_X
    }

    ///////////////////////////////////////////////////////////////////////////
    // PRODUCT FUNCTION
    ///////////////////////////////////////////////////////////////////////////
    const productFuntion = new NodejsFunction(this, 'productLambdaFunction', {
      entry: join(__dirname, '/../src/product/index.js'),
      ...nodeJsFunctionProps,
    });

    ///////////////////////////////////////////////////////////////////////////
    // GRANT READ-WRITE PRIVELEGES TO PRODUCT FUNCTION
    ///////////////////////////////////////////////////////////////////////////
    productTable.grantReadWriteData(productFuntion);
  }
}
