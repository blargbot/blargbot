import { TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { IsStaffSubtag } from '@cluster/subtags/user/isstaff';
import { Constants } from 'eris';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

const allPermsFalse = Object.fromEntries(Object.keys(Constants.Permissions)
    .filter(k => !k.startsWith('all'))
    .map(k => [k, false] as const));

runSubtagTests({
    subtag: new IsStaffSubtag(),
    cases: [
        {
            title: 'The user is the owner',
            code: '{isstaff}',
            expected: 'true',
            setup(ctx) {
                ctx.message.author = ctx.users.owner;
            }
        },
        {
            title: 'The user has the administrator permission',
            code: '{isstaff}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.administrator.toString();
            }
        },
        ...generateCallerPermissionTests({
            administrator: true,
            banMembers: true,
            kickMembers: true,
            manageChannels: true,
            manageGuild: true,
            manageMessages: true
        }, undefined),
        ...generateCallerPermissionTests({
            administrator: true,
            createInstantInvite: true
        }, '1'),
        ...generateCallerPermissionTests({
            administrator: true,
            createPrivateThreads: true,
            useApplicationCommands: true,
            useSlashCommands: true,
            startEmbeddedActivities: true,
            voiceMoveMembers: true
        }, '620639551488'),
        {
            title: 'The user is the owner',
            code: '{isstaff;Guild owner}',
            expected: 'true'
        },
        {
            title: 'The user is an administrator',
            code: '{isstaff;other user}',
            setup(ctx) {
                ctx.roles.other.permissions = Constants.Permissions.administrator.toString();
            }
        },
        ...generateUserPermissionTests({
            administrator: true,
            banMembers: true,
            kickMembers: true,
            manageChannels: true,
            manageGuild: true,
            manageMessages: true
        }, undefined),
        ...generateUserPermissionTests({
            administrator: true,
            createInstantInvite: true
        }, '1'),
        ...generateUserPermissionTests({
            administrator: true,
            createPrivateThreads: true,
            useApplicationCommands: true,
            useSlashCommands: true,
            startEmbeddedActivities: true,
            voiceMoveMembers: true
        }, '620639551488'),
        {
            code: '{isstaff;unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 22, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.options.rootTagName = 'myCoolTag';
                ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).thenResolve();
            }
        },
        {
            code: '{isstaff;unknown user;}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 23, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.options.rootTagName = 'myCoolTag';
                ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).thenResolve();
            }
        },
        {
            code: '{isstaff;unknown user;q}',
            expected: '',
            errors: [
                { start: 0, end: 24, error: new UserNotFoundError('unknown user').withDisplay('') }
            ]
        },
        {
            code: '{isstaff;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 23, end: 29, error: new MarkerError('eval', 23) },
                { start: 0, end: 30, error: new TooManyArgumentsError(2, 3) }]
        }
    ]
});

function generateCallerPermissionTests(results: Partial<Record<Exclude<keyof Constants['Permissions'], `all${string}`>, boolean>>, staffPerms: string | undefined): SubtagTestCase[] {
    return Object.entries({ ...allPermsFalse, ...results }).flatMap(([key, expected]) => ({
        title: `The user has ${key} permissions, staff perms set to ${staffPerms ?? 'undefined'}`,
        code: '{isstaff}',
        expected: expected.toString(),
        setup(ctx) {
            ctx.roles.command.permissions = Constants.Permissions[key].toString();
            ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'staffperms')).thenResolve(staffPerms);
        }
    }));
}

function generateUserPermissionTests(results: Partial<Record<Exclude<keyof Constants['Permissions'], `all${string}`>, boolean>>, staffPerms: string | undefined): SubtagTestCase[] {
    return Object.entries({ ...allPermsFalse, ...results }).flatMap(([key, expected]) => ({
        title: `The user has ${key} permissions, staff perms set to ${staffPerms ?? 'undefined'}`,
        code: '{isstaff;other user}',
        expected: expected.toString(),
        setup(ctx) {
            ctx.roles.other.permissions = Constants.Permissions[key].toString();
            ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'staffperms')).thenResolve(staffPerms);
        }
    }));
}
