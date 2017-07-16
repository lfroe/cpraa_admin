const passwordSheriff = require('password-sheriff');
const rights = [
    {
        url: '/api/usermanagement/',
        methods: ['GET'],
        requiredRights: ['usermanagement_read']
    },
    {
        url: '/api/usermanagement/',
        methods: ['PUT', 'POST', 'DELETE'],
        requiredRights: ['usermanagement_write']
    },
    {
        url: '/api/usermanagement/user/checkRights',
        methods: ['GET'],
        requiredRights: []
    },
    {
        url: '/api/taskmanagement/',
        methods: ['GET'],
        requiredRights: ['taskmanagement_read']
    },
    {
        url: '/api/taskmanagement/',
        methods: ['PUT', 'POST', 'DELETE'],
        requiredRights: ['taskmanagement_write']
    },
    /** Admin Only URLs */
    {
        url: '/api/rights/',
        methods: ['POST', 'PUT', 'DELETE'],
        adminOnly: true
    },
    {
        url: '/api/domainmanagement',
        methods: ['POST', 'PUT'],
        adminOnly: true
    }

];
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
    appId: '365130',
    key: '7b8730f1572ef2655ca1',
    secret: '02634f7ac7a3ec89d5d0',
    host: '78.46.126.136',
    port: 4567,
    encrypted: false
};

module.exports = () => {
    switch (process.env.NODE_ENV) {
        case 'development':
            return {
                secret: '?D7wPLY2\=z3',
                dbURI: 'mongodb://127.0.0.1:27017/admn',
                dbUser: 'cpraa_admin',
                dbPass: 'quengetz!*2412',
                rights: rights,
                PORT: 45031,
                FRONTEND_URL: 'http://localhost:3001',
                passwordPolicy: {
                    length: {
                        minLength: 10
                    }
                },
                hydraConfig: {
                    hydra: {
                        serviceName: 'admin-service',
                        serviceIP: '',
                        servicePort: 3000,
                        serviceType: '',
                        serviceDescription: '',
                        redis: {
                            url: '127.0.0.1',
                            port: 6379,
                            db: 15
                        }
                    }
                },
                smtpSettings: smtpSettings,
                pusherConfig: pusherConfig
            };
        case 'test':
            return {
                secret: '?D7wPLY2\=z3',
                dbURI: 'mongodb://mongo:27017/admn',
                dbUser: 'cpraa_admin',
                dbPass: 'bAkMTCsRZxHI29',
                rights: rights,
                PORT: 5000,
                FRONTEND_URL: 'https://test.cepraa.at',
                passwordPolicy: {
                    containsAtLeast: {
                        atLeast: 1,
                        expressions: [passwordSheriff.charsets.upperCase, passwordSheriff.charsets.lowerCase,
                            passwordSheriff.charsets.specialCharacters]
                    },
                    length: {
                        minLength: 10
                    }
                },
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
                    }
                },
                smtpSettings: smtpSettings,
                pusherConfig: pusherConfig
            };
        case 'production':
            return {
                secret: ':slHUl?V]d(-$JnW+_&S',
                dbURI: 'mongodb://mongo:27017/admn',
                dbUser: 'cpraa_admin',
                dbPass: 'qI3wOLlhIlu4AMvn',
                rights: rights,
                PORT: 5000,
                FRONTEND_URL: 'https://www.cepraa.at',
                passwordPolicy: {
                    containsAtLeast: {
                        atLeast: 1,
                        expressions: [passwordSheriff.charsets.upperCase, passwordSheriff.charsets.lowerCase,
                            passwordSheriff.charsets.specialCharacters]
                    },
                    length: {
                        minLength: 10
                    }
                },
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
                    }
                },
                smtpSettings: smtpSettings,
                pusherConfig: pusherConfig
            };
        default:
            return {
                secret: '?D7wPLY2\=z3',
                dbURI: 'mongodb://127.0.0.1:27017/admn',
                dbUser: 'cpraa_admin',
                dbPass: 'quengetz!*2412',
                rights: rights,
                PORT: 45031,
                FRONTEND_URL: 'http://localhost:3001',
                passwordPolicy: {
                    length: {
                        minLength: 10
                    }
                },
                hydraConfig: {
                    hydra: {
                        serviceName: 'admin-service',
                        serviceIP: '',
                        servicePort: 0,
                        serviceType: '',
                        serviceDescription: '',
                        redis: {
                            url: '127.0.0.1',
                            port: 6379,
                            db: 15
                        }
                    }
                },
                smtpSettings: smtpSettings,
                pusherConfig: pusherConfig
            };
    }
};