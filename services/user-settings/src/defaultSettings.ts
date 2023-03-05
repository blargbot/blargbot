import type { UserSettings } from '@blargbot/user-settings-contract';

export const defaultSettings = (): UserSettings => ({
    dontDmErrors: false,
    prefixes: [],
    timezone: null
});
