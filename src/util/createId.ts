const source = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export function createId(length = 8): string {
    return Array.from({ length }, () => source[Math.floor(Math.random() * source.length)])
        .join('');
}
