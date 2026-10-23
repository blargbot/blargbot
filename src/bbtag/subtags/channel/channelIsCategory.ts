import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelType } from '../../enums.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';
import type { GetChannelTypeThunk } from './channelType.js';

const tag = templates.subtags.channelIsCategory;

export class ChannelIsCategorySubtag extends CompiledSubtag {
    readonly #getChannelType: GetChannelTypeThunk;
    public constructor({ getChannelType }: { getChannelType: GetChannelTypeThunk; }) {
        super({
            name: 'channelIsCategory',
            aliases: ['isCategory'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [channel, quiet]) => this.queryChannel(ctx, channel.value, quiet.value !== '')

                }
            ]
        });
        this.#getChannelType = getChannelType;
    }

    public async queryChannel(context: BBTagContext, channelStr: string, quiet: boolean): Promise<boolean> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        return channelTypes.has(await this.#getChannelType(context.root.guildId, channelId));
    }
}
const channelTypes = new Set([ChannelType.GUILD_CATEGORY]);
