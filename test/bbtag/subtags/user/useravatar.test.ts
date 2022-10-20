import { UserAvatarSubtag } from '@blargbot/bbtag/subtags/user/useravatar';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserAvatarSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['useravatar', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png?size=512',
                    setup(member, ctx) {
                        member.user.id = '12345678912345678';
                        member.user.avatar = 'a1b2c3';
                        ctx.discordOptions.defaultImageFormat = 'png';
                        ctx.discordOptions.defaultImageSize = 512;
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a_a1b2c3.gif?size=512',
                    setup(member, ctx) {
                        member.user.id = '12345678912345678';
                        member.user.avatar = 'a_a1b2c3';
                        ctx.discordOptions.defaultImageSize = 512;
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a1b2c3.png?size=512',
                    setup(member, ctx) {
                        ctx.guild.id = '87654321987654321';
                        ctx.roles.everyone.id = ctx.guild.id;
                        ctx.channels.command.guild_id = ctx.guild.id;
                        member.user.id = '12345678912345678';
                        member.avatar = 'a1b2c3';
                        ctx.discordOptions.defaultImageFormat = 'png';
                        ctx.discordOptions.defaultImageSize = 512;
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/guilds/87654321987654321/users/12345678912345678/avatars/a_a1b2c3.gif?size=512',
                    setup(member, ctx) {
                        ctx.guild.id = '87654321987654321';
                        ctx.roles.everyone.id = ctx.guild.id;
                        ctx.channels.command.guild_id = ctx.guild.id;
                        member.user.id = '12345678912345678';
                        member.avatar = 'a_a1b2c3';
                        ctx.discordOptions.defaultImageSize = 512;
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/embed/avatars/4.png',
                    setup(member, ctx) {
                        member.user.discriminator = '1234';
                        ctx.discordOptions.defaultImageFormat = 'png';
                    }
                },
                {
                    expected: 'https://cdn.discordapp.com/embed/avatars/2.png',
                    setup(member, ctx) {
                        member.user.discriminator = '1237';
                        ctx.discordOptions.defaultImageFormat = 'png';
                    }
                }
            ]
        })
    ]
});
