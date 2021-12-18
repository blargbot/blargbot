import { Subtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { APIGuildMember } from 'discord-api-types';

import { argument } from '../../../../mock';
import { runSubtagTests, SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

export function runGetUserPropTests(subtag: Subtag, testCases: GetUserPropTestCase[], ifQuietAndNotFound = ''): void {
    runSubtagTests({
        subtag: subtag,
        cases: [
            ...testCases.map<SubtagTestCase>(c => ({
                code: `{${subtag.name}}`,
                expected: c.expected,
                setup(ctx) {
                    c.setup(ctx.members.command, ctx);
                }
            })),
            ...testCases.map<SubtagTestCase>(c => ({
                code: `{${subtag.name};other user}`,
                expected: c.expected,
                setup(ctx) {
                    c.setup(ctx.members.other, ctx);
                }
            })),
            ...testCases.map<SubtagTestCase>(c => ({
                code: `{${subtag.name};other user;}`,
                expected: c.expected,
                setup(ctx) {
                    c.setup(ctx.members.other, ctx);
                }
            })),
            ...testCases.map<SubtagTestCase>(c => ({
                code: `{${subtag.name};other user;q}`,
                expected: c.expected,
                setup(ctx) {
                    c.setup(ctx.members.other, ctx);
                }
            })),
            {
                code: `{${subtag.name};unknown user}`,
                expected: '`No user found`',
                errors: [
                    { start: 0, end: subtag.name.length + 15, error: new UserNotFoundError('unknown user') }
                ],
                setup(ctx) {
                    ctx.options.rootTagName = 'myCoolTag';
                    ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).thenResolve();
                },
                assert(_, __, ctx) {
                    ctx.discord.verify(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).once();
                }
            },
            {
                code: `{${subtag.name};unknown user;}`,
                expected: '`No user found`',
                errors: [
                    { start: 0, end: subtag.name.length + 16, error: new UserNotFoundError('unknown user') }
                ],
                setup(ctx) {
                    ctx.options.rootTagName = 'myCoolTag';
                    ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).thenResolve();
                },
                assert(_, __, ctx) {
                    ctx.discord.verify(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `myCoolTag`.' }), undefined)).once();
                }
            },
            {
                code: `{${subtag.name};unknown user;q}`,
                expected: ifQuietAndNotFound,
                errors: [
                    { start: 0, end: subtag.name.length + 17, error: new UserNotFoundError('unknown user').withDisplay(ifQuietAndNotFound) }
                ]
            }
        ]
    });
}

interface GetUserPropTestCase {
    expected: string;
    setup(user: RequiredProps<APIGuildMember, 'user'>, context: SubtagTestContext): void;
}
