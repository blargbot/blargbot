import { BBTagRuntimeError } from '@bbtag/engine';
import type { SubtagArgumentReader, SubtagParameter } from '@bbtag/subtag';
import { createParamHelper, defaultMaxSize, OptionalSubtagParameter, RequiredSubtagParameter } from '@bbtag/subtag';

import { ChannelNotFoundError } from '../errors/ChannelNotFoundError.js';
import type { ArrayArgumentReaderOptions } from '../parameters/ArrayArgumentReader.js';
import { ArrayArgumentReader } from '../parameters/ArrayArgumentReader.js';
import type { BigintArgumentReaderOptions } from '../parameters/BigintArgumentReader.js';
import { BigintArgumentReader } from '../parameters/BigintArgumentReader.js';
import type { BooleanArgumentReaderOptions } from '../parameters/BooleanArgumentReader.js';
import { BooleanArgumentReader } from '../parameters/BooleanArgumentReader.js';
import type { FloatArgumentReaderOptions } from '../parameters/FloatArgumentReader.js';
import { FloatArgumentReader } from '../parameters/FloatArgumentReader.js';
import type { IntArgumentReaderOptions } from '../parameters/IntArgumentReader.js';
import { IntArgumentReader } from '../parameters/IntArgumentReader.js';
import type { RegexArgumentReaderOptions } from '../parameters/RegexArgumentReader.js';
import { RegexArgumentReader } from '../parameters/RegexArgumentReader.js';
import type { Channel } from '../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../plugins/ChannelPlugin.js';
import { QuietPlugin } from '../plugins/QuietPlugin.js';

export const p = createParamHelper({
    bigint: (name: string, options?: Partial<BigintArgumentReaderOptions>) => new RequiredSubtagParameter(new BigintArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    int: (name: string, options?: Partial<IntArgumentReaderOptions>) => new RequiredSubtagParameter(new IntArgumentReader(name, {
        maxSize: defaultMaxSize,
        radix: 10,
        ...options
    })),
    float: (name: string, options?: Partial<FloatArgumentReaderOptions>) => new RequiredSubtagParameter(new FloatArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    boolean: (name: string, options?: Partial<BooleanArgumentReaderOptions>) => new RequiredSubtagParameter(new BooleanArgumentReader(name, {
        maxSize: defaultMaxSize,
        allowNumbers: true,
        ...options
    })),
    regex: (name: string, options?: Partial<RegexArgumentReaderOptions>) => new RequiredSubtagParameter(new RegexArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    array: (name: string, options?: Partial<ArrayArgumentReaderOptions>) => new RequiredSubtagParameter(new ArrayArgumentReader(name, {
        maxSize: defaultMaxSize,
        allowVarName: true,
        ...options
    })),
    quiet: new OptionalSubtagParameter({
        name: 'quiet',
        maxSize: defaultMaxSize,
        async * read(_name, arg, script) {
            const value = yield* arg.value(this.maxSize);
            return value.length !== 0 || (script.process.plugins.tryGet(QuietPlugin)?.isQuiet ?? false);
        },
        get reader() {
            return this;
        }
    } as SubtagArgumentReader<boolean>, () => false),

    channel
});

function channel(options?: Partial<ChannelParameterOptions<'none'>>): SubtagParameter<Channel, [string]>;
function channel<Quiet extends boolean | 'scope'>(options: ChannelParameterOptions<Quiet>): SubtagParameter<Channel, [string]>;
function channel(options: ChannelParameterOptions<'arg'>): SubtagParameter<Channel, [string, boolean]>;
function channel({
    quietMode = 'none',
    notFound = (query, quiet) => new ChannelNotFoundError(query).withDisplay(quiet ? '' : undefined)
}: Partial<ChannelParameterOptions<boolean | 'arg' | 'scope' | 'none'>> = {}): SubtagParameter<Channel, [string, boolean] | [string]> {
    const notFoundFactory = typeof notFound === 'string' ? () => new BBTagRuntimeError(notFound) : notFound;
    switch (quietMode) {
        case 'arg': return p.group(p.string('channel'), p.quiet).map(async ([channelQuery, quiet], script) => {
            const channels = script.process.plugins.get(ChannelPlugin);
            const channel = await channels.query(channelQuery, { noLookup: quiet });
            if (channel === undefined)
                throw notFoundFactory(channelQuery, quiet);
            return channel;
        });
        case 'scope': return p.string('channel').map(async (channelQuery, script) => {
            const channels = script.process.plugins.get(ChannelPlugin);
            const quiet = script.process.plugins.tryGet(QuietPlugin);
            const channel = await channels.query(channelQuery, { noLookup: quiet?.isQuiet, noErrors: quiet?.isSuppressed });
            if (channel === undefined)
                throw notFoundFactory(channelQuery, quiet?.isQuiet ?? false);
            return channel;
        });
        case 'none':
        case true:
        case false: {
            const quiet = quietMode === true;
            return p.string('channel').map(async (channelQuery, script) => {
                const channels = script.process.plugins.get(ChannelPlugin);
                const channel = await channels.query(channelQuery, { noLookup: quiet });
                if (channel === undefined)
                    throw notFoundFactory(channelQuery, quiet);
                return channel;
            });
        }
    }
}

export interface ChannelParameterOptions<Quiet extends boolean | 'arg' | 'scope' | 'none'> {
    readonly quietMode: Quiet;
    readonly notFound?: string | ((query: string, quiet: boolean) => BBTagRuntimeError);
}
