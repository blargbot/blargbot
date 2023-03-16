import type { VariableProviderMiddleware, VariableScopeProvider, VariableStore } from '@bbtag/variables';
import { VariableNameParser, VariableProvider } from '@bbtag/variables';

import type { BBTagRuntimeOptions } from './BBTagRuntime.js';
import { BBTagRuntime } from './BBTagRuntime.js';
import type { BBTagLogger, ChannelService, CooldownService, DeferredExecutionService, DomainFilterService, DumpService, GuildService, LockService, MessageService, ModLogService, RoleService, SourceProvider, StaffService, SubtagDescriptor, SubtagInvocationContext, SubtagInvocationMiddleware, TimezoneProvider, UserService, WarningService } from './services/index.js';
import type { ISubtagLookup } from './SubtagCollection.js';
import { SubtagCollection } from './SubtagCollection.js';
import type { SubtagExecutor } from './SubtagExecutor.js';
import type { TagVariableScope } from './types.js';
import type { BBTagArrayTools, BBTagJsonTools, BBTagOperators, BBTagValueConverter } from './utils/index.js';
import { createBBTagArrayTools, createBBTagJsonTools, createBBTagOperators, smartStringCompare } from './utils/index.js';

export class BBTagRunner {
    readonly #exec: SubtagExecutor;

    public readonly variables: VariableProvider<BBTagRuntime, TagVariableScope>;
    public readonly cooldowns: CooldownService;
    public readonly messages: MessageService;
    public readonly sources: SourceProvider;
    public readonly converter: BBTagValueConverter;
    public readonly operators: BBTagOperators;
    public readonly arrayTools: BBTagArrayTools;
    public readonly jsonTools: BBTagJsonTools;
    public readonly lock: LockService;
    public readonly users: UserService;
    public readonly roles: RoleService;
    public readonly channels: ChannelService;
    public readonly guild: GuildService;
    public readonly timezones: TimezoneProvider;
    public readonly warnings: WarningService;
    public readonly modLog: ModLogService;
    public readonly dump: DumpService;
    public readonly domains: DomainFilterService;
    public readonly defer: DeferredExecutionService;
    public readonly staff: StaffService;
    public readonly logger: BBTagLogger;
    public readonly subtags: ISubtagLookup;

    public constructor(options: BBTagRunnerOptions) {
        this.cooldowns = options.cooldowns;
        this.messages = options.messages;
        this.sources = options.sources;
        this.converter = options.converter;
        this.arrayTools = options.arrayTools ?? createBBTagArrayTools({
            convertToInt: this.converter.int
        });
        this.operators = options.operators ?? createBBTagOperators({
            compare: smartStringCompare,
            convertToString: this.converter.string,
            parseArray: v => this.arrayTools.deserialize(v)?.v
        });
        this.jsonTools = options.jsonTools ?? createBBTagJsonTools({
            convertToInt: this.converter.int,
            isTagArray: this.arrayTools.isTagArray
        });
        this.lock = options.lock;
        this.users = options.users;
        this.roles = options.roles;
        this.channels = options.channels;
        this.guild = options.guild;
        this.timezones = options.timezones;
        this.warnings = options.warnings;
        this.modLog = options.modLog;
        this.dump = options.dump;
        this.domains = options.domains;
        this.defer = options.defer;
        this.staff = options.staff;
        this.logger = options.logger ?? console;
        this.subtags = new SubtagCollection([...options.subtags].map(d => d.createInstance(this))).readonly;
        this.variables = new VariableProvider(
            new VariableNameParser(options.variableScopes),
            options.variables,
            [
                ...options.variableMiddleware,
                {
                    get(context, _, next) {
                        return context.metrics.timeDb(next);
                    },
                    set(context, values, next) {
                        context.metrics.dbObjectsCommitted += [...values].length;
                        return context.metrics.timeDb(next);
                    }
                }
            ]
        );

        const subtagMiddleware: SubtagInvocationMiddleware[] = [
            ...options.subtagMiddleware,
            ({ script, subtag, call }, next) => script.runtime.subtagStack.invoke(subtag.id, call, next),
            ({ script, subtag }, next) => script.runtime.metrics.timeSubtag(subtag.id, next)
        ];

        const callSubtag = subtagMiddleware.reduceRight<(ctx: SubtagInvocationContext) => Awaitable<string>>(
            (p, c) => (ctx) => c(ctx, p.bind(null, ctx)),
        /**/(ctx) => ctx.subtag.execute(ctx.script, ctx.subtagName, ctx.call)
        );
        this.#exec = (subtag, script, subtagName, call) => callSubtag({ subtag, script, subtagName, call });
    }

    public createRuntime(runtime: BBTagRuntimeOptions): BBTagRuntime {
        return new BBTagRuntime(this, runtime, this.#exec);
    }
}

export interface BBTagRunnerOptions {
    readonly logger?: BBTagLogger;
    readonly converter: BBTagValueConverter;
    readonly messages: MessageService;
    readonly cooldowns: CooldownService;
    readonly sources: SourceProvider;
    readonly operators?: BBTagOperators;
    readonly arrayTools?: BBTagArrayTools;
    readonly jsonTools?: BBTagJsonTools;
    readonly lock: LockService;
    readonly users: UserService;
    readonly roles: RoleService;
    readonly channels: ChannelService;
    readonly guild: GuildService;
    readonly timezones: TimezoneProvider;
    readonly warnings: WarningService;
    readonly modLog: ModLogService;
    readonly dump: DumpService;
    readonly domains: DomainFilterService;
    readonly defer: DeferredExecutionService;
    readonly staff: StaffService;
    readonly subtags: Iterable<SubtagDescriptor>;
    readonly variables: VariableStore<TagVariableScope>;
    readonly variableScopes: Iterable<VariableScopeProvider<BBTagRuntime, TagVariableScope>>;
    readonly variableMiddleware: Iterable<VariableProviderMiddleware<BBTagRuntime, TagVariableScope>>;
    readonly subtagMiddleware: Iterable<SubtagInvocationMiddleware>;
}
