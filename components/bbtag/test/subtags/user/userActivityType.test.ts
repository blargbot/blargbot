import { randomUUID } from 'node:crypto';

import { Subtag } from '@bbtag/blargbot';
import { UserActivityTypeSubtag } from '@bbtag/blargbot/subtags';
import Discord from 'discord-api-types/v10';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserActivityTypeSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['useractivitytype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'My test game',
                            type: Discord.ActivityType.Playing
                        }];
                    }
                },
                {
                    expected: 'listening',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Listening
                        }];
                    }
                },
                {
                    expected: 'competing',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Competing
                        }];
                    }
                },
                {
                    expected: 'custom',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Custom
                        }];
                    }
                },
                {
                    expected: 'streaming',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Streaming
                        }];
                    }
                },
                {
                    expected: 'watching',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Watching
                        }];
                    }
                },
                {
                    expected: ''
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usergametype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'My test game',
                            type: Discord.ActivityType.Playing
                        }];
                    }
                },
                {
                    expected: 'listening',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Listening
                        }];
                    }
                },
                {
                    expected: 'competing',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Competing
                        }];
                    }
                },
                {
                    expected: 'custom',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Custom
                        }];
                    }
                },
                {
                    expected: 'streaming',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Streaming
                        }];
                    }
                },
                {
                    expected: 'watching',
                    postSetup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.activities = [{
                            id: randomUUID(),
                            created_at: moment().unix(),
                            name: 'Some cool music',
                            type: Discord.ActivityType.Watching
                        }];
                    }
                },
                {
                    expected: ''
                }
            ]
        })
    ]
});
