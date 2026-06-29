/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRICULUM, DIAGRAMS } from '../data/curriculum';
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

export interface SmartAnswerResponse {
  question: string;
  answerText: string;
  sourceType: 'lesson' | 'diagram' | 'exam' | 'general';
  sourceTitle: string;
  sourceId: string;
  lessonId?: string;
  unitId?: string;
  diagramId?: string;
  extractedParagraphs: string[];
  keyPoints: string[];
  relatedFlashcards: { question: string; answer: string }[];
  relatedExamQuestions: { questionText: string; explanation: string; year: string }[];
  anatomicalDescription?: { name: string; description: string };
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Intelligent local answer generator for student questions about the biology curriculum.
 * Synthesizes a structured response from lessons, diagrams, flashcards, and exam questions.
 */
export function generateSmartAnswer(question: string): SmartAnswerResponse {
  const normQuestion = normalizeArabic(question);
  const tokens = getSearchTokens(question);
  
  // If the question is too short
  if (!question || question.trim().length < 3) {
    return {
      question,
      answerText: "فضلاً، اكتب سؤالاً علمياً واضحاً أو كلمة بحث (مثال: 'ما هو النيفرون؟' أو 'وظيفة الكولسترول') لأتمكن من إجابتك بدقة من المنهج.",
      sourceType: 'general',
      sourceTitle: 'تنبيه',
      sourceId: 'short_query',
      extractedParagraphs: [],
      keyPoints: [],
      relatedFlashcards: [],
      relatedExamQuestions: [],
      confidence: 'low'
    };
  }

  // Define active tokens for scoring
  const activeTokens = tokens.length > 0 ? tokens : [normQuestion];

  // Helper score function based on token matches
  const calculateScore = (targetText: string): number => {
    if (!targetText) return 0;
    const normTarget = normalizeArabic(targetText);
    let matchCount = 0;
    
    activeTokens.forEach(token => {
      if (normTarget.includes(token)) {
        matchCount += 10;
        if (normTarget.includes(` ${token} `) || normTarget.startsWith(token) || normTarget.endsWith(token)) {
          matchCount += 5;
        }
      }
    });
    
    if (normTarget.includes(normQuestion)) {
      matchCount += 35;
    }
    
    return matchCount;
  };

  // 1. Check Diagram Parts for direct anatomical definitions (E.g. "محفظة بومان", "الكيوتين", "البنكرياس")
  let bestDiagramPart: any = null;
  let bestDiagramId: string = '';
  let bestDiagramUnitId: string = '';
  let maxDiagramScore = 0;

  Object.entries(DIAGRAMS).forEach(([diagKey, diagValue]) => {
    diagValue.parts.forEach(part => {
      let score = 0;
      const partNameNorm = normalizeArabic(part.name);
      
      // Match if question contains part name, or part name contains question
      if (normQuestion.includes(partNameNorm) || partNameNorm.includes(normQuestion)) {
        score += 50;
      }
      
      // Token matches
      activeTokens.forEach(token => {
        if (partNameNorm.includes(token)) {
          score += 15;
        }
      });

      if (score > maxDiagramScore && score > 20) {
        maxDiagramScore = score;
        bestDiagramPart = part;
        bestDiagramId = diagKey;
        bestDiagramUnitId = diagValue.unitId;
      }
    });
  });

  // 2. Check Lesson Flashcards (E.g. "ما هو مرض البري بري")
  let bestFlashcard: { question: string; answer: string; lessonId: string; lessonTitle: string; unitId: string } | null = null;
  let maxFlashcardScore = 0;
  
  CURRICULUM.forEach(unit => {
    unit.lessons.forEach(lesson => {
      lesson.flashcards?.forEach(fc => {
        let score = 0;
        const fcQNorm = normalizeArabic(fc.question);
        
        if (normQuestion.includes(fcQNorm) || fcQNorm.includes(normQuestion)) {
          score += 60;
        }
        
        activeTokens.forEach(token => {
          if (fcQNorm.includes(token)) {
            score += 15;
          }
        });

        if (score > maxFlashcardScore && score > 25) {
          maxFlashcardScore = score;
          bestFlashcard = {
            question: fc.question,
            answer: fc.answer,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            unitId: unit.id
          };
        }
      });
    });
  });

  // 3. Search Lesson Content for the best matching paragraphs
  let bestParagraphs: { text: string; score: number; lessonId: string; lessonTitle: string; unitId: string; unitNumber: number }[] = [];
  
  CURRICULUM.forEach(unit => {
    unit.lessons.forEach(lesson => {
      // Split content into paragraphs or markdown sections
      const paragraphs = lesson.content
        .split(/(?:\r?\n){2,}/) // Split by double newlines
        .map(p => p.trim())
        .filter(p => p.length > 15);

      paragraphs.forEach(p => {
        let score = calculateScore(p);
        
        // Bonus if lesson title matches
        const titleScore = calculateScore(lesson.title);
        if (titleScore > 0) {
          score += titleScore * 0.3;
        }

        if (score > 10) {
          bestParagraphs.push({
            text: p,
            score,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            unitId: unit.id,
            unitNumber: unit.number
          });
        }
      });
    });
  });

  // Sort paragraphs by score descending
  bestParagraphs.sort((a, b) => b.score - a.score);

  // 4. Search Past Exam questions for related items
  let matchingExams: { questionText: string; explanation: string; year: string; score: number }[] = [];
  SUDAN_EXAMS.forEach(exam => {
    exam.sections.forEach(sec => {
      sec.questions.forEach(q => {
        let score = calculateScore(q.questionText) + calculateScore(q.explanation) * 0.5;
        if (score > 15) {
          matchingExams.push({
            questionText: q.questionText,
            explanation: q.explanation,
            year: exam.year,
            score
          });
        }
      });
    });
  });
  matchingExams.sort((a, b) => b.score - a.score);

  // Synthesize response
  const response: SmartAnswerResponse = {
    question,
    answerText: '',
    sourceType: 'general',
    sourceTitle: 'المنهج الدراسي الموحد',
    sourceId: 'curriculum',
    extractedParagraphs: [],
    keyPoints: [],
    relatedFlashcards: [],
    relatedExamQuestions: [],
    confidence: 'low'
  };

  // Determine Source and Confidence
  const topPara = bestParagraphs[0];
  const maxScore = Math.max(maxDiagramScore, maxFlashcardScore, topPara ? topPara.score : 0);

  if (maxScore > 40) {
    response.confidence = 'high';
  } else if (maxScore > 15) {
    response.confidence = 'medium';
  } else {
    response.confidence = 'low';
  }

  // Compile paragraphs & key points from top lessons
  if (topPara) {
    response.lessonId = topPara.lessonId;
    response.unitId = topPara.unitId;
    response.sourceTitle = topPara.lessonTitle;
    response.sourceId = topPara.lessonId;
    response.sourceType = 'lesson';

    // Grab the top 2 matching paragraphs
    bestParagraphs.slice(0, 2).forEach(p => {
      if (p.lessonId === topPara.lessonId) {
        response.extractedParagraphs.push(p.text);
      }
    });

    // Extract key takeaways from the best matching lesson
    const matchingLesson = CURRICULUM.flatMap(u => u.lessons).find(l => l.id === topPara.lessonId);
    if (matchingLesson) {
      response.keyPoints = matchingLesson.keyTakeaways || [];
      
      // Grab 2 relevant flashcards from the same lesson
      if (matchingLesson.flashcards) {
        response.relatedFlashcards = matchingLesson.flashcards.slice(0, 2);
      }
    }
  }

  // Include Diagram Part if matched
  if (bestDiagramPart) {
    response.anatomicalDescription = {
      name: bestDiagramPart.name,
      description: bestDiagramPart.description
    };
    if (maxDiagramScore >= maxFlashcardScore && maxDiagramScore >= (topPara ? topPara.score : 0)) {
      response.sourceType = 'diagram';
      response.sourceTitle = `رسم تشريحي: ${bestDiagramPart.name}`;
      response.sourceId = bestDiagramId;
      response.diagramId = bestDiagramId;
      response.unitId = bestDiagramUnitId;
    }
  }

  // Include Related Exam Questions
  if (matchingExams.length > 0) {
    response.relatedExamQuestions = matchingExams.slice(0, 2).map(e => ({
      questionText: e.questionText,
      explanation: e.explanation,
      year: e.year
    }));
  }

  // Synthesize answer text (Markdown formatted Arabic response)
  let answerMD = "";

  if (response.confidence === 'low') {
    answerMD += `### 🧐 لم أعثر على تطابق دقيق ومباشر في نصوص المنهج.

لكن يمكنك الاستفسار عن أحد هذه المواضيع الفعالة:
* **التغذية وأمراضها** (الكواشيركور، الميراسموس، البري بري، الكولسترول)
* **البناء الضوئي وتشريح الورقة** (الكيوتين، النسيج العمادي، الخلايا الحارسة)
* **الجهاز الهضمي للإنسان** (المعدة، البنكرياس، وظائف الكبد، الأمعاء الدقيقة)
* **الدوران والقلب** (الأذين، البطين، الصمام المترالي، الشريان الأبهر)
* **الإخراج والجهاز البولي** (الكلية، النيفرون، محفظة بومان، التواء هنلي)
* **التنسيق الهرموني والأنشطة** (الانتحاء الضوئي، القوس الانعكاسية، هرمونات السكري)`;
  } else {
    // Introduction based on best source
    if (response.sourceType === 'diagram' && response.anatomicalDescription) {
      answerMD += `### 🧬 الشرح التشريحي للعضو: **${response.anatomicalDescription.name}**\n\n`;
      answerMD += `${response.anatomicalDescription.description}\n\n`;
      
      if (topPara) {
        answerMD += `--- \n### 📚 تفصيل إضافي من الدرس الكلي (${topPara.lessonTitle}):\n`;
        // Clean up markdown formatting inside the text a bit
        answerMD += `${topPara.text}\n\n`;
      }
    } else if (bestFlashcard && maxFlashcardScore >= (topPara ? topPara.score : 0)) {
      const fc: any = bestFlashcard;
      answerMD += `### 💡 بطاقة استذكار منهجية سريعة:\n`;
      answerMD += `* **السؤال**: ${fc.question}\n`;
      answerMD += `* **الإجابة**: ${fc.answer}\n\n`;
      
      if (topPara) {
        answerMD += `--- \n### 📖 شرح تفصيلي مكمل من الدرس:\n`;
        answerMD += `${topPara.text}\n\n`;
      }
    } else {
      answerMD += `### 📖 الإجابة العلمية المستخلصة من درس: **${response.sourceTitle}**\n\n`;
      response.extractedParagraphs.forEach(p => {
        answerMD += `${p}\n\n`;
      });
    }

    // Append Anatomical notes if we had a diagram part but it wasn't the main source
    if (response.sourceType !== 'diagram' && response.anatomicalDescription) {
      answerMD += `--- \n#### 🔍 مصطلح تشريحي مرتبط بالبحث:\n`;
      answerMD += `* **${response.anatomicalDescription.name}**: ${response.anatomicalDescription.description}\n\n`;
    }

    // Append Key points (key takeaways)
    if (response.keyPoints.length > 0) {
      answerMD += `--- \n#### 💡 ملخص الأفكار الهامة في هذا الدرس:\n`;
      response.keyPoints.slice(0, 3).forEach(kp => {
        answerMD += `* ${kp}\n`;
      });
      answerMD += `\n`;
    }

    // Append exam question references
    if (response.relatedExamQuestions.length > 0) {
      answerMD += `--- \n#### 📝 من أسئلة الشهادة السودانية السابقة ذات الصلة:\n`;
      response.relatedExamQuestions.forEach(eq => {
        answerMD += `* **سؤال (${eq.year})**: ${eq.questionText}\n`;
        answerMD += `  * **الإجابة والشرح**: ${eq.explanation}\n`;
      });
    }
  }

  response.answerText = answerMD;
  return response;
}

