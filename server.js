const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const Config = require('./config'),
      config = Config();
const utils = require('@v3rg1l/microservice-helper').utilService;
const logger = utils.getLogger('admin-service-info', config.logPath);
const cors = require('cors');
const _ = require('lodash');
const hydraExpress = require('hydra-express');
mongoose.Promise = require('bluebird');
const scheduleEntryController = require('./app/controllers/scheduleEntryController');
const registrationEntryController = require('./app/controllers/registrationEntryController');

const connectWithRetry = () => {
    mongoose.connect(config.dbURI, {
        server: {
            socketOptions: {
                socketTimeoutMS  : 0,
                connectionTimeout: 0
            }
        },
        user  : config.dbUser,
        pass  : config.dbPass
    }, (err) => {
        if (err) {
            logger.error(`failed to connect to ${config.dbURI}`);
            setTimeout(connectWithRetry, 1000);
        }
    });
};
connectWithRetry();

function registerMiddleware() {
    const app = hydraExpress.getExpressApp();
    app.use(cors({
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-access-token', 'impersonation-token'],
        origin        : '*'
    }));
    app.set('superSecret', config.secret);
    app.use(bodyParser.urlencoded({extended: false, limit: '15mb'}));
    app.use(bodyParser.json({limit: '15mb'}));
    app.use(express.static(path.join(__dirname, '/public')));
    // app.use(morgan('dev'));
    app.use( function (req, res, next) {
        let trackingHeader = _.find(_.keys(req.headers), (hdr) => {
            return hdr.toLowerCase() === 'requestid'
        });
        if (trackingHeader) {
            logger.info('--------------------------------------------------');
            logger.info('Got request');
            logger.info(`${'REQUESTID'.padEnd(10)}: ${req.headers[trackingHeader]}`);
            logger.info(`${'URL'.padEnd(10)}: ${req.url.padEnd(10)}`);
            logger.info(`${'METHOD'.padEnd(10)}: ${req.method.padEnd(10)}`);
            let maxKeyLength = 0;
            switch (req.method) {
                case 'GET':
                case 'DELETE':
                    logger.info('PARAMS:');
                    _.each(_.keys(req.query), (param) => {
                        if (param.length > maxKeyLength) {
                            maxKeyLength = param.length;
                        }
                    });
                    _.each(_.keys(req.query), (param) => {
                        if (req.query[param] instanceof Object) {
                            logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.query[param].id}`)
                        } else {
                            logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.query[param]}`)
                        }
                    });
                    break;
                case 'POST':
                case 'PUT':
                    logger.info('BODY:\n');
                    _.each(_.keys(req.body), (param) => {
                        if (param.length > maxKeyLength) {
                            maxKeyLength = param.length;
                        }
                    });
                    _.each(_.keys(req.body), (param) => {
                        if (req.body[param] instanceof Object) {
                            logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.body[param].id}`)
                        } else {
                            logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.body[param]}`)
                        }
                    });
                    break;
            }
            logger.info('--------------------------------------------------');
        }
        next()
    })
}

function onRegisterRoutes() {
    hydraExpress.registerRoutes({
        '/api/scheduleEntries': scheduleEntryController,
        '/api/registrationEntries': registrationEntryController
    });

}

hydraExpress.init(config.hydraConfig, '', onRegisterRoutes, registerMiddleware).then((serviceInfo) => {
    logger.info('serviceInfo', serviceInfo);
}).catch((err) => {
    logger.error('err', err);
});
