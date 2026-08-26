export type ChatLogType = typeof ChatLogType[keyof typeof ChatLogType];
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ChatLogType = Object.freeze({
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2
});
