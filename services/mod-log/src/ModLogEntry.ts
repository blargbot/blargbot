import type { IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ModLogEntry extends Readonly<IJsonConverterType<typeof modLogEntrySerializer>> {

}

export const modLogEntrySerializer = json.object({
    caseId: json.number,
    userId: json.bigint,
    moderatorId: json.bigint.nullable,
    messageId: json.bigint.nullable,
    channelId: json.bigint.nullable,
    reason: json.string.nullable,
    type: json.string.nullable
});
