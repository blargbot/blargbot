import { Subtag } from '@blargbot/bbtag';
import { UserAvatarSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserAvatarSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['useravatar', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png',
                    setup(member) {
                        member.id = '12345678912345678';
                        member.avatar = 'a1b2c3';
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a_a1b2c3.gif',
                    setup(member) {
                        member.id = '12345678912345678';
                        member.avatar = 'a_a1b2c3';
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a1b2c3.png',
                    setup(member, ctx) {
                        ctx.guild.id = '87654321987654321';
                        ctx.roles.everyone.id = ctx.guild.id;
                        ctx.channels.command.guild_id = ctx.guild.id;
                        member.id = '12345678912345678';
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.avatar = 'a1b2c3';
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a_a1b2c3.gif',
                    setup(member, ctx) {
                        ctx.guild.id = '87654321987654321';
                        ctx.roles.everyone.id = ctx.guild.id;
                        ctx.channels.command.guild_id = ctx.guild.id;
                        member.id = '12345678912345678';
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.avatar = 'a_a1b2c3';
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/embed/avatars/4.png',
                    setup(member) {
                        member.discriminator = '1234';
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/embed/avatars/2.png',
                    setup(member) {
                        member.discriminator = '1237';
                    }
                }
            ]
        })
    ]
});
