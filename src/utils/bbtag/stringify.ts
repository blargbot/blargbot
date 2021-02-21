import { Statement, SubtagCall } from '../../core/bbtag/types';

export function stringify(bbtag: Statement | SubtagCall): string {
    if (Array.isArray(bbtag)) {
        return bbtag.map(val => typeof val === 'string' ? val : stringify(val)).join('');
    }

    const parts = [bbtag.name, ...bbtag.args]
        .map(stringify)
        .join('');
    return `{${parts}}`;
}