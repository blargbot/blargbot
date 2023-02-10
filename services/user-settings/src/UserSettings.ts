import type { IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserSettings extends Readonly<IJsonConverterType<typeof userSerializer>> {

}

export const userSerializer = json.object({
    dontDmErrors: json.boolean,
    prefixes: json.array(json.string),
    timezone: json.string.nullable
});
