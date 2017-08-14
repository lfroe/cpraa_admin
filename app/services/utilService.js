const passwordSheriff = require('password-sheriff');
const Config = require('../../config'),
    config = Config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const Handlebars = require('handlebars');

module.exports = {
    guid: () => {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },
    validatePassword: (password) => {
        const passwordPolicy = new passwordSheriff.PasswordPolicy(config.passwordPolicy);
        try {
            passwordPolicy.assert(password);
            return {success: true};
        } catch (e) {
            return {success: false, msg: 'Password does not fulfill password policy'};
        }
    },
    sendMail: (from, to, subject, text, html) => {
        const transporter = nodemailer.createTransport(config.smtpSettings);
        const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            text: text,
            html: html
        };
        transporter.on('log', console.log);
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return console.log(err);
            }
        })
    },
    compileTemplate: (templateName, templateData) => {
        Handlebars.registerHelper('makeLink', (text, options) => {
            text = Handlebars.Utils.escapeExpression(text);
            const url = Handlebars.Utils.escapeExpression(options.hash.link);
            const link = `<a href="${url}" style="padding: 6px 12px;` +
                'background-color: #5bc0de;' +
                'border: 1px solid transparent;' +
                'border-radius: 4px;' +
                'font-size: 14px;' +
                'cursor: pointer;'+
                'text-decoration: none' +
                `color: white">${text}</a>`;
            return new Handlebars.SafeString(link);
        });
        const templateString = fs.readFileSync(path.join(__dirname, '../../public/templates/', templateName + '.hbs')).toString();
        const template = Handlebars.compile(templateString);

        return template(templateData);
    },
    clearFileItems: (tasks) => {
        _.each(tasks, (task) => {
            const fileItems = _.filter(task.content.items, (item) => {
                return (item.type === 'image-container' || item.type === 'audio-container')
            });
            if (fileItems.length > 0) {
                _.each(fileItems, (fileItem) => {
                    fileItem.value.fileSrc = '';
                });
            }
        });
        return tasks;
    },
    getLogger: (logFileName) => {
        const winston = require('winston');
        require('winston-daily-rotate-file');
        return new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({timestamp: true, colorize: true}),
                new (winston.transports.DailyRotateFile)({
                    filename: `${config.logPath}/${logFileName}.log`,
                    json: false,
                    datePattern: 'yyyy-MM-dd-',
                    prepend: true
                })
            ]
        });
    }
};