import type { BBTagRuntimeConfig, BBTagScope, ChannelService, CooldownService, DeferredExecutionService, DumpService, FetchService, GuildService, InjectionContext, LockService, MessageService, ModLogService, RoleService, SourceProvider, StaffService, SubtagInvocationMiddleware, TimezoneProvider, UserService, WarningService } from '@bbtag/blargbot';
import { BBTagRuntime, createBBTagArrayTools, createBBTagJsonTools, createBBTagOperators, createValueConverter, smartStringCompare, Subtag } from '@bbtag/blargbot';
import type { VariableProvider } from '@bbtag/variables';

export function createBBTagEngine(options: BBTagEngineOptions): (config: BBTagRuntimeConfig) => BBTagRuntime {
    const converter = createValueConverter({
        colors: {},
        regexMaxLength: 2000
    });
    const arrayTools = createBBTagArrayTools({
        convertToInt: converter.int
    });
    const injectionContext: InjectionContext = {
        arrayTools,
        converter,
        jsonTools: createBBTagJsonTools({
            convertToInt: converter.int,
            isTagArray: arrayTools.isTagArray
        }),
        logger: console,
        operators: createBBTagOperators({
            compare: smartStringCompare,
            convertToString: converter.string,
            parseArray: v => arrayTools.deserialize(v)?.v
        }),
        channels: options.channels,
        defer: options.defer,
        dump: options.dump,
        guild: options.guild,
        lock: options.lock,
        messages: options.messages,
        modLog: options.modLog,
        roles: options.roles,
        staff: options.staff,
        timezones: options.timezones,
        users: options.users,
        warnings: options.warnings,
        fetch: options.fetch
    };

    const { subtags: subtagTypes, middleware, variables, cooldowns, sources } = options;
    const subtags = [...subtagTypes].map(s => Subtag.createInstance<Subtag>(s, injectionContext));
    const services = { ...injectionContext, middleware, subtags, variables, cooldowns, sources };
    return config => new BBTagRuntime(services, config);
}

export interface BBTagEngineOptions {
    readonly variables: VariableProvider<BBTagRuntime, BBTagScope>;
    readonly cooldowns: CooldownService;
    readonly sources: SourceProvider;
    readonly warnings: WarningService;
    readonly timezones: TimezoneProvider;
    readonly defer: DeferredExecutionService;
    readonly dump: DumpService;
    readonly modLog: ModLogService;
    readonly staff: StaffService;
    readonly channels: ChannelService;
    readonly users: UserService;
    readonly roles: RoleService;
    readonly guild: GuildService;
    readonly messages: MessageService;
    readonly lock: LockService;
    readonly fetch: FetchService;
    readonly middleware: Iterable<SubtagInvocationMiddleware>;
    readonly subtags: Iterable<new (...args: never) => Subtag>;
}
