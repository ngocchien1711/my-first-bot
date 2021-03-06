// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, TurnContext, MessageFactory } = require('botbuilder');
const fetch = require('node-fetch');
const ngocchienId = '29:1BrkZsEMyD_jiNg0Tg-PW7jTJg-3aFhPhQupCyGcir7U';
class MyBot extends ActivityHandler {
    constructor(conversationReferences) {
        super();
        this.conversationReferences = conversationReferences;
        this.onConversationUpdate(async (context, next) => {
            this.addConversationReference(context.activity);
            await next();
        });

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            // await context.sendActivity(JSON.stringify(context.activity.channelData));
            // await context.sendActivity(JSON.stringify(context.activity.channelId));
            // await context.sendActivity(JSON.stringify(context.activity.from));
            let answer = context.activity.text;
            answer = this.removeMentionTag(answer);
            if (answer.includes("chào") || answer.includes("hello") || answer.includes("hi")
            || answer.includes("Chào") || answer.includes("Hello") || answer.includes("Hi")) {
                await context.sendActivity(`Chào ${context.activity.from.name}`);
            }

            if (answer.indexOf('merge') !== -1) {
                if (context.activity.from.id === ngocchienId) {
                    if (answer.indexOf('Đồng ý') !== -1) {
                        let branchName = answer.substring(answer.lastIndexOf(' ') + 1, answer.length);
                        await context.sendActivity(`Dạ vâng, để em merge '${branchName}'`);
                        const res = await fetch("http://13.75.70.159:8688/api/git/merge", {
                            method: 'POST',
                            body: JSON.stringify({
                                source: branchName,
                                target: 'develop'
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        console.log(await res.json());
                    } else {
                        await context.sendActivity(`Yêu cầu merge bị từ chối mất rồi! Anh nào làm thì rebase lại đúng chuẩn nha.`);
                    }
                } else {
                    await context.sendActivity(`Em chỉ nhận lệnh từ @Ngọc Chiến thui, 401 Unauthorized nha anh ${context.activity.from.name}, hé he hè!`);
                }
            }
            // await context.sendActivity(`You said '${ answer }'`);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Xin chào!');
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // await context.sendActivity(`I'm on Dialog`);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    addConversationReference(activity) {
        const conversationReference = TurnContext.getConversationReference(activity);
        this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    }

    removeMentionTag(str) {
        if (str.indexOf('Puka') === 0) {
            var firstSpaceInx = str.indexOf(' ');
            return str.substring(firstSpaceInx + 1, str.length);
        } else {
            return str;
        }
    }
}

module.exports.MyBot = MyBot;
