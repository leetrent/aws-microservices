import { GetItemCommand, ScanCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {ddbClient} from "./ddbClient";
import {v4 as uuidv4} from 'uuid';

exports.handler = async function(event) {
    console.log("[productMicroservice] => (event):", event);
    console.log("[productMicroservice] => (request):", JSON.stringify( event, undefined, 2));
    console.log("[productMicroservice] => (event.httpMethod):", event.httpMethod);
    console.log("[productMicroservice] => (event.pathParameters):", event.pathParameters);

    let body = null;
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.queryStringParameters != null) {
                    body = await getProductsByCategory(event);
                }
                else if (event.pathParameters != null) {
                    body = await getProduct(event.pathParameters.id);
                } else {
                    body = await getAllProducts();
                }
                break;
            case "POST":
                body = await createProduct(event);
                break;
            case "DELETE":
                body = await deleteProduct(event.pathParameters.id);
                break;
            case "PUT":
                body = await updateProduct(event);
                break;
            default:
                throw new Error(`Unsupported route: ${event.httpMethod}`);
        }  
        console.log("[productMicroservice] => (body):", body);  
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully completed ${event.httpMethod} operaton.`,
                body: body
            })
        }   
    } catch (exc) {
        console.log("[productMicroservice] => (exception):", exc);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation in product microservice",
                errorMessage: exc.message,
                errorStack: event.stack
            })
        };
    }
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

const getAllProducts = async() => {
    console.log("[getAllProducts] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        }
        console.log("[getAllProducts] => (params):", params);

        const { Items } = await ddbClient.send(new ScanCommand(params));
        console.log("[getProduct] => (Items):", Items);

        return (Items) ? Items.map( (item) => unmarshall(item) ) : {};

    } catch (error) {
        console.error(error)
        throw error;
    }
}

const createProduct = async(event) => {
    console.log("[createProduct] => (event):", event);
    console.log("[createProduct] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);

    try {
        console.log("[createProduct] => (event.body):", event.body);
        const productRequest = JSON.parse(event.body);
        console.log("[createProduct] => (productRequest):", productRequest);

        const productId = uuidv4();
        console.log("[createProduct] => (productId):", productId);
        productRequest.id = productId;
        console.log("[createProduct] => (productRequest.id):", productRequest.id );

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall( productRequest || {} )
        }
        console.log("[createProduct] => (params):", params);

        const createResult = await ddbClient.send(new PutItemCommand(params));
        console.log("[createProduct] => (createResult):", createResult);

        return createResult;

    } catch (error) {
        console.error(error)
        throw error;
    }
}

const deleteProduct = async(productId) => {
    console.log("[deleteProduct] => (productId):", productId);
    console.log("[deleteProduct] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME);  

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall( { id: productId } )
        }
        console.log("[deleteProduct] => (params):", params);

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
        console.log("[deleteProduct] => (deleteResult):", deleteResult);

        return deleteResult;

    } catch (error) {
        console.error(error)
        throw error;
    }
}

const updateProduct = async(event) => {
    console.log("[updateProduct] => (productId):", event.pathParameters.id);
    console.log("[updateProduct] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME); 

    try {
        const requestBody = JSON.parse(event.body);
        const objKeys = Object.keys(requestBody);
        console.log("[updateProduct] => (objKeys):", objKeys);

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ id: event.pathParameters.id }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: requestBody[key],
            }), {})),
          };

          const updateResult = await ddbClient.send(new UpdateItemCommand(params));
          console.log("[updateProduct] => (updateResult):", updateResult);

          return updateResult;
    } catch (error) {
        console.error(error)
        throw error;       
    }
}

const getProductsByCategory = async(event) => {
    console.log("[getProductsByCategory] => (process.env.DYNAMODB_TABLE_NAME):", process.env.DYNAMODB_TABLE_NAME); 

    try {
        const productId = event.pathParameters.id;
        const category = event.queryStringParameters.category;
        console.log("[getProductsByCategory] => (productId):", productId); 
        console.log("[getProductsByCategory] => (category):", category); 

        const params = {
            KeyConditionExpression: "id= :productId",
            FilterExpression: "contains (category, :category)",
            ExpressionAttributeValues: {
                ":productId": { $: productId },
                ":category":  { $: category  }
            },
            TableName: process.env.DYNAMODB_TABLE_NAME
        };

        const { Items } = await ddbClient.send(new QueryCommand(params));
        console.log("[getProductsByCategory] => (Items):", Items);

        return (Items) ? Items.map( (item) => unmarshall(item) ) : {};

    } catch (error) {
        console.error(error)
        throw error;          
    }
}