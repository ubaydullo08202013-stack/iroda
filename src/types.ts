export interface Word {
  id: string;
  english: string;
  uzbek: string;
  example: string;
  phonetic?: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  description: string;
}
