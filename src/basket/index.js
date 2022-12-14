
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Links:
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/index.html#aws-sdkclient-dynamodb
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_util_dynamodb.html
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html
// Notes:
// npm install @aws-sdk/client-dynamodb
// npm install @aws-sdk/util-dynamodb
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
}