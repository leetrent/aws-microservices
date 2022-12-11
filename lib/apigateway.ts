import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiGatewayProps {
    productMicroservice: IFunction;
    basketMicroservice: IFunction;
}
export class SwnApiGateway extends Construct {
    constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
        super(scope, id);

        this.createProductApi(props.productMicroservice);
        this.createBasketApi(props.basketMicroservice);
    }

    private createProductApi(productMicroservice: IFunction) {
        ///////////////////////////////////////////////////////////////////////////
        // PRODUCT API GATEWAY
        ///////////////////////////////////////////////////////////////////////////
        const productApi = new LambdaRestApi(this, "productApi", {
            restApiName: "Product Service",
            handler: productMicroservice,
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

    private createBasketApi(basketMicroservice: IFunction) {
        ///////////////////////////////////////////////////////////////////////////
        // BASKET API GATEWAY
        ///////////////////////////////////////////////////////////////////////////
        const basketApi = new LambdaRestApi(this, "basketApi", {
            restApiName: "Basket Service",
            handler: basketMicroservice,
            proxy: false
        });      

        // ROOT NAME: basket
        const basketResource = basketApi.root.addResource("basket");
        // GET /basket
        basketResource.addMethod("GET");
        // POST /basket
        basketResource.addMethod("POST");

        const userBasketResource = basketResource.addResource("{userName}");
        // GET /basket/{userName}
        userBasketResource.addMethod("GET");
        // DELETE /basket/{userName}
        userBasketResource.addMethod("DELETE");

        const basketCheckoutResource = basketResource.addResource("checkout");
        // POST /basket/checkout
        basketCheckoutResource.addMethod("POST");
        // expected request payload : {userName : swn }
    }
}