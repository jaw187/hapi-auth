var Hapi = require('hapi');
var Hawk = require('hawk');
var HapiAuthHawk = require('hapi-auth-hawk');
var Insync = require('insync');
var Wreck = require('wreck');


var internals = {};

internals.credentials = {
    'john': {
        cred: {
            id: 'john',
            key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
            algorithm: 'sha256'
        }
    },
    'jane': {
        cred: {
            id: 'jane',
            key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
            algorithm: 'sha256'
        }
    }
};

internals.createHawkHeader = function hawkHeader (id, url, method) {

    var credential = internals.credentials[id];

    if (!credential || !credential.cred) {
        return '';
    }

    var headerOptions = {
        credentials: credential.cred
    };

    return Hawk.client.header(url, method, headerOptions);
};


var startServer = function startServer (next) {

    var server = new Hapi.Server(8190);

    server.pack.register(HapiAuthHawk, function (err) {

        if (err) {
            return next(err);
        }

        var hawkOptions = {
            getCredentialsFunc: function getCredentials (id, callback) {

                var credential = internals.credentials[id];

                if (!credential || id === 'jane') { // Reject jane explicitly
                    return callback(null, null);
                }

                return callback(null, credential.cred)
            }
        };
        server.auth.strategy('YourHawkAuth', 'hawk', hawkOptions);

        var routes = [
            {
                method: 'GET',
                path: '/',
                config: {
                    auth: 'YourHawkAuth',
                    handler: function hawkAuthHandler (request, reply) {

                        reply('Success');
                    }
                }
            }
        ];
        server.route(routes);

        server.start(function () {

            console.log('Server started ...');
            return next(null, server);
        });
    });
};

var authorizedClient = function connectClient (server, next) {

    var url = "http://localhost:8190/";
    var authHeader = internals.createHawkHeader('john', url, 'GET');

    var options = {
        headers: {
            authorization: authHeader.field
        }
    };

    Wreck.get(url, options, function (err, res) {

        if (err) {
            return next(err);
        }

        if (res.statusCode === 200) {
            console.log('John has been authorized ...');
            return next(null, server);
        }

        console.log('John was not authorized ...');
        return next(null, server);
    });
};

var unauthorizedClient = function connectClient (server, next) {

    var url = "http://localhost:8190/";
    var authHeader = internals.createHawkHeader('jane', url, 'GET');

    var options = {
        headers: {
            authorization: authHeader.field
        }
    };

    Wreck.get(url, options, function (err, res) {

        if (err) {
            return next(err);
        }

        if (res.statusCode === 401) {
            console.log('Jane has not been authorized ...');
            return next(null, server);
        }

        console.log('Jane was authorized ...');
        return next(null, server);
    });
};

Insync.waterfall([
    startServer,
    authorizedClient,
    unauthorizedClient
], function (err, server) {

    if (err) {
        return console.log('Something went wrong... ', err);
    }

    console.log('Fin.');
    server.stop();
});
