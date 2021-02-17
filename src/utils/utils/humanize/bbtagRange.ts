import { BBSubtagCall } from '../../../core/bbtag/types';
import { bbtagLocation } from './bbtagLocation';

export function bbtagRange(bbtag: BBSubtagCall): string {
    return `(${bbtagLocation(bbtag.start)}):(${bbtagLocation(bbtag.end)})`;
}