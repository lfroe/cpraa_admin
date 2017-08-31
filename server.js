const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const Config = require('./config'),
      config = Config();
const utils = require('@v3rg1l/microservice-helper').utilService;
const logger = utils.getLogger('admin-service-info', config.logPath);
const cors = require('cors');
const hydraExpress = require('hydra-express');
mongoose.Promise = require('bluebird');
const scheduleEntryController = require('./app/controllers/scheduleEntryController');

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
    app.use(morgan('dev'));
}

function onRegisterRoutes() {
    hydraExpress.registerRoutes({
        '/api/scheduleEntries': scheduleEntryController
    });

}

hydraExpress.init(config.hydraConfig, '', onRegisterRoutes, registerMiddleware).then((serviceInfo) => {
    logger.info('serviceInfo', serviceInfo);
})
    .catch((err) => {
        logger.error('err', err);
    });
