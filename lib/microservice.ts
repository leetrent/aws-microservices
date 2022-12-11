import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface SwnMicroservicesProps {
    productTable: ITable;
    basketTable: ITable;
}

export class SwnMicroservices extends Construct {

    public readonly productMicroservice: NodejsFunction;
    public readonly basketMicroservice: NodejsFunction;

    constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
        super(scope, id);

         this.productMicroservice = this.createProductFunction(props.productTable);
         this.basketMicroservice = this.createBasketFunction(props.basketTable);
    }

    private createProductFunction(productTable: ITable) : NodejsFunction {
        //////////////////////////////////////////////////
        // PRODUCT FUNCTION PROPERTIES
        //////////////////////////////////////////////////
        const productFunctionProps: NodejsFunctionProps = {
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
        const productFunction = new NodejsFunction(this, 'productLambdaFunction', {
            entry: join(__dirname, '/../src/product/index.js'),
            ...productFunctionProps,
        });

        ///////////////////////////////////////////////////////////////////////////
        // GRANT READ-WRITE PRIVELEGES TO PRODUCT FUNCTION
        ///////////////////////////////////////////////////////////////////////////
        productTable.grantReadWriteData(productFunction);

        return productFunction;
    }

    private createBasketFunction(basketTable: ITable) : NodejsFunction {
        //////////////////////////////////////////////////
        // BASKET FUNCTION PROPERTIES
        //////////////////////////////////////////////////
        const basketFunctionProps: NodejsFunctionProps = {
            bundling: {
            externalModules: ['aws-sdk']
            },
            environment: {
            PRIMARY_KEY: 'userName',
            DYNAMODB_TABLE_NAME: basketTable.tableName
            },
            runtime: Runtime.NODEJS_16_X
        }
      
        ///////////////////////////////////////////////////////////////////////////
        // BASKET FUNCTION
        ///////////////////////////////////////////////////////////////////////////
        const basketFunction = new NodejsFunction(this, 'baskettLambdaFunction', {
            entry: join(__dirname, '/../src/basket/index.js'),
            ...basketFunctionProps,
        });

        ///////////////////////////////////////////////////////////////////////////
        // GRANT READ-WRITE PRIVELEGES TO PRODUCT FUNCTION
        ///////////////////////////////////////////////////////////////////////////
        basketTable.grantReadWriteData(basketFunction);

        return basketFunction;
    }
}