import type { UserSettings } from '@blargbot/user-settings-client';

export const defaultSettings = (): UserSettings => ({
    dontDmErrors: false,
    prefixes: [],
    timezone: null
});
