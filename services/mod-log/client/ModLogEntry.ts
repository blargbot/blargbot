import { json } from '@blargbot/serialization';

export interface ModLogCreateRequest {
    readonly guildId: bigint;
    readonly userId: bigint;
    readonly type: string;
    readonly moderatorId?: bigint;
    readonly reason?: string;
    readonly metadata?: Record<string, JToken>;
}

export const modLogCreateRequestSerializer = json.object<ModLogCreateRequest>({
    guildId: json.bigint,
    metadata: json.record(json.jToken),
    moderatorId: json.bigint.optional,
    reason: json.string.optional,
    type: json.string,
    userId: json.bigint
});

export interface ModLogCreatedEvent {
    readonly caseId: number;
    readonly guildId: bigint;
    readonly userId: bigint;
    readonly type: string;
    readonly moderatorId?: bigint;
    readonly reason?: string;
    readonly metadata?: Record<string, JToken>;
}

export const modLogCreatedEventSerializer = json.object<ModLogCreatedEvent>({
    caseId: json.number,
    guildId: json.bigint,
    metadata: json.record(json.jToken),
    moderatorId: json.bigint.optional,
    reason: json.string.optional,
    type: json.string,
    userId: json.bigint
});

export interface ModLogUpdateRequest {
    readonly guildId: bigint;
    readonly caseId: number;
    readonly moderatorId?: bigint | null;
    readonly reason?: string | null;
}
export const modLogUpdateRequestSerializer = json.object<ModLogUpdateRequest>({
    caseId: json.number,
    guildId: json.bigint,
    moderatorId: json.bigint.nullish,
    reason: json.string.nullish
});

export interface ModLogUpdatedEvent {
    readonly caseId: number;
    readonly guildId: bigint;
    readonly userId: bigint;
    readonly type: string;
    readonly moderatorId?: bigint;
    readonly reason?: string;
}

export const modLogUpdatedEventSerializer = json.object<ModLogUpdatedEvent>({
    caseId: json.number,
    guildId: json.bigint,
    moderatorId: json.bigint.optional,
    reason: json.string.optional,
    type: json.string,
    userId: json.bigint
});

export interface ModLogDeleteRequest {
    readonly guildId: bigint;
    readonly caseId: number;
}
export const modLogDeleteRequestSerializer = json.object<ModLogDeleteRequest>({
    caseId: json.number,
    guildId: json.bigint
});

export interface ModLogDeletedEvent {
    readonly caseId: number;
    readonly guildId: bigint;
    readonly userId: bigint;
    readonly type: string;
    readonly moderatorId?: bigint;
    readonly reason?: string;
}

export const modLogDeletedEventSerializer = json.object<ModLogDeletedEvent>({
    caseId: json.number,
    guildId: json.bigint,
    moderatorId: json.bigint.optional,
    reason: json.string.optional,
    type: json.string,
    userId: json.bigint
});
