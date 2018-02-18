module.exports = () => {
    const pusherConfig = {
        appId: '464450',
        key: '9dc09ccbf2cf278d932f',
        secret: '748d9be0da2fad72e4e0',
        host: '78.46.126.136',
        port: 4567,
        encrypted: false
    };
    let config = '';
    const defaultConf = {
        secret        : '?D7wPLY2\=z3',
        dbURI         : 'mongodb://127.0.0.1:27017/admn',
        dbUser        : 'cpraa_admin',
        dbPass        : 'quengetz!*2412',
        rights        : [],
        PORT          : 45031,
        FRONTEND_URL  : 'http://localhost:3001',
        logPath       : '/data1/logs',
        passwordPolicy: {
            length: {
                minLength: 10
            }
        },
        hydraConfig   : {
            hydra     : {
                serviceName       : 'admin-service',
                serviceIP         : '',
                servicePort       : 0,
                serviceType       : '',
                serviceDescription: '',
                redis             : {
                    url : '127.0.0.1',
                    port: 6379,
                    db  : 15
                }
            },
            bodyParser: {
                json: {
                    limit: '100mb'
                }
            }
        },
        smtpSettings  : undefined,
        pusherConfig  : pusherConfig
    };
    try {
        config = require('/data1/conf/admin/config.js');
    } catch (err) {
        config = defaultConf
    }
    return config;
};
