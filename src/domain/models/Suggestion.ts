/* eslint-disable @typescript-eslint/naming-convention */
export interface Suggestion {
    ID?: number;
    AA: boolean;
    Bug: boolean;
    Type: string[];
    Title: string;
    Description: string;
    Message: string;
    Channel: string;
    Author: string[];
    Edits?: number;
    Notes?: string;
    ['Last Edited']?: number;
}
