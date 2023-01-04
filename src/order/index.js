import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { getNodeMajorVersion } from "typescript";
import { ddbClient } from "./ddbClient";

exports.handler = async function(event) {
    console.log("[OrderMicroservice][request]:", JSON.stringify(event, undefined, 2));

    const eventType = event["detail-type"];
    if (eventType !== undefined) {
        await eventBridgeInvocation(event);
    } else {
        return await ApiGatewayInvocation(event);
    }
}

const eventBridgeInvocation = async(event) => {
    await createOrder(event.detail)
}

const createOrder = async(backetCheckoutEvent) => {
    const logSnippet = "[OrderMicroservice][createOrder] =>";
    try {
        const orderDate = new Date().toISOString();
        backetCheckoutEvent.orderDate = orderDate; 
        console.log(`${logSnippet} (backetCheckoutEvent): ${backetCheckoutEvent}`);
    
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(backetCheckoutEvent || {})
        };
    
        const createResult = await ddbClient.send(new PutItemCommand(params));
        console.log(`${logSnippet} (createResult): ${createResult}`);
    
        return createResult;

    } catch (exc) {
        console.log(`${logSnippet} (Exception): ${exc}`);
        throw exc;
    }
}

const ApiGatewayInvocation = async(event) => {
    const logSnippet = "[OrderMicroservice][ApiGatewayInvocation] =>";
    let body;
    try {
        switch(event.httpMethod) {
            case "GET":
                if (event.pathParameters != null) {
                    body = await getOrder(event)
                } else {
                    body = await getAllOrders();
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: `${logSnippet} (Successfully completed operation): ${event.httpMethod}`,
                        body: body
                    })
                };
                console.log(`${logSnippet} (body): ${body}`);
            default:
                throw new Error(`${logSnippet} (Unsupported route): ${event.httpMethod}`);
        }
    } catch (exc) {
        console.log(`${logSnippet} (Exception): ${exc}`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform HttpGet operation in order microservice",
                errorMessage: exc.message,
                errorStack: event.stack
            })
        };
    }
}