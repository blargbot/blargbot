import { SubtagCall } from '../../core/bbtag/types';
import { stringifyLocation } from './stringifyLocation';

export function stringifyRange(bbtag: SubtagCall): string {
    return `(${stringifyLocation(bbtag.start)}):(${stringifyLocation(bbtag.end)})`;
}

