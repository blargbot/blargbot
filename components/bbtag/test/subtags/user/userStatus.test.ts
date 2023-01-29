import { Subtag } from '@blargbot/bbtag';
import { UserStatusSubtag } from '@blargbot/bbtag/subtags/user/userStatus.js';
import * as Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserStatusSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userstatus', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'dnd',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.status = Discord.PresenceUpdateStatus.DoNotDisturb;
                    }
                },
                {
                    expected: 'idle',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.status = Discord.PresenceUpdateStatus.Idle;
                    }
                },
                {
                    expected: 'offline',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.status = Discord.PresenceUpdateStatus.Offline;
                    }
                },
                {
                    expected: 'online',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.status = Discord.PresenceUpdateStatus.Online;
                    }
                },
                {
                    expected: 'offline',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.status = undefined;
                    }
                }
            ]
        })
    ]
});
