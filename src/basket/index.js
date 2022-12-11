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