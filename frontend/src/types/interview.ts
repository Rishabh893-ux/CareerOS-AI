export interface McqQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface InterviewSession {
  _id: string;
  type: "HR" | "Technical";
  format: "Written" | "MCQ";
  topic?: string;
  questions: string[];
  mcqQuestions: McqQuestion[];
  userAnswers?: string[];
  feedback?: string;
  improvementAreas?: string[];
  createdAt: string;
}
