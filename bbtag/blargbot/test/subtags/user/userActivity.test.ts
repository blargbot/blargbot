import { randomUUID } from 'node:crypto';

import { Subtag } from '@bbtag/blargbot';
import { UserActivitySubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserActivitySubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usergame', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'My test game',
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
                    expected: 'Some cool music',
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
                    expected: 'nothing'
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['useractivity', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'My test game',
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
                    expected: 'Some cool music',
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
                    expected: 'nothing'
                }
            ]
        })
    ]
});
