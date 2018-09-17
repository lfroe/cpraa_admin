const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const Config = require('./config'),
    config = Config();
const utils = require('@v3rg1l/microservice-helper').utilService;
const cors = require('cors');
const _ = require('lodash');
const hydraExpress = require('hydra-express');
mongoose.Promise = require('bluebird');
const scheduleEntryController = require('./app/controllers/scheduleEntryController');
const registrationEntryController = require('./app/controllers/registrationEntryController');
const statusController = require('./app/controllers/statusController');

const connectWithRetry = () => {
    mongoose.connect(`mongodb://${encodeURIComponent(config.dbUser)}:${encodeURIComponent(config.dbPass)}@${config.dbURI}`, {
        socketTimeoutMS  : 0,
        connectionTimeout: 0,
        useMongoClient   : true
    }, (err) => {
        if (err) {
            console.log(`failed to connect to ${config.dbURI}`);
            setTimeout(connectWithRetry, 1000);
        }
    });
};
connectWithRetry();

function registerMiddleware() {
    const app = hydraExpress.getExpressApp();
    let requestTimes = {};
    const excludeFromLog = ['password', 'token'];
    app.use(cors({
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-access-token', 'impersonation-token'],
        origin        : '*'
    }));
    app.set('superSecret', config.secret);
    app.use(bodyParser.urlencoded({
        extended: false,
        limit   : '15mb'
    }));
    app.use(bodyParser.json({
        limit: '15mb'
    }));
    app.use(express.static(path.join(__dirname, '/public')));
    // app.use(morgan('dev'));
    // *** for jenkins test
    const logRequest = (req, res, next) => {
        const logger = utils.getLogger('admin-service-info', config.logPath);
        let trackingHeader = _.find(_.keys(req.headers), (hdr) => hdr.toLowerCase() === 'requestid');
        if (trackingHeader) {
            requestTimes[req.headers[trackingHeader]] = new Date().getTime();
            logger.info('--------------------------------------------------');
            logger.info('Got request');
            logger.info(`${'REQUESTID'.padEnd(10)}: ${req.headers[trackingHeader]}`);
            logger.info(`${'URL'.padEnd(10)}: ${req.url.padEnd(10)}`);
            logger.info(`${'METHOD'.padEnd(10)}: ${req.method.padEnd(10)}`);
            let maxKeyLength = 0;
            switch (req.method) {
                case 'GET':
                case 'DELETE':
                    logger.info(`${'PARAMS'.padEnd(10)}:`);
                    _.each(_.keys(req.query), (param) => {
                        if (param.length > maxKeyLength) {
                            maxKeyLength = param.length;
                        }
                    });
                    _.each(_.keys(req.query), (param) => {
                        if (excludeFromLog.indexOf(param) < 0) {
                            if (req.query[param] instanceof Object) {
                                logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.query[param].id}`)
                            } else {
                                logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.query[param]}`)
                            }
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
                        if (excludeFromLog.indexOf(param) < 0) {
                            if (req.body[param] instanceof Object) {
                                logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.body[param].id}`)
                            } else {
                                logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${req.body[param]}`)
                            }
                        }
                    });
                    break;
            }
            logger.info('--------------------------------------------------');
        }
        next()
    };
    const logResponse = (req, res, next) => {
        const logger = utils.getLogger('admin-service-info', config.logPath);
        let trackingHeader = _.find(_.keys(req.headers), (hdr) => hdr.toLowerCase() === 'requestid');
        if (trackingHeader) {
            let oldWrite = res.write,
                oldEnd = res.end;
            let chunks = [];
            res.write = function (chunk) {
                chunks.push(chunk);
                oldWrite.apply(res, arguments);
            };
            res.end = function (chunk) {
                if (chunk) {
                    chunks.push(chunk);
                }
                let trackingHeader = _.find(_.keys(req.headers), (hdr) => hdr.toLowerCase() === 'requestid');
                if (trackingHeader) {
                    let body = Buffer.concat(chunks).toString('utf8');
                    try {
                        logger.info('--------------------------------------------------');
                        logger.info('Got response');
                        logger.info(`${'REQUESTID'.padEnd(10)}: ${req.headers[trackingHeader]}`);
                        logger.info(`${'URL'.padEnd(10)}: ${req.url.padEnd(10)}`);
                        logger.info(`${'METHOD'.padEnd(10)}: ${req.method.padEnd(10)}`);
                        logger.info(`${'TIME'.padEnd(10)}: ${new Date().getTime() - requestTimes[req.headers[trackingHeader]]} ms`)
                        logger.info(`${'BODY'.padEnd(10)}:`);
                        let parsedBody = JSON.parse(body);
                        let maxKeyLength = 0;
                        _.each(_.keys(parsedBody), (param) => {
                            if (param.length > maxKeyLength) {
                                maxKeyLength = param.length;
                            }
                        });
                        _.each(_.keys(parsedBody), (param) => {
                            if (excludeFromLog.indexOf(param) < 0) {
                                if (parsedBody[param] instanceof Array) {
                                    logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${parsedBody[param].length} entries`)
                                } else if (parsedBody[param] instanceof Object) {
                                    logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${parsedBody[param]._id}`)
                                } else {
                                    logger.info(` ${param.padEnd(maxKeyLength + 1)}: ${parsedBody[param]}`)
                                }
                            }
                        });
                    } catch (e) {
                        logger.info(`Unparsable response body ${body}`)
                    }
                    logger.info('--------------------------------------------------');
                }
                oldEnd.apply(res, arguments);
            };
        }
        next()
    };
    app.use(logRequest);
    app.use(logResponse)
}

function onRegisterRoutes() {
    hydraExpress.registerRoutes({
        '/api/scheduleEntries'    : scheduleEntryController,
        '/api/registrationEntries': registrationEntryController,
        '/api/status'             : statusController
    });

}

hydraExpress.init(config.hydraConfig, '', onRegisterRoutes, registerMiddleware).then((serviceInfo) => {
    console.log('serviceInfo', serviceInfo);
}).catch((err) => {
    console.oog('err', err);
});