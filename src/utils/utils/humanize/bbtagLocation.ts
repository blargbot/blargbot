import { SourceMarker } from '../../../core/bbtag/types';

export function bbtagLocation(location: SourceMarker): string {
    return `${location.line},${location.column}`;
}
