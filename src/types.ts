/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  id: string;
  title: string;
  subTitle: string;
  content: string; // Markdown or structured rich content
  keyTakeaways: string[];
  healthTips?: string[]; // نصائح صحية أو ملاحظات سودانية للمنهج
  diagramId?: string; // ID of the interactive SVG diagram if available
  flashcards?: Flashcard[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  englishTitle: string;
  description: string;
  color: string; // Tailwind color class for custom theme accents
  iconName: string;
  lessons: Lesson[];
}

export interface ExperimentStep {
  stepNumber: number;
  instruction: string;
  actionLabel: string;
}

export interface VirtualExperiment {
  id: string;
  title: string;
  objective: string;
  materials: string[];
  steps: ExperimentStep[];
  variables: {
    name: string;
    label: string;
    type: 'slider' | 'select' | 'toggle';
    min?: number;
    max?: number;
    step?: number;
    options?: { value: string; label: string }[];
    defaultValue: any;
  }[];
  // A dynamic renderer engine config or function will simulate outputs based on these state variables
}

export interface WorksheetActivity {
  id: string;
  title: string;
  unitId: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  type: 'رسومات' | 'تحليل' | 'أسئلة مقالية';
  instructions: string;
  tasks: {
    question: string;
    hint?: string;
    sampleAnswer: string;
  }[];
}

export interface Question {
  id: string;
  unitId: string;
  type: 'multiple-choice' | 'fill-in-the-blanks' | 'true-false' | 'explain-why' | 'diagram-id';
  questionText: string;
  options?: string[]; // for multiple choice
  correctAnswer: string; // or accurate match
  explanation: string;
  points: number;
  diagramPath?: string; // for diagram question identification
}

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  sections: {
    name: string;
    questions: Question[];
  }[];
}

export interface StudentProgress {
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  bookmarkedUnitIds?: string[]; // المعرفات المفضلة للوحدات الدراسية
  bookmarkedLabIds?: string[]; // المعرفات المفضلة للمختبرات العملية
  quizScores: Record<string, number>; // key: examId/quizId, value: score percentage
  unitScores: Record<string, number[]>; // key: unitId, value: array of score percentages
  timeSpentMinutes: number;
  weaknesses: string[]; // List of specific biological concepts needing attention
  strengths: string[];
}

export interface SpacedReminder {
  id: string;
  lessonId: string;
  lessonTitle: string;
  unitTitle: string;
  scheduledTime: string; // ISO String
  intervalDays: number; // 1, 3, 7, 14, 30
  status: 'pending' | 'reviewed' | 'overdue';
}
