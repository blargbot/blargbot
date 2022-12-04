import { UserActivitySubtag } from '@blargbot/bbtag/subtags/user/userActivity.js';
import Discord from 'discord-api-types/v9';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: new UserActivitySubtag(),
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
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'My test game',
                                type: Discord.ActivityType.Playing
                            }]
                        });
                    }
                },
                {
                    expected: 'Some cool music',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: Discord.ActivityType.Listening
                            }]
                        });
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
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'My test game',
                                type: Discord.ActivityType.Playing
                            }]
                        });
                    }
                },
                {
                    expected: 'Some cool music',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: Discord.ActivityType.Listening
                            }]
                        });
                    }
                },
                {
                    expected: 'nothing'
                }
            ]
        })
    ]
});
