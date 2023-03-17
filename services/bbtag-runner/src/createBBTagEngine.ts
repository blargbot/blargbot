import type { BBTagRuntimeConfig, InjectionContext, SubtagInvocationMiddleware } from '@bbtag/blargbot';
import { BBTagRuntime, createBBTagArrayTools, createBBTagJsonTools, createBBTagOperators, createValueConverter, DefaultLockService, DistributedCooldownService, smartStringCompare, Subtag, subtags, tagVariableScopeProviders } from '@bbtag/blargbot';
import { VariableNameParser, VariableProvider } from '@bbtag/variables';
import { UserSettingsHttpClient } from '@blargbot/user-settings-client';
import { UserWarningsHttpClient } from '@blargbot/user-warnings-client';

import { ChannelService } from './services/ChannelService.js';
import { DeferredExecutionService } from './services/DeferredExecutionService.js';
import { DomainFilterService } from './services/DomainFilterService.js';
import { DumpService } from './services/DumpService.js';
import { GuildService } from './services/GuildService.js';
import { MessageService } from './services/MessageService.js';
import { ModLogService } from './services/ModLogService.js';
import { RoleService } from './services/RoleService.js';
import { SourceProvider } from './services/SourceProvider.js';
import { StaffService } from './services/StaffService.js';
import { TimezoneProvider } from './services/TimezoneProvider.js';
import { UserService } from './services/UserService.js';
import { VariablesStore } from './services/VariablesStore.js';
import { WarningService } from './services/WarningService.js';

export function createBBTagEngine(options: BBTagEngineOptions): (config: BBTagRuntimeConfig) => BBTagRuntime {
    const { metrics } = options;
    const userSettings = new UserSettingsHttpClient('http://user-settings');
    const warnings = new UserWarningsHttpClient('http://user-warnings');
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
        warnings: new WarningService(warnings),
        timezones: new TimezoneProvider(userSettings),
        defer: new DeferredExecutionService(),
        domains: new DomainFilterService(),
        dump: new DumpService(),
        modLog: new ModLogService(),
        staff: new StaffService(),
        channels: new ChannelService(),
        users: new UserService(),
        roles: new RoleService(),
        guild: new GuildService(),
        messages: new MessageService(),
        lock: new DefaultLockService({
            createLock(id) {
                id;
                throw null;
            }
        })
    };

    const captureSubtagPerformance: SubtagInvocationMiddleware = async ({ subtag }, next) => {
        const start = performance.now();
        try {
            return await next();
        } finally {
            const elapsed = performance.now() - start;
            metrics.subtagUsed(subtag.id, elapsed);
        }
    };

    const s = Object.values(subtags).map(s => Subtag.createInstance<Subtag>(s, injectionContext));
    const variables = new VariableProvider(
        new VariableNameParser(tagVariableScopeProviders),
        new VariablesStore()
    );
    const sources = new SourceProvider();
    const cooldowns = new DistributedCooldownService({
        get(key) {
            key;
            throw null;
        },
        set(key, value) {
            key;
            value;
            throw null;
        }
    });

    return config => new BBTagRuntime({
        ...injectionContext,
        middleware: [captureSubtagPerformance],
        subtags: s,
        variables,
        cooldowns,
        sources
    }, config);

    // return new BBTagRunner({
    //     subtags: Object.values(subtags).map(Subtag.getDescriptor),
    //     variables: new VariablesStore(),
    //     variableMiddleware: [],
    //     variableScopes: tagVariableScopeProviders,,
    //     subtagMiddleware: [

    //     ]
    // });
}

export interface BBTagEngineOptions {
    readonly metrics: MetricsApi;
}

export interface MetricsApi {
    subtagUsed(name: string, durationMs: number): void;
}
