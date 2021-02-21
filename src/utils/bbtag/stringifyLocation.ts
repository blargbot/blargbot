import { SourceMarker } from '../../core/bbtag/types';

export function stringifyLocation(location: SourceMarker): string {
    return `${location.line},${location.column}`;
}
