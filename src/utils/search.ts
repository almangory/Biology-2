/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRICULUM } from '../data/curriculum';
import { VIRTUAL_LABS } from '../data/labs';
import { SUDAN_EXAMS } from '../data/exams';

// Normalize Arabic letters for smart comparison (removing diacritics and consolidating variants)
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // Remove Arabic diacritics (harakat)
    .trim();
}

// Tokenize and clean search query
export function getSearchTokens(query: string): string[] {
  const normalized = normalizeArabic(query);
  const rawTokens = normalized.split(/\s+/);
  
  // Common Arabic stop words to filter out for better keyword search
  const stopWords = [
    'في', 'من', 'على', 'عن', 'او', 'ام', 'ما', 'هل', 'هو', 'هي', 'تم', 'هذا', 
    'التي', 'الذي', 'ان', 'مع', 'لا', 'لم', 'إلى', 'الى', 'بين', 'تحت', 'فوق',
    'عند', 'كذلك', 'ثم', 'عبر', 'كل', 'بفعل'
  ];
  
  return rawTokens
    .map(token => {
      // Stripping "ال" definition prefix if token is long enough
      if (token.startsWith('ال') && token.length > 4) {
        return token.substring(2);
      }
      return token;
    })
    .filter(token => token.length > 1 && !stopWords.includes(token));
}

export interface SearchResult {
  id: string;
  type: 'lesson' | 'lab' | 'exam_question';
  title: string;
  subtitle: string;
  snippet: string;
  unitId?: string;
  lessonId?: string;
  score: number;
}

/**
 * Perform intelligent offline Arabic search on curriculum, virtual labs, and exam questions
 */
export function performCurriculumSearch(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return [];
  
  const tokens = getSearchTokens(query);
  const rawNormalized = normalizeArabic(query);
  
  // If stop-word filtering left nothing, fall back to the raw normalized string
  const activeTokens = tokens.length > 0 ? tokens : [rawNormalized];

  const results: SearchResult[] = [];

  // Helper score function based on token matches
  const calculateScore = (targetText: string): number => {
    if (!targetText) return 0;
    const normTarget = normalizeArabic(targetText);
    let matchCount = 0;
    
    activeTokens.forEach(token => {
      if (normTarget.includes(token)) {
        matchCount += 10;
        // Exact token substring block bonus
        if (normTarget.includes(` ${token} `) || normTarget.startsWith(token) || normTarget.endsWith(token)) {
          matchCount += 5;
        }
      }
    });
    
    // Direct raw query match high bonus
    if (normTarget.includes(rawNormalized)) {
      matchCount += 30;
    }
    
    return matchCount;
  };

  // 1. Search Curriculum Lessons and their key takeaways
  CURRICULUM.forEach(unit => {
    unit.lessons.forEach(lesson => {
      let score = 0;
      score += calculateScore(lesson.title) * 5; // Title carries the heaviest weight
      score += calculateScore(lesson.subTitle) * 2;
      score += calculateScore(lesson.keyTakeaways.join(' ')) * 1.5;
      score += calculateScore(lesson.content);

      if (score > 0) {
        // Generate snippet from text
        let snippet = lesson.subTitle;
        const normContent = normalizeArabic(lesson.content);
        const firstToken = activeTokens[0];
        const matchIndex = normContent.indexOf(firstToken);
        
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 35);
          const end = Math.min(lesson.content.length, matchIndex + 75);
          snippet = '...' + lesson.content.substring(start, end).replace(/\n/g, ' ') + '...';
        }

        results.push({
          id: lesson.id,
          type: 'lesson',
          title: lesson.title,
          subtitle: `الوحدة ${unit.number}: ${unit.title}`,
          snippet,
          unitId: unit.id,
          lessonId: lesson.id,
          score
        });
      }
    });
  });

  // 2. Search Virtual Labs (objectives, materials, and steps)
  VIRTUAL_LABS.forEach(lab => {
    let score = 0;
    score += calculateScore(lab.title) * 5;
    score += calculateScore(lab.objective) * 2.5;
    score += calculateScore(lab.materials.join(' '));
    score += calculateScore(lab.steps.map(s => s.instruction).join(' '));

    if (score > 0) {
      results.push({
        id: lab.id,
        type: 'lab',
        title: lab.title,
        subtitle: 'المعامل والتجارب العملية',
        snippet: lab.objective,
        score
      });
    }
  });

  // 3. Search Sudan Exam Questions
  SUDAN_EXAMS.forEach(exam => {
    exam.sections.forEach(sec => {
      sec.questions.forEach((q, idx) => {
        let score = 0;
        score += calculateScore(q.questionText) * 4;
        score += calculateScore(q.explanation) * 1.5;

        if (score > 0) {
          results.push({
            id: `${exam.id}_q_${idx}`,
            type: 'exam_question',
            title: q.questionText,
            subtitle: `سؤال امتحاني - ${exam.title} (${exam.year})`,
            snippet: `الشرح والحل: ${q.explanation}`,
            score
          });
        }
      });
    });
  });

  // Sort by match score descending, limit to top 8 items
  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}
