import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
import { SwnDatabase } from './database';

export class AwsMicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log('__dirname', __dirname);

    const database = new SwnDatabase(this, "Database");

    /////////////////////////////////////////////////
    // PRODUCT TABLE
    /////////////////////////////////////////////////
    // const productTable = new Table(this, 'product', {
    //   partitionKey: {
    //     name: 'id',
    //     type: AttributeType.STRING 
    //   },
    //   tableName: 'product',
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   billingMode: BillingMode.PAY_PER_REQUEST
    // });

    //////////////////////////////////////////////////
    // PRODUCT FUNCTION PROPERTIES
    //////////////////////////////////////////////////
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk']
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: database.productTable.tableName
      },
      runtime: Runtime.NODEJS_16_X
    }

    ///////////////////////////////////////////////////////////////////////////
    // PRODUCT FUNCTION
    ///////////////////////////////////////////////////////////////////////////
    const productFunction = new NodejsFunction(this, 'productLambdaFunction', {
      entry: join(__dirname, '/../src/product/index.js'),
      ...nodeJsFunctionProps,
    });

    ///////////////////////////////////////////////////////////////////////////
    // GRANT READ-WRITE PRIVELEGES TO PRODUCT FUNCTION
    ///////////////////////////////////////////////////////////////////////////
    database.productTable.grantReadWriteData(productFunction);

    ///////////////////////////////////////////////////////////////////////////
    // PRODUCT API GATEWAY
    ///////////////////////////////////////////////////////////////////////////
    const productApi = new LambdaRestApi(this, "productApi", {
      restApiName: "Product Service",
      handler: productFunction,
      proxy: false
    });

    // ROOT NAME: product
    const productResource = productApi.root.addResource("product");
    // GET /product
    productResource.addMethod("GET");
    // POST /product
    productResource.addMethod("POST");
    
    // /product/{id}
    const productUsingId = productResource.addResource("{id}");
    // GET /product/{id}
    productUsingId.addMethod("GET");
    // PUT /product/{id}
    productUsingId.addMethod("PUT");
    // DELETE /product/{id}
    productUsingId.addMethod("DELETE");

  }
}
