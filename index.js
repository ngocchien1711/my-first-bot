// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, MessageFactory } = require('botbuilder');
const builder = require('botbuilder');
const _ = require('lodash');

// This bot's main dialog.
const { MyBot } = require('./bot');

// Import required bot configuration.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.queryParser({
    mapParams:true
}));
server.use(restify.plugins.bodyParser({
    mapParams:true
}));
server.use(restify.plugins.acceptParser(server.acceptable));

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open the emulator select "Open Bot"`);
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
    await context.sendActivity(error);
};

// Create the main dialog.
const conversationReferences = {};
const myBot = new MyBot(conversationReferences);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.run(context);
    });
});

server.post('/api/merge/request', async (req, res) => {
    for (let conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversation(conversationReference, async turnContext => {
            var question = MessageFactory.suggestedActions([`Đồng ý merge ${_.get(req.params, 'object_attributes.source_branch')}`, `Từ chối`], `@Ngọc Chiến: ${_.get(req.params, 'user.username')} yêu cầu merge nhánh '${_.get(req.params, 'object_attributes.source_branch')}'.`);
            await turnContext.sendActivity(question);
        });
    }
    sendConfirm(res, `Merge request have been sent.`)
});

server.post('/api/merge/done', async (req, res) => {
    for (let conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversation(conversationReference, async turnContext => {
            await turnContext.sendActivity(`Đã merge '${_.get(req.params, 'object_attributes.source_branch')}' xong. Kích hoạt build apps tự động lên 192.168.0.40`);
        });
    }
    sendConfirm(res, `Merge done have been sent.`);
});

server.post('/api/build/done', async (req, res) => {
    for (let conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversation(conversationReference, async turnContext => {
            if (_.get(req.params, 'status') === 'Success') {
                await turnContext.sendActivity(`Build thành công tại commit ${_.get(req.params,'object_attributes.last_commit.message')}`);
            } else {
                await turnContext.sendActivity(`Build không thành công tại commit ${_.get(req.params,'object_attributes.last_commit.message')}. Vui lòng kiểm tra lại!`);
            }
        });
    }
    sendConfirm(res, `Build done have been sent.`);
});


function sendConfirm(res, msg) {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write(`<html><body><h1>${msg}</h1></body></html>`);
    res.end();
}