import { UserActivityTypeSubtag } from '@blargbot/bbtag/subtags/user/useractivitytype';
import { ActivityType } from 'discord-api-types/v9';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserActivityTypeSubtag(),
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
            quiet: '',
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
                                type: ActivityType.Playing
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
        })
    ]
});
