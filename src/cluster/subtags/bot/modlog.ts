import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { UserNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class ModlogSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'modlog',
            category: SubtagType.BOT,
            desc: 'If `moderator` is not provided or left empty, it will default to blargbot.',
            definition: [
                {
                    parameters: ['action', 'user', 'moderator?', 'reason?', 'color?'],
                    description: 'Creates a custom modlog entry with the given `action` and `user` with `reason`. ' +
                        '`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. .',
                    exampleCode: 'You did a bad! {modlog;Bad;{userid};;They did a bad;#ffffff}',
                    exampleOut: 'You did a bad! (modlog entry with white embed colour and reason \'They did a bad!\'',
                    returns: 'nothing',
                    execute: (ctx, [action, user, moderator, reason, color]) => this.createModlog(ctx, action.value, user.value, moderator.value, reason.value, color.value)
                }
            ]
        });
    }

    public async createModlog(
        context: BBTagContext,
        action: string,
        userStr: string,
        modStr: string,
        reason: string,
        colorStr: string
    ): Promise<void> {
        const user = await context.queryUser(userStr);
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        const color = parse.color(colorStr);

        //TODO no user found for this?
        const mod = await context.queryUser(modStr) ?? context.user;

        await context.util.cluster.moderation.modLog.logCustom(context.guild, action, user, mod, reason, color);
    }
}
