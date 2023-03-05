import type { IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserSettings extends Readonly<IJsonConverterType<typeof userSettingsSerializer>> {

}

export const userSettingsSerializerOptions = {
    dontDmErrors: json.boolean,
    prefixes: json.array(json.string),
    timezone: json.string.nullable
};

export const userSettingsSerializer = json.object(userSettingsSerializerOptions);

export default userSettingsSerializer;
