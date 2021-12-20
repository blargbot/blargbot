import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserActivityTypeSubtag } from '@cluster/subtags/user/useractivitytype';
import { ActivityType } from 'discord-api-types';
import moment from 'moment-timezone';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserActivityTypeSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['useractivitytype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
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
                    expected: 'listening',
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
                    expected: 'competing',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Competing
                            }]
                        });
                    }
                },
                {
                    expected: 'custom',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Custom
                            }]
                        });
                    }
                },
                {
                    expected: 'streaming',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Streaming
                            }]
                        });
                    }
                },
                {
                    expected: 'watching',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Watching
                            }]
                        });
                    }
                },
                {
                    expected: ''
                }
            ]
        }),
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['usergametype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
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
                    expected: 'listening',
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
                    expected: 'competing',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Competing
                            }]
                        });
                    }
                },
                {
                    expected: 'custom',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Custom
                            }]
                        });
                    }
                },
                {
                    expected: 'streaming',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Streaming
                            }]
                        });
                    }
                },
                {
                    expected: 'watching',
                    postSetup(member) {
                        member.update({
                            activities: [{
                                created_at: moment().unix(),
                                name: 'Some cool music',
                                type: ActivityType.Watching
                            }]
                        });
                    }
                },
                {
                    expected: ''
                }
            ]
        }),
        {
            code: '{useractivitytype;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 25, end: 31, error: new MarkerError('eval', 25) },
                { start: 32, end: 38, error: new MarkerError('eval', 32) },
                { start: 0, end: 39, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
