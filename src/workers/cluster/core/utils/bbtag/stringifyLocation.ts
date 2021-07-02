import { SourceMarker } from '../../types';

export function stringifyLocation(location: SourceMarker): string {
    return `${location.line},${location.column}`;
}
