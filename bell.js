// Load modules
var Hapi = require('hapi');
var Bell = require('bell');
var AuthCookie = require('hapi-auth-cookie');


// Handlers
var publicHandler = function (request, reply) {

    reply('Everyone can see this...');
};

var privateHandler = function (request, reply) {

    reply('Welcome ' + request.auth.credentials.name);
};

var login = function (request, reply) {

    if (request.auth.isAuthenticated) {
        request.auth.session.set({
            name: request.auth.credentials.profile.displayName
        });
        return reply('Logged in...');
    }

    reply('Not logged in...');
}

var logout = function (request, reply) {

    request.auth.session.clear();
    reply('Logged out...');
}

// Create server
var server = new Hapi.Server();
server.connection({ port: 8189 });

// Load plugins
server.register([AuthCookie, Bell], function (err) {

    // Configure cookie auth scheme
    var authCookieOptions = {
        password: 'PasswordUsedToEncryptCookie',
        cookie: 'NameOfCookie',
        redirectTo: '/login',
        isSecure: false
    };

    server.auth.strategy('YourCookieAuth', 'cookie', authCookieOptions);

    // Configure third party auth scheme
    var bellAuthOptions = {
        provider: 'github',
        password: 'PasswordUsedToEncryptThirdPartyAuthCookie',
        clientId: '9be920982e25e4dea143',//'YourAppId',
        clientSecret: '96fb20b27af508d15302cc485638d15d7646e614',//'YourAppSecret',
        isSecure: false
    };

    server.auth.strategy('YourThirdPartyAuth', 'bell', bellAuthOptions);

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
            auth: 'YourCookieAuth'
        }
    });

    // Login page
    server.route({
        method: 'GET',
        path: '/login',
        handler: login,
        config: {
            auth: 'YourThirdPartyAuth'
        }
    });

    // Logout
    server.route({
        method: 'GET',
        path: '/logout',
        handler: logout,
        config: {
            auth: 'YourCookieAuth'
        }
    });

    // Start server
    server.start(function () { console.log('Started...'); });
});
