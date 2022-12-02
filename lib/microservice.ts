import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface SwnMicroservicesProps {
    productTable: ITable;
}

export class SwnMicroservices extends Construct {

    public readonly productMicroservice: NodejsFunction;

    constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
        super(scope, id);

        //////////////////////////////////////////////////
        // PRODUCT FUNCTION PROPERTIES
        //////////////////////////////////////////////////
        const nodeJsFunctionProps: NodejsFunctionProps = {
            bundling: {
            externalModules: ['aws-sdk']
            },
            environment: {
            PRIMARY_KEY: 'id',
            DYNAMODB_TABLE_NAME: props.productTable.tableName
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
        props.productTable.grantReadWriteData(productFunction);

        ///////////////////////////////////////////////////////////////////////////
        // ASSIGN PRODUCT FUNCTION REFERENCE TO productMicroservice class member
        ///////////////////////////////////////////////////////////////////////////
        this.productMicroservice = productFunction;
    }
}