import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiGatewayProps {
    productMicroservice: IFunction;
}
export class SwnApiGateway extends Construct {
    constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
        super(scope, id);

        ///////////////////////////////////////////////////////////////////////////
        // PRODUCT API GATEWAY
        ///////////////////////////////////////////////////////////////////////////
        const productApi = new LambdaRestApi(this, "productApi", {
            restApiName: "Product Service",
            handler: props.productMicroservice,
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