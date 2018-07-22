module.exports = () => {
    const smtpSettings = {
        service: 'Gmail',
        auth: {
            type: 'OAuth2',
            user: 'office@cepraa.at',
            clientId: '793025784013-a7ivipqpekko1bifro6kn52rh293dls0.apps.googleusercontent.com',
            clientSecret: 'nddc8RnPeq1uZHnDA9lcI2Uj',
            accessToken: 'ya29.GltCBBjkL7pX0mxSqMQ2Ci7FEOwjAbb81bErnQfklxl7zs8N4xiT-' +
            'HjuOl01mXmKCQMFTbNsRpdGxanWKnfKRldyqvgq9sfwFXDRWOm0OxvSaFUDZVzQ2rmVW9Zl',
            refreshToken: '1/FtGe-kSH4pfWlo9D_wc1KxkDRPPYAsC3ZYoPepFDsA4',
            expires: 1494079154264
        }
    };
    const pusherConfig = {
        appId: '464450',
        key: '9dc09ccbf2cf278d932f',
        secret: '748d9be0da2fad72e4e0',
        host: 'slanger.cepraa.at',
        port: 4567
    };
    return {
        secret: '?D7wPLY2\=z3',
        dbURI: 'mongo:27017/admn',
        dbUser: 'cpraa_admin',
        dbPass: 'bAkMTCsRZxHI29',
        rights: rights,
        PORT: 5000,
        FRONTEND_URL: 'https://test.cepraa.at',
        logPath: '/data1/logs',
        hydraConfig: {
            hydra: {
                serviceName: 'admin-service',
                serviceIP: '',
                servicePort: 0,
                serviceType: '',
                serviceDescription: '',
                redis: {
                    url: 'redis',
                    port: 6379,
                    db: 15
                }
            },
            bodyParser: {
                json: {
                    limit: '15mb'
                }
            }
        },
        smtpSettings: smtpSettings,
        pusherConfig: pusherConfig
    };
};
