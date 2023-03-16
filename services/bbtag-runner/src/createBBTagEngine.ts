import { BBTagRunner, createValueConverter, DefaultLockService, DistributedCooldownService, Subtag, subtags, tagVariableScopeProviders } from '@bbtag/blargbot';
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

export function createBBTagEngine(options: BBTagEngineOptions): BBTagRunner {
    const { metrics } = options;
    const userSettings = new UserSettingsHttpClient('http://user-settings');
    const warnings = new UserWarningsHttpClient('http://user-warnings');

    return new BBTagRunner({
        subtags: Object.values(subtags).map(Subtag.getDescriptor),
        converter: createValueConverter({
            colors: {},
            regexMaxLength: 2000
        }),
        warnings: new WarningService(warnings),
        sources: new SourceProvider(),
        timezones: new TimezoneProvider(userSettings),
        variables: new VariablesStore(),
        variableMiddleware: [],
        variableScopes: tagVariableScopeProviders,
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
        cooldowns: new DistributedCooldownService({
            get(key) {
                key;
                throw null;
            },
            set(key, value) {
                key;
                value;
                throw null;
            }
        }),
        lock: new DefaultLockService({
            createLock(id) {
                id;
                throw null;
            }
        }),
        subtagMiddleware: [
            async ({ subtag }, next) => {
                const start = performance.now();
                try {
                    return await next();
                } finally {
                    const elapsed = performance.now() - start;
                    metrics.subtagUsed(subtag.id, elapsed);
                }
            }
        ]
    });
}

export interface BBTagEngineOptions {
    readonly metrics: MetricsApi;
}

export interface MetricsApi {
    subtagUsed(name: string, durationMs: number): void;
}
