
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Links:
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/index.html#aws-sdkclient-dynamodb
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_util_dynamodb.html
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html
// Notes:
// npm install @aws-sdk/client-dynamodb
// npm install @aws-sdk/util-dynamodb
// npm install @aws-sdk/client-eventbridge
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { GetItemCommand, ScanCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { ebClient } from "./eventBridgeClient";

exports.handler = async function(event) {
    console.log("[basketMicroservice] => (event):", event);
    console.log("[basketMicroservice] => (request):", JSON.stringify( event, undefined, 2));
    console.log("[basketMicroservice] => (event.httpMethod):", event.httpMethod);
    console.log("[basketMicroservice] => (event.pathParameters):", event.pathParameters);

    let body = null;
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.pathParameters != null) {
                    body = await getBasket(event.pathParameters.userName);
                } else {
                    body = await getAllBaskets();
                }
                break;
            case "POST":
                if (event.path == "/basket/checkout") {
                    body = await checkoutBasket(event);
                } else {
                    body = await createBasket(event);
                }                
                break;
            case "DELETE":
                body = await deleteBasket(event.pathParameters.userName);
                break;
            default:
                throw new Error(`Unsupported route: ${event.httpMethod}`);
        }  
        console.log("[basketMicroservice] => (body):", body);  
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully completed ${event.httpMethod} operaton.`,
                body: body
            })
        }   
    } catch (exc) {
        console.log("[basketMicroservice] => (exception):", exc);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation in basket microservice",
                errorMessage: exc.message,
                errorStack: event.stack
            })
        };
    }
};

const getAllBaskets = async() => {
    console.log("[basketMicroservice][getAllBaskets] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        }
        console.log("[basketMicroservice][getAllBaskets] => (params):", params);

        const { Items } = await ddbClient.send(new ScanCommand(params));
        console.log("[basketMicroservice][getAllBaskets] => (Items):", Items);

        return (Items) ? Items.map( (item) => unmarshall(item) ) : {};

    } catch (error) {
        console.log("[basketMicroservice][getAllBaskets] => (error):", error);
        throw error;
    }
}

const getBasket = async(userName) => {
    console.log("[basketMicroservice][getBasket] => (userName):", userName);
    console.log("[basketMicroservice][getBasket] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall( { userName: userName } )
        }
        console.log("[basketMicroservice][getBasket] => (params):", params);

        const { Item } = await ddbClient.send(new GetItemCommand(params));
        console.log("[basketMicroservice][getBasket] => (Item):", Item);

        return {Item} ? unmarshall(Item) : {};       
    } catch (error) {
        console.log("[basketMicroservice][getBasket] => (error):", error);
        throw error;
    }
}

const createBasket = async(event) => {
    console.log("[basketMicroservice][createBasket] => (event):", event);
    console.log("[basketMicroservice][createBasket] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);

    try {
        console.log("[basketMicroservice][createBasket] => (event.body):", event.body);
        const basketRequest = JSON.parse(event.body);
        console.log("[basketMicroservice][createBasket] => (basketRequest):", basketRequest);

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall( basketRequest || {} )
        }
        console.log("[basketMicroservice][createBasket] => (params):", params);

        const createResult = await ddbClient.send(new PutItemCommand(params));
        console.log("[basketMicroservice][createBasket] => (createResult):", createResult);

        return createResult;

    } catch (error) {
		console.log("[basketMicroservice][createBasket] => (error):", error);
        throw error;
    }
}

const deleteBasket = async(userName) => {
    console.log("[basketMicroservice][deleteBasket] => (userName):", userName);
    console.log("[basketMicroservice][deleteBasket] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);  

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall( { userName: userName } )
        }
        console.log("[basketMicroservice][deleteBasket] => (params):", params);

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
        console.log("[basketMicroservice][deleteBasket] => (deleteResult):", deleteResult);

        return deleteResult;

    } catch (error) {
		console.log("[basketMicroservice][deleteBasket] => (error):", error);
        throw error;
    }
}
 
const checkoutBasket = async(event) => {
    const logSnippet = "[basketMicroservice][checkoutBasket] =>";
    console.log(`${logSnippet} (event): ${event}`);

    // 1. Get existing backet with items
    // 2. Create an even json object with basket items
    // 3. Publish event to eventbridge
    // 4. Remove basket

    const checkoutRequest = JSON.parse(event.body);
    if ( checkoutRequest == null) {
        throw new Error("Checkout request payload not provided.");
    }

    if ( checkoutRequest.userName == null) {
        throw new Error("User name not provided.");
    }

    // 1. Get existing backet with items
    const backet = await getBasket(checkoutRequest.userName)

    // 2. Create an even json object with basket items
    let checkoutPayload = prepareOrderPayload(checkoutRequest, basket);

    // 3. Publish event to eventbridge
    const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);

    // 4. Remove basket
    await deleteBasket(checkoutRequest.userName);
}

const prepareOrderPayload = (checkoutRequest, basket) => {
    const logSnippet = "[basketMicroservice][prepareOrderPayload] =>";
 
    if (basket == null || basket.items == null) {
        throw new Error(console.log(`${logSnippet} Basket is NULL - cannot continue.`));
    }

    console.log(`${logSnippet} (basket): ${basket}`)

    try {
        ////////////////////////////////////////////////////////////////////
        // CALCULATE TOTAL PRICE
        ////////////////////////////////////////////////////////////////////
        let totalPrice = 0;
        //basket.items.forEach(item => totalPrice = totalPrice + item.price);
        basket.items.forEach(item => totalPrice += item.price);
        checkoutRequest.totalPrice = totalPrice;
        console.log(`${logSnippet} (checkoutRequest): ${checkoutRequest}`);

        ////////////////////////////////////////////////////////////////////
        // COPY ALL basket PROPERTIES IN checkoutRequest OBJECT
        ////////////////////////////////////////////////////////////////////
        Object.assign(checkoutRequest, basket);
        console.log(`${logSnippet} (checkoutRequest): ${checkoutRequest}`)

        return checkoutRequest;

    } catch(exc) {
        console.log(`${logSnippet} (exc): ${exc}`)
        throw exc;
    }
}

const publishCheckoutBasketEvent = async (checkoutPayload) => {
    const logSnippet = "[basketMicroservice][publishCheckoutBasketEvent] =>";
    console.log(`${logSnippet} (checkoutPayload): ${checkoutPayload}`)

    try {
        const params = {
            Entries: [
                {
                    Source: process.env.EVENT_SOURCE,
                    Detail: JSON.stringify(checkoutPayload),
                    DetailType: process.env.EVENT_DETAILTYPE,
                    Resources: [],
                    EventBusName: process.env.EVENT_BUSNAME
                },
            ],
        };

        const data = await ebClient.send(new PutEventsCommand(params));
        console.log(`${logSnippet} (data): ${data}`);
        return data;

    } catch(esc) {
        console.log(`${logSnippet} (exc): ${exc}`)
        throw exc;       
    }
}



