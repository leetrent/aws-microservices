import { PutItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";

// exports.handler = async function(event) {
//     console.log("[OrderMicroservice][request]:", JSON.stringify(event, undefined, 2));

//     const eventType = event["detail-type"];
//     if (eventType !== undefined) {
//         await eventBridgeInvocation(event);
//     } else {
//         return await ApiGatewayInvocation(event);
//     }
// }

exports.handler = async function(event) {
    console.log("[OrderMicroservice][handler] => (event): ", JSON.stringify(event, undefined, 2));

    if (event.Records != null) {
        await sqsInvocation(event);
    } else if (event["detail-type"] !== undefined) {
        await eventBridgeInvocation(event);
    } else {
        return await ApiGatewayInvocation(event);
    }
} 

const sqsInvocation = async(event) => {
    const logSnippet = "[OrderMicroservice][sqsInvocation] =>";
    console.log(`${logSnippet} (event): ${event}`);
    console.log(`${logSnippet} (event.Records): ${event.Records}`);

    try {
        event.Records.forEach(async (record) => {
            console.log(`${logSnippet} (record): ${record}`);
            const checkoutEventRequest = JSON.parse(record.body);
            await createOrder(checkoutEventRequest.detail);
        });
    } catch (exc) {
        console.log(`${logSnippet} (Exception): ${exc}`);
        throw exc;
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

const getOrder = async(event) => {
    const logSnippet = "[OrderMicroservice][getOrder] =>";

    try {
        const userName = event.pathParameters.userName;
        const orderDate = event.queryStringParameters.orderDate;   
        console.log(`${logSnippet} (userName).: ${userName}`);
        console.log(`${logSnippet} (orderDate): ${orderDate}`);
    
        const params = {
            KeyConditionExpression: "userName = :userName and orderDate = :orderDate",
            ExpressionAttributeValues: {
                ":userName": {S: userName },
                ":orderDate": { S: orderDate }
            },
            TableName: process.env.DYNAMODB_TABLE_NAME
        };
        console.log(`${logSnippet} (params): ${params}`);
    
        const { Items } = await ddbClient.send(new QueryCommand(params)); 
        console.log(`${logSnippet} (Returned items): ${Items}`);

        return Items.map( (item) => unmarshall(item) );

    } catch(exc) {
        console.log(`${logSnippet} (Exception): ${exc}`);
        throw exc;
    }
}

const getAllOrders = async() => {
    const logSnippet = "[OrderMicroservice][getAllOrders] =>";

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        };
        console.log(`${logSnippet} (params): ${params}`);

        const { Items } = await ddbClient.send( new ScanCommand(params));
        console.log(`${logSnippet} (Returned items): ${Items}`);

        return (Items) ? Items.map( (item) => unmarshall(item) ) : {};

    } catch(exc) {
        console.log(`${logSnippet} (Exception): ${exc}`);
        throw exc;
    }
}