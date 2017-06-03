// =======================
// get the packages we need ============
// =======================
// let express = require('express');
// let app = express();
let bodyParser = require('body-parser');
let morgan = require('morgan');
let mongoose = require('mongoose');

let Config = require('./config'),
    config = Config();
let cors = require('cors');
let jwt = require('jsonwebtoken');
let _ = require('lodash');
let http = require('http');
let fs = require('fs');
let path = require('path');

let hydraExpress = require('hydra-express');
let hydra = hydraExpress.getHydra();

mongoose.Promise = require('bluebird');

let connectWithRetry = function () {
    mongoose.connect(config.dbURI, {
        server: {
            socketOptions: {
                socketTimeoutMS: 0,
                connectionTimeout: 0
            }
        },
        user: config.dbUser,
        pass: config.dbPass
    }, (err) => {
        if (err) {
            console.log(`failed to connect to ${config.dbURI}`);
            setTimeout(connectWithRetry, 1000)
        }
    });
};
connectWithRetry();

function registerMiddleware() {
    let app = hydraExpress.getExpressApp();
    app.use(cors({
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "x-access-token", "refresh_token"],
        origin: '*'
    }));
    const whitelist = ['/api/login/authenticate'];

    app.set('superSecret', config.secret);
    app.use(bodyParser.urlencoded({extended: false, limit: '15mb'}));
    app.use(bodyParser.json({limit: '15mb'}));
    app.use(morgan('dev'));
    app.use(function (req, res, next) {
        if (whitelist.indexOf(req.url) >= 0) {
            next();
        } else {
            let token = req.body.token || req.query.token || req.headers['x-access-token'];
            let requiredRightEntry = _.maxBy(_.filter(config.rights, (right) => {
                return req.url.indexOf(right.url) >= 0
                    && right.methods.indexOf(req.method) >= 0
            }), (r) => {
                return r.url.length
            });
            if (token) {
                jwt.verify(token, req.app.get('superSecret'), function (err, decoded) {
                    if (err) {
                        return res.json({success: false, message: 'Failed to authenticate token.'});
                    } else if (requiredRightEntry) {
                        //******* CHECK USER RIGHTS  */
                        if (requiredRightEntry.adminOnly && !decoded.user.admin) {
                            res.send(401);
                            return;
                        } else {
                            let rights = [];
                            _.each(decoded.user.roles, (role) => {
                                _.each(role.rights, (right) => {
                                    rights.push(right.name);
                                });
                                rights = _.uniq(rights);
                            });
                            if (_.difference(requiredRightEntry.requiredRights, rights).length > 0) {
                                res.send(401);
                                return;
                            }
                        }
                    }
                    req.decoded = decoded;
                    req.body.user = decoded.user;
                    req.body.token = token;
                    next();
                });
            } else {
                return res.status(403).send({
                    success: false,
                    message: 'No token provided.'
                });

            }
        }
    });
}

function onRegisterRoutes() {
    const scheduleEntryController = require('./app/controllers/scheduleEntryController');
    hydraExpress.registerRoutes({
        '/api/scheduleEntries': scheduleEntryController
    });

}
hydraExpress.init(config.hydraConfig, '', onRegisterRoutes, registerMiddleware).then((serviceInfo) => {
    console.log('serviceInfo', serviceInfo);
})
    .catch((err) => {
        console.log('err', err);
    });



