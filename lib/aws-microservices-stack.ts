import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SwnApiGateway } from './apigateway';
import { SwnDatabase } from './database';
import { SwnEventBus } from './eventbus';
import { SwnMicroservices } from './microservice';

export class AwsMicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log('__dirname', __dirname);

    const database = new SwnDatabase(this, "Database");

    const microservices = new SwnMicroservices(this, "Microservices", {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable
    });

    const apigateway = new SwnApiGateway(this, "ApiGateway", {
      productMicroservice: microservices.productMicroservice,
      basketMicroservice: microservices.basketMicroservice,
      orderMicroservice: microservices.orderMicroservice
    });

    const eventBus = new SwnEventBus(this, "EventBus", {
      publisherFunction: microservices.basketMicroservice,
      targetFunction: microservices.orderMicroservice
    });

  }
}

/*
Outputs:
AwsMicroservicesStack.ApiGatewaybasketApiEndpointEA878E69 = https://f3129icxya.execute-api.us-east-2.amazonaws.com/prod/
AwsMicroservicesStack.ApiGatewayorderApiEndpointAA9C4874 = https://rapfishbkc.execute-api.us-east-2.amazonaws.com/prod/
AwsMicroservicesStack.ApiGatewayproductApiEndpoint84A1AEAC = https://696rbokxl5.execute-api.us-east-2.amazonaws.com/prod/
Stack ARN:
arn:aws:cloudformation:us-east-2:270788751359:stack/AwsMicroservicesStack/dceef540-839f-11ed-a49c-06b5b3e25280
*/