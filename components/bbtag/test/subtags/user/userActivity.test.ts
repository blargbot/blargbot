import { UserActivitySubtag } from '@blargbot/bbtag/subtags/user/userActivity';
import { ActivityType } from 'discord-api-types/v9';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

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
                                type: ActivityType.Playing
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
                                type: ActivityType.Listening
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
                                type: ActivityType.Playing
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
                                type: ActivityType.Listening
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
