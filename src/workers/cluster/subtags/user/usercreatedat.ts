import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import moment from 'moment-timezone';

export class UserCreateDatSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'usercreatedat',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns the account creation date of the executing user in `format`.',
                    exampleCode: 'Your account was created on {usercreatedat}',
                    exampleOut: 'Your account was created on 2017-02-06T18:58:10+00:00',
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserCreatedAt(ctx, format.value, ctx.user.id, true)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the account creation date of `user` in `format`. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s account was created on {usercreatedat;;Stupid cat}',
                    exampleOut: 'Stupid cat\'s account was created on 2015-10-13T04:27:26Z',
                    returns: 'string',
                    execute: (ctx, [format, user, quiet]) => this.getUserCreatedAt(ctx, format.value, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserCreatedAt(context: BBTagContext, format: string, userStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userStr, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return moment(user.createdAt).utcOffset(0).format(format);
    }
}
