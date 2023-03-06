import { BBTagEngine, createValueConverter, DefaultLockService, DistributedCooldownService, Subtag, subtags } from '@bbtag/blargbot';

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

export function createBBTagEngine(options: BBTagEngineOptions): BBTagEngine {
    const { defaultPrefix, metrics } = options;
    return new BBTagEngine({
        defaultPrefix,
        subtags: Object.values(subtags).map(Subtag.getDescriptor),
        converter: createValueConverter({
            colors: {},
            regexMaxLength: 2000
        }),
        warnings: new WarningService(),
        sources: new SourceProvider(),
        timezones: new TimezoneProvider(),
        variables: new VariablesStore(),
        defer: new DeferredExecutionService(),
        domains: new DomainFilterService(),
        dump: new DumpService(),
        modLog: new ModLogService(),
        staff: new StaffService(),
        channel: new ChannelService(),
        user: new UserService(),
        role: new RoleService(),
        guild: new GuildService(),
        message: new MessageService(),
        cooldown: new DistributedCooldownService({
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
        middleware: [
            async function* ({ subtag, context }, next) {
                const start = performance.now();
                try {
                    yield* next();
                } finally {
                    const elapsed = performance.now() - start;
                    metrics.subtagUsed(subtag.name, elapsed);
                    const debugPerf = context.data.subtags[subtag.name] ??= [];
                    debugPerf.push(elapsed);
                }
            }
        ]
    });
}

export interface BBTagEngineOptions {
    readonly defaultPrefix: string;
    readonly metrics: MetricsApi;
}

export interface MetricsApi {
    subtagUsed(name: string, durationMs: number): void;
}
