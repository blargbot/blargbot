import type { IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

export type UserSettings = Readonly<IJsonConverterType<typeof userSerializer>>;
export const userSerializer = json.object({
    dontDmErrors: json.boolean,
    prefixes: json.array(json.string),
    timezone: json.string.nullable
});
