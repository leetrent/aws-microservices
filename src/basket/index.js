
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

    return {
        statusCode: 200,
        headers: {"Content-Type": "text/plain"},
        body: `[basketMicroservice] => (event.path): ${event.path}\n`
    };
}