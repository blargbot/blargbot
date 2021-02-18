import { SubtagCall } from '../../../core/bbtag/types';
import { bbtagLocation } from './bbtagLocation';

export function bbtagRange(bbtag: SubtagCall): string {
    return `(${bbtagLocation(bbtag.start)}):(${bbtagLocation(bbtag.end)})`;
}