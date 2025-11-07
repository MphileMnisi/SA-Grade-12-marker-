
export interface QuestionResult {
  questionNumber: string;
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
}

export interface MarkingResult {
  totalMarksAvailable: number;
  marksAwarded: number;
  overallFeedback: string;
  questions: QuestionResult[];
}
