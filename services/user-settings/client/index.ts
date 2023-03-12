import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody } from '@blargbot/api-client';

export interface UserSettings {
    readonly dontDmErrors: boolean;
    readonly prefixes: readonly string[];
    readonly timezone: string | null;
}

export type UserSettingsUpdateBody = Partial<UserSettings>

export interface UserSettingsParameters {
    readonly userId: string | bigint;
}

export interface UserSettingsUpdateRequest extends UserSettingsUpdateBody, UserSettingsParameters {

}

export class UserSettingsHttpClient extends defineApiClient({
    getSettings: b => b.route<UserSettingsParameters>(x => `${x.userId}`)
        .response<UserSettings>(200),
    updateSettings: b => b.route<UserSettingsUpdateRequest>('PATCH', x => `${x.userId}`)
        .body(x => jsonBody({
            dontDmErrors: x.dontDmErrors,
            prefixes: x.prefixes,
            timezone: x.timezone
        } satisfies { [P in keyof UserSettings]: UserSettings[P] | undefined }))
        .response(204),
    resetSettings: b => b.route<UserSettingsParameters>('DELETE', x => `${x.userId}`)
        .response(204)
}) {
    public static from(options: UserSettingsHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): UserSettingsHttpClient {
        if (options instanceof UserSettingsHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new UserSettingsHttpClient(options);
    }
}
