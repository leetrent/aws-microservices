import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {ddbClient} from "./ddbClient";

exports.handler = async function(event) {
    console.log("event", event);
    console.log("request", JSON.stringify( event, undefined, 2));

    // TODO - Implement switch on event.httpmethod to perform CRUD operations using ddbClient

    console.log("event.httpMethod", event.httpMethod);
    console.log("event.pathParameters", event.pathParameters);

    switch (event.httpMethod) {
        case "GET":
            if (event.pathParameters != null) {
                body = await getProduct(event.pathParameters.id);
            } else {
                body = await getAllProducts();
            }
    }

    return {
        statusCode: 200,
        headers: {"Content-Type": "text/plain"},
        body: `Hello from Product! You've hit ${event.path}\n`
    };
};

const getProduct = async(productId) => {
    console.log("[getProduct] => (productId):", productId);
    console.log("[getProduct] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall( { id: productId } )
        }
        console.log("[getProduct] => (params):", params);

        const { Item } = await ddbClient.send(new GetItemCommand(params));
        console.log("[getProduct] => (Item):", Item);

        return {Item} ? unmarshall(Item) : {};

        
    } catch (error) {
        console.error(error)
        throw error;
    }
}