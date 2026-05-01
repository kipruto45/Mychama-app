type SurveyStorage = {
    seenSurveys: string[];
    setSeenSurvey: (surveyId: string) => void;
    lastSeenSurveyDate: Date | undefined;
    setLastSeenSurveyDate: (date: Date) => void;
};
export declare function useSurveyStorage(): SurveyStorage;
export {};
