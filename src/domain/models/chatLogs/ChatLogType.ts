export type ChatLogType = typeof ChatLogType[keyof typeof ChatLogType];
// eslint-disable-next-line @typescript-eslint/naming-convention, no-useless-assignment
export const ChatLogType = Object.freeze({
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2
});
