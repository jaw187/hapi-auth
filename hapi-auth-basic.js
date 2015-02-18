// Load modules
var Hapi = require('hapi');
var Basic = require('hapi-auth-basic');

// User database
var users = {
    leet: {
        password: 'haxor',
        name: 'Leet Haxor'
    }
};

// Function used to validate a user
var validate = function (username, password, callback) {

    var user = users[username];
    var isValid = user && user.password === password;
    var credentials = { name: user.name } // Will be accessible in request.auth.credentials

    return callback(null, isValid, credentials);
};

// Handlers
var publicHandler = function (request, reply) {
console.log(request.route)
    reply('Everyone can see this...');
};

var privateHandler = function (request, reply) {

    reply('Welcome ' + request.auth.credentials.name);
};

// Create server
var server = new Hapi.Server();
server.connection({ port: 8187 });

// Load plugins
server.register(Basic, function (err) {

    // Configure auth scheme
    var authOptions = {
        validateFunc: validate
    };
    server.auth.strategy('YourSimpleAuth', 'basic', authOptions);

    // Configure routes after plugins are loaded
    server.route({
        method: 'GET',
        path: '/public',
        handler: publicHandler
    });

    // Configure protected routes by setting auth
    server.route({
        method: 'GET',
        path: '/private',
        handler: privateHandler,
        config: {
            auth: 'YourSimpleAuth'
        }
    });

    // Start server
    server.start(function () { console.log('Started...'); });
});
