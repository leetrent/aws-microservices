exports.handler = async function(event) {
    console.log("event", event);
    console.log("request", JSON.stringify( event, undefined, 2));
    return {
        statusCode: 200,
        headers: {"Content-Type": "text/plain"},
        body: `Hello from Product! You've hit ${event.path}\n`
    };
};