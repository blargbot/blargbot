import { AnalysisResult, SourceMarker } from '../types';

export class BBTagError extends Error implements AnalysisResult {
    public readonly location: SourceMarker;
    public constructor(location: SourceMarker, message: string) {
        super(message);

        this.location = location;
    }
}
