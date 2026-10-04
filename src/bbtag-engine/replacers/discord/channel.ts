import { BBTagRuntimeError } from '../../BBTagRuntimeError.js';
import { defineReplacer } from '../../defineReplacer.js';
import { ChannelNotFoundError } from './errors.js';
import type { GuildChannelCategoryLocals, GuildChannelListLocals } from './locals.js';
import { isQuiet } from './util.js';

export const channelCategoriesReplacer = defineReplacer<GuildChannelListLocals>(['channelCategories', 'categories'], {
    parameters: [],
    returns: 'id[]',
    execute: async function channelCategories(ctx) {
        return await ctx.locals.discord.listChannels(4);
    }
});
export const channelCategoryReplacer = defineReplacer<GuildChannelCategoryLocals>(['channelCategory', 'category'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'id',
    execute: async function channelCategory(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: ChannelNotFoundError.withQuiet(quiet, '') });
        const parentId = await ctx.locals.discord.getChannelCategory(channelId);
        if (parentId === null)
            throw new (BBTagRuntimeError.withDisplay(''))('Channel has no parent');
        return parentId;
    }
});
