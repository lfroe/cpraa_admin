// =======================
// get the packages we need ============
// =======================
// let express = require('express');
// let app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

let Config = require('./config'),
    config = Config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const http = require('http');
const fs = require('fs');
const path = require('path');

const hydraExpress = require('hydra-express');
const hydra = hydraExpress.getHydra();

const mshelper = require('@v3rg1l/microservice-helper');

mongoose.Promise = require('bluebird');

const connectWithRetry = function () {
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
    const app = hydraExpress.getExpressApp();
    app.use(cors({
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-access-token', 'impersonation-token'],
        origin: '*'
    }));
    const whitelist = ['/api/login/authenticate'];

    app.set('superSecret', config.secret);
    app.use(bodyParser.urlencoded({extended: false, limit: '15mb'}));
    app.use(bodyParser.json({limit: '15mb'}));
    app.use(morgan('dev'));
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



