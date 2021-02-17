import { BBSourceMarker } from '../../../core/bbtag/types';

export function bbtagLocation(location: BBSourceMarker): string {
    return `${location.line},${location.column}`;
}
