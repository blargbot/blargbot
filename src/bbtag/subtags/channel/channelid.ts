import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `channelid`,
            aliases: [`categoryid`],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: `Returns the ID of the current channel.`,
                    exampleCode: `{channelid}`,
                    exampleOut: `111111111111111`,
                    returns: `id`,
                    execute: (ctx) => this.getChannelId(ctx, ctx.channel.id, true)
                },
                {
                    parameters: [`channel`, `quiet?`],
                    description: `Returns the ID of the given channel. If it cannot be found returns \`No channel found\`, or nothing if \`quiet\` is \`true\`.`,
                    exampleCode: `{channelid;cool channel}\n{channelid;some channel that doesn't exist;true}`,
                    exampleOut: `111111111111111\n(nothing is returned here)`,
                    returns: `id`,
                    execute: (ctx, [channel, quiet]) => this.getChannelId(ctx, channel.value, quiet.value !== ``)

                }
            ]
        });
    }

    public async getChannelId(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? `` : undefined);
        }
        return channel.id;
    }
}
