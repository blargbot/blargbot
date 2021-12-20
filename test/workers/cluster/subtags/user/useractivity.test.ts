import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserActivitySubtag } from '@cluster/subtags/user/useractivity';
import { ActivityType } from 'discord-api-types';
import moment from 'moment-timezone';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserActivitySubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
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
                                type: ActivityType.Game
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
            ifQuietAndNotFound: '',
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
                                type: ActivityType.Game
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
        {
            code: '{useractivity;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 21, end: 27, error: new MarkerError('eval', 21) },
                { start: 28, end: 34, error: new MarkerError('eval', 28) },
                { start: 0, end: 35, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
