import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";

exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

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

const ApiGatewayInvocation = async(event) => {

}

const createOrder = async(backetCheckoutEvent) => {
    const logSnippet = "[orderMicroservice][createOrder] =>";
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