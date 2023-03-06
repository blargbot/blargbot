import type { BBTagLogger } from './services/BBTagLogger.js';
import type { ChannelService } from './services/ChannelService.js';
import type { CooldownService } from './services/CooldownService.js';
import type { DeferredExecutionService } from './services/DeferredExecutionService.js';
import type { DomainFilterService } from './services/DomainFilterService.js';
import type { DumpService } from './services/DumpService.js';
import type { GuildService } from './services/GuildService.js';
import type { LockService } from './services/LockService.js';
import type { MessageService } from './services/MessageService.js';
import type { ModLogService } from './services/ModLogService.js';
import type { RoleService } from './services/RoleService.js';
import type { SourceProvider } from './services/SourceProvider.js';
import type { StaffService } from './services/StaffService.js';
import type { SubtagDescriptor } from './services/SubtagDescriptor.js';
import type { SubtagInvocationMiddleware } from './services/SubtagInvocationMiddleware.js';
import type { TimezoneProvider } from './services/TimezoneProvider.js';
import type { UserService } from './services/UserService.js';
import type { VariablesStore } from './services/VariablesStore.js';
import type { WarningService } from './services/WarningService.js';
import type { BBTagJsonTools } from './utils/json.js';
import type { BBTagOperators } from './utils/operators.js';
import type { BBTagArrayTools } from './utils/tagArray.js';
import type { BBTagValueConverter } from './utils/valueConverter.js';

export interface InjectionContext {
    readonly defaultPrefix: string;

    readonly logger?: BBTagLogger;
    readonly subtags: Iterable<SubtagDescriptor>;
    readonly operators?: BBTagOperators;
    readonly arrayTools?: BBTagArrayTools;
    readonly jsonTools?: BBTagJsonTools;
    readonly converter: BBTagValueConverter;

    readonly variables: VariablesStore;
    readonly lock: LockService;
    readonly cooldown: CooldownService;

    readonly user: UserService;
    readonly role: RoleService;
    readonly channel: ChannelService;
    readonly message: MessageService;
    readonly guild: GuildService;

    readonly sources: SourceProvider;
    readonly timezones: TimezoneProvider;
    readonly middleware: Iterable<SubtagInvocationMiddleware>;

    readonly warnings: WarningService;
    readonly modLog: ModLogService;

    readonly dump: DumpService;
    readonly domains: DomainFilterService;
    readonly defer: DeferredExecutionService;
    readonly staff: StaffService;
}
