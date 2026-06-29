/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CURRICULUM } from '../data/curriculum';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Bookmark, CheckCircle, Bell, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp, Image, Settings, Beaker, ArrowLeft, 
  RotateCcw, Activity, Info, AlertCircle, Maximize2, Minimize2,
  Download, Printer, FileText
} from 'lucide-react';
import { StudentProgress } from '../types';
import InteractiveDiagram from './InteractiveDiagram';

// دالة تحويل روابط قوقل درايف لمسارات مباشرة قابلة للعرض بداخل وسوم الـ img لضمان ظهور الصور
const getDirectGoogleDriveImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    let fileId = '';
    
    // Pattern 1: /file/d/FILE_ID/view
    const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      // Pattern 2: ?id=FILE_ID
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }
    
    if (fileId) {
      // استخدام رابط استعلام الصور المباشر لضمان التوافق وحل مشكلة عدم التحميل في المتصفحات
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
};

// تحديث روابط الصور الافتراضية لتتماشى مع الروح الترابية الدافئة المريحة للعين ومفهوم المنهج
const LESSON_DEFAULT_IMAGES: Record<string, string> = {
  u1_l1: 'https://drive.google.com/file/d/1WxY6AjlSOmMZzPAG1m8pTA8Us1SgGcCR/view?usp=sharing', // مجموعات الغذاء
  u1_l2: 'https://images.unsplash.com/photo-1501004318641-72ee04d2a012?auto=format&fit=crop&w=800&q=80', // البناء الضوئي في النبات
  u1_l3: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80', // الهضم في الحيوان
  u2_l1: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80',
  u2_l2: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=800&q=80',
  u3_l1: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
  u3_l2: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
  u3_l3: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
  u4_l1: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
  u4_l2: 'https://images.unsplash.com/photo-1584515901407-d7f5c181d0d1?auto=format&fit=crop&w=800&q=80',
};

const LESSON_TO_LAB_MAP: Record<string, string> = {
  u1_l1: 'lab_u1_l1',
  u1_l2: 'lab_photosynthesis',
  u1_l3: 'lab_u1_l3',
  u1_l4: 'lab_u1_l4',
  u2_l1: 'lab_transpiration',
  u2_l2: 'lab_blood_typing',
  u2_l3: 'lab_u2_l3',
  u3_l1: 'lab_u3_l1',
  u3_l2: 'lab_u3_l2',
  u4_l1: 'lab_u4_l1',
  u4_l2: 'lab_u4_l2',
  u5_l1: 'lab_u5_l1',
  u5_l2: 'lab_u5_l2',
  u5_l3: 'lab_u5_l3'
};

interface LessonViewerProps {
  progress: StudentProgress;
  onUpdateProgress: (updater: (prev: StudentProgress) => StudentProgress) => void;
  onAddReminder: (lessonId: string, lessonTitle: string, unitTitle: string, days: number) => void;
  onNavigateToLab?: (labId: string) => void;
  initialUnitId?: string;
  initialLessonId?: string;
  onClearInitialIds?: () => void;
}

const parseBoldText = (text: string) => {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="font-extrabold text-[#1e4631] inline">
          {part}
        </strong>
      );
    }
    return part;
  });
};

interface BlockItem {
  text: string;
  isBullet: boolean;
  isNumbered: boolean;
}

interface ParsedBlock {
  type: 'heading2' | 'heading3' | 'heading4' | 'divider' | 'list' | 'table' | 'definition' | 'paragraph';
  text?: string;
  items?: BlockItem[];
  rows?: string[];
}

const parseContentToBlocks = (content: string): ParsedBlock[] => {
  const lines = content.split('\n');
  const blocks: ParsedBlock[] = [];
  
  let currentBlock: ParsedBlock | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed === '') {
      if (currentBlock && currentBlock.type === 'paragraph') {
        currentBlock = null;
      }
      continue;
    }
    
    if (trimmed === '---') {
      currentBlock = null;
      blocks.push({ type: 'divider' });
      continue;
    }
    
    if (trimmed.startsWith('####')) {
      currentBlock = null;
      blocks.push({ type: 'heading4', text: trimmed.replace(/^####\s*/, '') });
      continue;
    }
    if (trimmed.startsWith('###')) {
      currentBlock = null;
      blocks.push({ type: 'heading3', text: trimmed.replace(/^###\s*/, '') });
      continue;
    }
    if (trimmed.startsWith('##')) {
      currentBlock = null;
      blocks.push({ type: 'heading2', text: trimmed.replace(/^##\s*/, '') });
      continue;
    }
    
    if (trimmed.startsWith('|')) {
      if (currentBlock && currentBlock.type === 'table') {
        currentBlock.rows?.push(trimmed);
      } else {
        currentBlock = { type: 'table', rows: [trimmed] };
        blocks.push(currentBlock);
      }
      continue;
    }
    
    const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');
    const isNumbered = /^\d+\.\s+/.test(trimmed);
    
    if (isBullet || isNumbered) {
      const item: BlockItem = { text: trimmed, isBullet, isNumbered };
      if (currentBlock && currentBlock.type === 'list') {
        currentBlock.items?.push(item);
      } else {
        currentBlock = { type: 'list', items: [item] };
        blocks.push(currentBlock);
      }
      continue;
    }
    
    const isDef = trimmed.includes('تعريف') || trimmed.includes('تسمى') || trimmed.includes('عبارة عن') || trimmed.includes('مفهوم') || trimmed.includes('مفهوم الإحساس');
    if (isDef) {
      currentBlock = null;
      blocks.push({ type: 'definition', text: trimmed });
      continue;
    }
    
    if (currentBlock && currentBlock.type === 'paragraph') {
      currentBlock.text += '\n' + trimmed;
    } else {
      currentBlock = { type: 'paragraph', text: trimmed };
      blocks.push(currentBlock);
    }
  }
  
  return blocks;
};

interface Slide {
  title: string;
  blocks: ParsedBlock[];
}

const groupBlocksIntoSlides = (blocks: ParsedBlock[]): Slide[] => {
  const slides: Slide[] = [];
  let currentSlideBlocks: ParsedBlock[] = [];
  let currentTitle = 'مقدمة التمهيد العلمي';
  let subPageNum = 1;

  const pushSlide = (title: string, b: ParsedBlock[]) => {
    if (b.length === 0) return;
    const finalTitle = subPageNum > 1 ? `${title} (تابع ${subPageNum})` : title;
    slides.push({
      title: finalTitle,
      blocks: [...b]
    });
  };

  const getBlockWeight = (block: ParsedBlock): number => {
    if (block.type === 'table') return 3;
    if (block.type === 'list') {
      const itemsCount = block.items?.length || 0;
      return itemsCount > 3 ? 2.5 : 1.5;
    }
    if (block.type === 'definition') return 2;
    if (block.type === 'paragraph') {
      const len = block.text?.length || 0;
      return len > 220 ? 2.5 : (len > 120 ? 1.8 : len > 60 ? 1.0 : 0.6);
    }
    return 0.5;
  };

  const splitBlockIfNeeded = (block: ParsedBlock): ParsedBlock[] => {
    if (block.type === 'list' && block.items && block.items.length > 3) {
      const results: ParsedBlock[] = [];
      const items = [...block.items];
      while (items.length > 0) {
        results.push({
          type: 'list',
          items: items.splice(0, 3)
        });
      }
      return results;
    }
    return [block];
  };

  blocks.forEach((originalBlock) => {
    const subBlocks = splitBlockIfNeeded(originalBlock);

    subBlocks.forEach((block) => {
      if (block.type === 'heading2' || block.type === 'heading3') {
        if (currentSlideBlocks.length > 0) {
          pushSlide(currentTitle, currentSlideBlocks);
          currentSlideBlocks = [];
        }
        currentTitle = block.text || 'شريحة فرعية';
        subPageNum = 1;
        currentSlideBlocks.push(block);
      } else if (block.type === 'divider') {
        if (currentSlideBlocks.length > 0) {
          pushSlide(currentTitle, currentSlideBlocks);
          currentSlideBlocks = [];
        }
        currentTitle = 'مفاهيم مكملة';
        subPageNum = 1;
      } else {
        let currentWeight = 0;
        currentSlideBlocks.forEach(sb => {
          currentWeight += getBlockWeight(sb);
        });

        const blockWeight = getBlockWeight(block);

        if (currentSlideBlocks.length > 0 && (currentWeight + blockWeight > 2.8)) {
          pushSlide(currentTitle, currentSlideBlocks);
          subPageNum++;
          currentSlideBlocks = [];
        }
        currentSlideBlocks.push(block);
      }
    });
  });

  if (currentSlideBlocks.length > 0) {
    pushSlide(currentTitle, currentSlideBlocks);
  }

  if (slides.length === 0) {
    slides.push({
      title: 'محتوى الدرس والتحليل العلمي',
      blocks: blocks,
    });
  }

  return slides;
};

const getScientificImageByText = (title: string, contentText: string, lessonId: string): string => {
  const combined = (title + ' ' + contentText).toLowerCase();
  
  if (combined.includes('كربوهيدرات') || combined.includes('نشا') || combined.includes('سيلولوز') || combined.includes('جلوكوز') || combined.includes('سكر')) {
    return 'https://drive.google.com/file/d/1z-gXWrH7Bd-1sBhI6SXYUGzdEtCMQOq5/view?usp=sharing'; // Carbs / healthy food / grains
  }
  if (combined.includes('فيتامين') || combined.includes('فيتامينات') || combined.includes('مضادات الأكسدة')) {
    return 'https://drive.google.com/open?id=1ach0iNarqARm7XU4mw1S3nI_0Z8-q_SR&usp=drive_fs'; // Vitamins / colorful citrus fruits
  }
  if (combined.includes('بروتين') || combined.includes('لحوم') || combined.includes('أحماض أمينية') || combined.includes('بيض')) {
    return 'https://drive.google.com/open?id=1WLLMPMEpxk217RPBDKsPbTisFT9ocbOR&usp=drive_fs'; // Protein / raw healthy food ingredients
  }
  if (combined.includes('دهون') || combined.includes('ليبيدات') || combined.includes('زيوت') || combined.includes('زبدة')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80'; // Oils / fats / olives / avocado
  }
  if (combined.includes('بناء ضوئي') || combined.includes('كلوروفيل') || combined.includes('ورقة') || combined.includes('نبات') || combined.includes('إيلوديا') || combined.includes('ضوء')) {
    return 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80'; // Photosynthesis / green leaves / sunlight
  }
  if (combined.includes('هضم') || combined.includes('إنزيم') || combined.includes('معدة') || combined.includes('أمعاء') || combined.includes('لعاب') || combined.includes('ببسين') || combined.includes('أميليز')) {
    return 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80'; // Digestive / enzyme / molecular bio
  }
  if (combined.includes('أملاح') || combined.includes('معدنية') || combined.includes('كالسيوم') || combined.includes('حديد') || combined.includes('فسفور') || combined.includes('صوديوم') || combined.includes('يود')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80'; // Pure water splashing / minerals
  }
  if (combined.includes('ماء') || combined.includes('سوائل') || combined.includes('شرب')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80'; // Water splash
  }
  if (combined.includes('دم') || combined.includes('فصيلة') || combined.includes('شريان') || combined.includes('وريد') || combined.includes('قلب') || combined.includes('شعيرات') || combined.includes('نقل')) {
    return 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=800&q=80'; // Blood cells / medical vascular
  }
  if (combined.includes('مناعة') || combined.includes('لقاح') || combined.includes('أجسام مضادة') || combined.includes('تطعيم') || combined.includes('ذاكرة')) {
    return 'https://images.unsplash.com/photo-1584515901407-d7f5c181d0d1?auto=format&fit=crop&w=800&q=80'; // Immunity / vaccine research / laboratory tubes
  }
  if (combined.includes('تنفس') || combined.includes('هوائي') || combined.includes('خميرة') || combined.includes('أكسجين') || combined.includes('رئة') || combined.includes('طاقة')) {
    return 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80'; // Respiration / lungs science model
  }
  if (combined.includes('كلية') || combined.includes('بول') || combined.includes('نفرون') || combined.includes('إخراج') || combined.includes('جلد') || combined.includes('عرق')) {
    return 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80'; // Kidney / water droplets on plant (representing excretion/transpiration)
  }
  if (combined.includes('عصب') || combined.includes('سيال') || combined.includes('دماغ') || combined.includes('حبل شوكي') || combined.includes('فعل منعكس') || combined.includes('حس')) {
    return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80'; // Nervous system / brain synapse abstract
  }
  if (combined.includes('مرض') || combined.includes('أعراض') || combined.includes('نقص') || combined.includes('تهديد') || combined.includes('علاج')) {
    return 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80'; // Clinical / stethoscope
  }
  if (combined.includes('معمل') || combined.includes('تجربة') || combined.includes('مجهر') || combined.includes('ميكروسكوب')) {
    return 'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&w=800&q=80'; // Lab glass
  }
  if (combined.includes('كتاب') || combined.includes('وزارة') || combined.includes('سودان') || combined.includes('منهج')) {
    return 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'; // Books and study
  }
  
  const hash = title.length % 5;
  const fallbacks = [
    'https://drive.google.com/open?id=1VgctY6DNRiIQZg-TFSMRm52MS2HSQjF7&usp=drive_fs', // Lab
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', // Abstract science / bio
    'https://drive.google.com/open?id=1WLLMPMEpxk217RPBDKsPbTisFT9ocbOR&usp=drive_fs', // DNA helix
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', // digital biology
    'https://images.unsplash.com/photo-1501004318641-72ee04d2a012?auto=format&fit=crop&w=800&q=80'  // Green leaves / plant
  ];
  return fallbacks[hash];
};

export default function LessonViewer({ 
  progress, 
  onUpdateProgress, 
  onAddReminder, 
  onNavigateToLab,
  initialUnitId,
  initialLessonId,
  onClearInitialIds
}: LessonViewerProps) {
  
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId || CURRICULUM[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId || CURRICULUM[0].lessons[0].id);
  
  const [expandedUnitIds, setExpandedUnitIds] = useState<string[]>([CURRICULUM[0].id]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [scheduleDays, setScheduleDays] = useState(3);
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [tempMediaUrl, setTempMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);

  // Flipbook state variables
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [slideCustomImages, setSlideCustomImages] = useState<Record<number, string>>({});
  const [slideImageInputIdx, setSlideImageInputIdx] = useState<number | null>(null);
  const [slideImageInputUrl, setSlideImageInputUrl] = useState('');
  const [viewMode, setViewMode] = useState<'flipbook' | 'continuous'>('flipbook');
  const [isBookFullscreen, setIsBookFullscreen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'content' | 'image'>('content');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialUnitId) {
      setSelectedUnitId(initialUnitId);
      if (!expandedUnitIds.includes(initialUnitId)) {
        setExpandedUnitIds(prev => [...prev, initialUnitId]);
      }
    }
    if (initialLessonId) {
      setSelectedLessonId(initialLessonId);
    }
    if (initialUnitId || initialLessonId) {
      if (onClearInitialIds) onClearInitialIds();
    }
  }, [initialUnitId, initialLessonId]);

  useEffect(() => {
    setActiveCardIdx(0);
    setCurrentSlideIdx(0);
    setIsFlipped(false);

    // Load slide custom images from localStorage
    const savedSlideImages: Record<number, string> = {};
    for (let i = 0; i < 40; i++) {
      const key = `slide_media_${selectedLessonId}_${i}`;
      const savedUrl = localStorage.getItem(key);
      if (savedUrl) {
        savedSlideImages[i] = savedUrl;
      }
    }
    setSlideCustomImages(savedSlideImages);
  }, [selectedLessonId]);

  const currentUnit = CURRICULUM.find(u => u.id === selectedUnitId) 
                   || CURRICULUM.find(u => u.lessons.some(l => l.id === selectedLessonId))
                   || CURRICULUM[0];
  
  const currentLesson = currentUnit.lessons.find(l => l.id === selectedLessonId) 
                     || CURRICULUM.flatMap(u => u.lessons).find(l => l.id === selectedLessonId)
                     || currentUnit.lessons[0];

  useEffect(() => {
    const saved = localStorage.getItem(`lesson_media_${selectedLessonId}`) || '';
    setCustomMediaUrl(saved);
    setTempMediaUrl(saved);
    setShowMediaInput(false);
  }, [selectedLessonId]);

  const isBookmarked = progress.bookmarkedLessonIds.includes(currentLesson.id);
  const isCompleted = progress.completedLessonIds.includes(currentLesson.id);

  const lessonBlocks = parseContentToBlocks(currentLesson.content);
  const lessonSlides = groupBlocksIntoSlides(lessonBlocks);

  const handleToggleBookmark = () => {
    onUpdateProgress(prev => {
      const currentList = prev.bookmarkedLessonIds || [];
      const updated = currentList.includes(currentLesson.id)
        ? currentList.filter(id => id !== currentLesson.id)
        : [...currentList, currentLesson.id];
      return { ...prev, bookmarkedLessonIds: updated };
    });
  };

  const handleToggleCompleted = () => {
    onUpdateProgress(prev => {
      const currentList = prev.completedLessonIds || [];
      const updated = currentList.includes(currentLesson.id)
        ? currentList.filter(id => id !== currentLesson.id)
        : [...currentList, currentLesson.id];
      return { ...prev, completedLessonIds: updated };
    });
  };

  const generateLessonTextSummary = (lesson: any, unitTitle: string): string => {
    let text = `=========================================\n`;
    text += `جمهورية السودان - المنهج الأكاديمي للأحياء\n`;
    text += `ملخص الدرس للمراجعة والتحصيل\n`;
    text += `=========================================\n\n`;
    text += `📖 الوحدة: ${unitTitle}\n`;
    text += `🔖 الدرس: ${lesson.title}\n`;
    if (lesson.subTitle) {
      text += `💡 العنوان الفرعي: ${lesson.subTitle}\n`;
    }
    text += `\n-----------------------------------------\n`;
    text += `📝 محتوى الدرس الأساسي:\n`;
    text += `-----------------------------------------\n\n`;
    
    const cleanContent = lesson.content
      .replace(/###/g, '◀')
      .replace(/##/g, '■')
      .replace(/#/g, '●')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '•');
      
    text += cleanContent;
    text += `\n\n-----------------------------------------\n`;
    text += `🌟 النقاط الأساسية والمفاهيم الجوهرية (Key Takeaways):\n`;
    text += `-----------------------------------------\n`;
    if (lesson.keyTakeaways && lesson.keyTakeaways.length > 0) {
      lesson.keyTakeaways.forEach((point: string, idx: number) => {
        text += `${idx + 1}. ${point}\n`;
      });
    } else {
      text += `لا توجد نقاط أساسية إضافية مضافة.\n`;
    }

    if (lesson.healthTips && lesson.healthTips.length > 0) {
      text += `\n-----------------------------------------\n`;
      text += `🔬 ملاحظات صحية وتطبيقات سودانية للمنهج:\n`;
      text += `-----------------------------------------\n`;
      lesson.healthTips.forEach((tip: string, idx: number) => {
        text += `💡 ${tip}\n`;
      });
    }

    if (lesson.flashcards && lesson.flashcards.length > 0) {
      text += `\n-----------------------------------------\n`;
      text += `🧠 بطاقات الأسئلة والأجوبة السريعة (Flashcards):\n`;
      text += `-----------------------------------------\n`;
      lesson.flashcards.forEach((card: any, idx: number) => {
        text += `س${idx + 1}: ${card.question}\n`;
        text += `ج${idx + 1}: ${card.answer}\n\n`;
      });
    }

    text += `\n=========================================\n`;
    text += `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    text += `تم التصدير بواسطة منصة الأحياء التفاعلية للسودان ✨\n`;
    text += `=========================================\n`;

    return text;
  };

  const generateUnitTextSummary = (unit: any): string => {
    let text = `=========================================\n`;
    text += `جمهورية السودان - المنهج الأكاديمي للأحياء\n`;
    text += `ملخص الوحدة الأكاديمية بالكامل للمراجعة\n`;
    text += `=========================================\n\n`;
    text += `📂 الوحدة: ${unit.title} (${unit.englishTitle})\n`;
    text += `📝 الوصف: ${unit.description}\n`;
    text += `\n=========================================\n\n`;

    unit.lessons.forEach((lesson: any, lessonIdx: number) => {
      text += `【 الدرس ${lessonIdx + 1}: ${lesson.title} 】\n`;
      if (lesson.subTitle) {
        text += `💡 ${lesson.subTitle}\n`;
      }
      text += `\n`;
      
      const cleanContent = lesson.content
        .replace(/###/g, '◀')
        .replace(/##/g, '■')
        .replace(/#/g, '●')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '•');
        
      text += cleanContent;
      text += `\n\n• النقاط الأساسية:\n`;
      lesson.keyTakeaways.forEach((point: string, idx: number) => {
        text += `  - ${point}\n`;
      });

      if (lesson.healthTips && lesson.healthTips.length > 0) {
        text += `\n• ملاحظات وتطبيقات المنهج:\n`;
        lesson.healthTips.forEach((tip: string, idx: number) => {
          text += `  💡 ${tip}\n`;
        });
      }

      if (lesson.flashcards && lesson.flashcards.length > 0) {
        text += `\n• بطاقات الأسئلة السريعة:\n`;
        lesson.flashcards.forEach((card: any, idx: number) => {
          text += `  س: ${card.question}\n`;
          text += `  ج: ${card.answer}\n`;
        });
      }

      text += `\n-----------------------------------------\n\n`;
    });

    text += `=========================================\n`;
    text += `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    text += `تم التصدير بواسطة منصة الأحياء التفاعلية للسودان ✨\n`;
    text += `=========================================\n`;

    return text;
  };

  const handleDownloadTxt = (type: 'lesson' | 'unit') => {
    const text = type === 'lesson' 
      ? generateLessonTextSummary(currentLesson, currentUnit.title)
      : generateUnitTextSummary(currentUnit);
      
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = type === 'lesson' 
      ? `ملخص_درس_${currentLesson.title.replace(/\s+/g, '_')}.txt`
      : `ملخص_وحدة_${currentUnit.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = (type: 'lesson' | 'unit') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لتتمكن من طباعة وتصدير الملف.');
      return;
    }

    let htmlContent = '';
    const dateStr = new Date().toLocaleDateString('ar-SD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (type === 'lesson') {
      const takeawaysList = currentLesson.keyTakeaways.map(point => `<li>${point}</li>`).join('');
      const healthTipsList = (currentLesson.healthTips || []).map(tip => `<li>💡 ${tip}</li>`).join('');
      const flashcardsList = (currentLesson.flashcards || []).map((card, idx) => `
        <div class="card-item">
          <p class="question"><strong>س${idx + 1}:</strong> ${card.question}</p>
          <p class="answer"><strong>ج${idx + 1}:</strong> ${card.answer}</p>
        </div>
      `).join('');

      const cleanMarkdown = currentLesson.content
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/## (.*)/g, '<h2>$1</h2>')
        .replace(/# (.*)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      htmlContent = `
        <div class="print-container">
          <div class="header">
            <div class="header-logo">🧬</div>
            <div class="header-title">
              <h1>وزارة التربية والتعليم - جمهورية السودان</h1>
              <h2>منصة الأحياء التفاعلية للصف الثاني الثانوي</h2>
              <h3>ملخص المراجعة والتحصيل الأكاديمي</h3>
            </div>
          </div>

          <div class="meta-section">
            <p><strong>الوحدة:</strong> ${currentUnit.title}</p>
            <p><strong>الدرس:</strong> ${currentLesson.title}</p>
            ${currentLesson.subTitle ? `<p><strong>العنوان الفرعي:</strong> ${currentLesson.subTitle}</p>` : ''}
            <p><strong>تاريخ التصدير:</strong> ${dateStr}</p>
          </div>

          <div class="content-section">
            <h2>📝 محتوى الشرح والتفصيل:</h2>
            <div class="markdown-body">
              ${cleanMarkdown}
            </div>
          </div>

          <div class="takeaways-section">
            <h2>🌟 النقاط والمفاهيم الأساسية (مهم للامتحان):</h2>
            <ul>
              ${takeawaysList}
            </ul>
          </div>

          ${currentLesson.healthTips && currentLesson.healthTips.length > 0 ? `
          <div class="health-tips-section">
            <h2>🔬 تطبيقات المنهج والملاحظات الطبية:</h2>
            <ul>
              ${healthTipsList}
            </ul>
          </div>
          ` : ''}

          ${currentLesson.flashcards && currentLesson.flashcards.length > 0 ? `
          <div class="flashcards-section">
            <h2>🧠 بطاقات المراجعة السريعة (سؤال وجواب):</h2>
            <div class="cards-grid">
              ${flashcardsList}
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>مع تمنياتنا لكم بالنجاح والتفوق الباهر في امتحانات الشهادة السودانية ✨</p>
          </div>
        </div>
      `;
    } else {
      // Unit PDF export
      const lessonsHtml = currentUnit.lessons.map((lesson, lessonIdx) => {
        const cleanContent = lesson.content
          .replace(/### (.*)/g, '<h3>$1</h3>')
          .replace(/## (.*)/g, '<h2>$1</h2>')
          .replace(/# (.*)/g, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');

        const keyTakeawaysList = lesson.keyTakeaways.map(point => `<li>${point}</li>`).join('');
        const healthTipsList = (lesson.healthTips || []).map(tip => `<li>💡 ${tip}</li>`).join('');
        const flashcardsList = (lesson.flashcards || []).map((card, idx) => `
          <div class="card-item">
            <p class="question"><strong>س${idx + 1}:</strong> ${card.question}</p>
            <p class="answer"><strong>ج${idx + 1}:</strong> ${card.answer}</p>
          </div>
        `).join('');

        return `
          <div class="unit-lesson-block">
            <h2 class="lesson-num">📖 الدرس ${lessonIdx + 1}: ${lesson.title}</h2>
            ${lesson.subTitle ? `<p class="lesson-sub">💡 ${lesson.subTitle}</p>` : ''}
            
            <div class="markdown-body">
              ${cleanContent}
            </div>

            <div class="takeaways-section inner-takeaways">
              <h3>🌟 النقاط الأساسية للدرس:</h3>
              <ul>
                ${keyTakeawaysList}
              </ul>
            </div>

            ${lesson.healthTips && lesson.healthTips.length > 0 ? `
            <div class="health-tips-section inner-health">
              <h3>🔬 تطبيقات المنهج والملاحظات الطبية:</h3>
              <ul>
                ${healthTipsList}
              </ul>
            </div>
            ` : ''}

            ${lesson.flashcards && lesson.flashcards.length > 0 ? `
            <div class="flashcards-section inner-flash">
              <h3>🧠 بطاقات الأسئلة السريعة:</h3>
              <div class="cards-grid">
                ${flashcardsList}
              </div>
            </div>
            ` : ''}
          </div>
          <div class="page-break"></div>
        `;
      }).join('');

      htmlContent = `
        <div class="print-container">
          <div class="header">
            <div class="header-logo">🧬</div>
            <div class="header-title">
              <h1>وزارة التربية والتعليم - جمهورية السودان</h1>
              <h2>منصة الأحياء التفاعلية للصف الثاني الثانوي</h2>
              <h3>ملخص الوحدة الأكاديمية الكامل للمراجعة الخارجية</h3>
            </div>
          </div>

          <div class="meta-section">
            <p><strong>📂 الوحدة الكاملة:</strong> ${currentUnit.title}</p>
            <p><strong>📝 الوصف العام:</strong> ${currentUnit.description}</p>
            <p><strong>تاريخ التصدير:</strong> ${dateStr}</p>
          </div>

          ${lessonsHtml}

          <div class="footer">
            <p>تم إعداد وتصدير هذا الملف للمراجعة الذاتية • تمنياتنا بالتوفيق والتفوق ✨</p>
          </div>
        </div>
      `;
    }

    const printStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
      
      body {
        font-family: 'Cairo', system-ui, -apple-system, sans-serif;
        background-color: #ffffff;
        color: #2d2219;
        margin: 0;
        padding: 20px;
        line-height: 1.6;
      }

      .print-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ebdcb9;
        background-color: #fdfcf9;
        border-radius: 12px;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 3px double #c86446;
        padding-bottom: 15px;
        margin-bottom: 25px;
        gap: 20px;
      }

      .header-logo {
        font-size: 48px;
      }

      .header-title {
        text-align: center;
      }

      .header-title h1 {
        font-size: 18px;
        margin: 0 0 5px 0;
        color: #1e4631;
        font-weight: 900;
      }

      .header-title h2 {
        font-size: 14px;
        margin: 0 0 5px 0;
        color: #c86446;
        font-weight: 700;
      }

      .header-title h3 {
        font-size: 12px;
        margin: 0;
        color: #7c6a59;
        font-weight: 600;
      }

      .meta-section {
        background-color: #f6f1e5;
        border: 1px solid #eaddca;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 25px;
        font-size: 13px;
      }

      .meta-section p {
        margin: 4px 0;
      }

      .content-section, .takeaways-section, .health-tips-section, .flashcards-section, .unit-lesson-block {
        margin-bottom: 30px;
      }

      h2 {
        font-size: 15px;
        color: #1e4631;
        border-bottom: 1px solid #eaddca;
        padding-bottom: 6px;
        margin-bottom: 12px;
        font-weight: 700;
      }

      h3 {
        font-size: 14px;
        color: #c86446;
        margin: 15px 0 8px 0;
      }

      .markdown-body {
        font-size: 13px;
        color: #4a3e3d;
        line-height: 1.7;
      }

      ul {
        padding-right: 20px;
        margin: 10px 0;
      }

      li {
        font-size: 13px;
        margin-bottom: 6px;
        position: relative;
      }

      .cards-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 15px;
        margin-top: 15px;
      }

      .card-item {
        background-color: #ffffff;
        border: 1px solid #eaddca;
        padding: 12px;
        border-radius: 8px;
      }

      .card-item p {
        margin: 4px 0;
        font-size: 12px;
      }

      .card-item .question {
        color: #c86446;
      }

      .card-item .answer {
        color: #1e4631;
      }

      .unit-lesson-block {
        border-bottom: 2px dashed #eaddca;
        padding-bottom: 25px;
        margin-bottom: 25px;
      }

      .lesson-num {
        font-size: 16px;
        color: #1e4631;
        border-bottom: 2px solid #1e4631;
        padding-bottom: 4px;
      }

      .lesson-sub {
        font-size: 12px;
        color: #7c6a59;
        font-style: italic;
        margin-top: -8px;
        margin-bottom: 15px;
      }

      .footer {
        text-align: center;
        font-size: 11px;
        color: #baa896;
        border-top: 1px dashed #eaddca;
        padding-top: 15px;
        margin-top: 30px;
      }

      @media print {
        body {
          background-color: #ffffff;
          padding: 0;
        }
        .print-container {
          border: none;
          background-color: transparent;
          padding: 0;
          max-width: 100%;
        }
        .page-break {
          page-break-after: always;
        }
        button {
          display: none !important;
        }
      }
    `;

    printWindow.document.write('<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تصدير ملخص الأحياء</title><style>' + printStyles + '</style></head><body>' + htmlContent + '<script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };</script></body></html>');
    printWindow.document.close();
  };

  const toggleUnitExpand = (unitId: string) => {
    setExpandedUnitIds(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId) 
        : [...prev, unitId]
    );
  };

  return (
    <div className="flex flex-col gap-6 text-right max-w-5xl mx-auto w-full relative" id="lesson-viewer-container">
      
      {/* 🌟 Backdrop overlay to dismiss dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-all" 
          onClick={() => setIsDropdownOpen(false)} 
        />
      )}

      {/* 📚 قائمة منسدلة علوية مدمجة لاختيار الدروس والوحدات للاستفادة من كامل المساحة */}
      <div className="relative w-full z-50" id="lessons-dropdown-selector">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full text-right bg-white hover:bg-[#fcfaf4] border border-[#eaddca] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-3xs hover:shadow-2xs transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center space-x-3 space-x-reverse min-w-0 flex-1">
            <div className="p-2.5 bg-[#f6f1e5] rounded-xl text-[#1e4631] group-hover:bg-[#ebdcb9] transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#a6937c] block uppercase leading-tight">
                الوحدة {currentUnit.number}: {currentUnit.title}
              </span>
              <h3 className="text-xs sm:text-sm font-black text-[#2d2219] truncate leading-normal flex items-center gap-1.5 mt-0.5">
                <span>{currentLesson.title}</span>
                {progress.completedLessonIds.includes(currentLesson.id) && (
                  <CheckCircle className="w-3.5 h-3.5 text-[#1e4631] inline" />
                )}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[9px] text-[#7c6a59] font-bold">نسبة إنجاز الوحدة</span>
              <div className="flex items-center space-x-1.5 space-x-reverse mt-0.5">
                <span className="text-xs font-mono font-bold text-[#1e4631]">
                  %{Math.round((currentUnit.lessons.filter(l => progress.completedLessonIds.includes(l.id)).length / currentUnit.lessons.length) * 100)}
                </span>
                <div className="w-16 h-1.5 bg-[#f6f1e5] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1e4631] transition-all duration-500" 
                    style={{ width: `${(currentUnit.lessons.filter(l => progress.completedLessonIds.includes(l.id)).length / currentUnit.lessons.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-1.5 bg-[#f6f1e5] rounded-lg text-[#7c6a59] group-hover:text-[#1e4631] transition-colors">
              {isDropdownOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </button>

        {/* قائمة الخيارات المنسدلة بستايل الأكورديون الأنيق */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 mt-2 bg-white border border-[#eaddca] rounded-2xl shadow-lg z-50 p-3 sm:p-4 space-y-2 max-h-[440px] overflow-y-auto text-right"
            >
              <div className="border-b border-[#f6f1e5] pb-2 mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#a6937c] block uppercase">الفهرس المنهجي التفاعلي</span>
                  <h4 className="text-xs font-black text-[#2d2219]">اختر الوحدة والدرس للانتقال إليه</h4>
                </div>
                <div className="text-[10px] bg-[#f6f1e5] text-[#1e4631] px-2.5 py-1 rounded-full font-bold self-stretch sm:self-auto text-center">
                  إجمالي المنجز: {progress.completedLessonIds.length} من {CURRICULUM.flatMap(u => u.lessons).length} دروس
                </div>
              </div>

              <div className="space-y-2">
                {CURRICULUM.map(unit => {
                  const isExpanded = expandedUnitIds.includes(unit.id);
                  const unitLessonsCount = unit.lessons.length;
                  const completedInUnitCount = unit.lessons.filter(l => progress.completedLessonIds.includes(l.id)).length;
                  const unitProgressPercent = Math.round((completedInUnitCount / unitLessonsCount) * 100);

                  return (
                    <div key={unit.id} className="border border-[#eaddca] rounded-xl overflow-hidden bg-[#fcfaf4]/30">
                      {/* زر رأس الوحدة */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUnitExpand(unit.id);
                        }}
                        className={`w-full text-right p-3 flex items-center justify-between gap-3 font-bold transition-all ${
                          selectedUnitId === unit.id 
                            ? 'bg-[#f6f1e5] text-[#1e4631]' 
                            : 'bg-white text-[#3c2f24] hover:bg-[#f6f1e5]/30'
                        }`}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#7c6a59]" /> : <ChevronDown className="w-4 h-4 text-[#7c6a59]" />}
                          <span className="text-[10px] font-mono text-[#1e4631] bg-[#ebdcb9] px-2 py-0.5 rounded-full">% {unitProgressPercent}</span>
                        </div>
                        <div className="flex-1 min-w-0 pr-1 text-right">
                          <span className="text-[9px] text-[#a6937c] block font-semibold text-right">الوحدة {unit.number}</span>
                          <h4 className="text-[11px] sm:text-xs font-black text-[#2d2219] truncate text-right">{unit.title}</h4>
                        </div>
                      </button>

                      {/* قائمة الدروس الداخلية تحت الأكورديون */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border-t border-[#eaddca]/50 p-1.5 space-y-1"
                          >
                            {unit.lessons.map(lesson => {
                              const isLessonSelected = selectedLessonId === lesson.id;
                              const isLessonDone = progress.completedLessonIds.includes(lesson.id);

                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => {
                                    setSelectedUnitId(unit.id);
                                    setSelectedLessonId(lesson.id);
                                    setIsDropdownOpen(false); // Close dropdown on select
                                  }}
                                  className={`w-full text-right p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                                    isLessonSelected
                                      ? 'bg-[#1e4631] text-white shadow-3xs'
                                      : 'text-[#3c2f24] hover:bg-[#fcfaf4]'
                                  }`}
                                >
                                  {isLessonDone ? (
                                    <CheckCircle className={`w-3.5 h-3.5 ${isLessonSelected ? 'text-white' : 'text-[#1e4631]'}`} />
                                  ) : (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isLessonSelected ? 'bg-white' : 'bg-[#eaddca]'}`} />
                                  )}
                                  <span className="flex-1 mr-2.5 text-right truncate leading-normal font-semibold">{lesson.title}</span>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 📖 شاشة تصفح وعرض محتوى الدرس التفاعلي والوسائط بكامل العرض المتاح */}
      <main className="w-full space-y-6" id="lessons-content-view">
        {/* شريط أدوات تصفح الدرس العلوي بتنسيق بني داكن وعاج مريح */}
        <div className="bg-white border border-[#eaddca] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs" id="lesson-toolbar">
          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
            {/* زر المفضلة الأكاديمية */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                isBookmarked
                  ? 'bg-[#f6f1e5] text-[#c86446] border-[#ebdcb9] shadow-3xs'
                  : 'bg-white text-[#a6937c] border-[#eaddca] hover:text-[#2d2219] hover:bg-[#fcfaf4]'
              }`}
              title="أضف للمفضلة الأكاديمية"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* زر تحديد الدرس كمنجز */}
            <button
              onClick={handleToggleCompleted}
              className={`flex items-center space-x-1.5 space-x-reverse py-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all ${
                isCompleted
                  ? 'bg-[#f6f1e5] text-[#1e4631] border-[#ebdcb9] font-extrabold shadow-3xs'
                  : 'bg-white text-[#7c6a59] border-[#eaddca] hover:text-[#2d2219] hover:bg-[#fcfaf4]'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ml-1.5 ${isCompleted ? 'fill-current text-[#1e4631]' : 'text-[#a6937c]'}`} />
              <span>{isCompleted ? 'تم إنجاز الدراسة ✓' : 'تحديد كمنجز للدراسة'}</span>
            </button>

            {/* زر منبه المراجعة والتكرار المتباعد بلون التراكوتا الفخاري */}
            <button
              onClick={() => {
                setShowSchedulePopup(!showSchedulePopup);
                setShowExportPopup(false);
              }}
              className="flex items-center space-x-1.5 space-x-reverse py-1.5 px-3.5 rounded-xl border bg-white text-[#7c6a59] border-[#eaddca] hover:text-[#2d2219] hover:bg-[#fcfaf4] text-xs font-bold transition-all relative shadow-3xs"
            >
              <Bell className="w-4 h-4 text-[#c86446] ml-1.5" />
              <span>مراجعة دورية</span>
            </button>

            {/* زر تصدير وتنزيل ملخص الدرس والوحدة */}
            <button
              onClick={() => {
                setShowExportPopup(!showExportPopup);
                setShowSchedulePopup(false);
              }}
              className={`flex items-center space-x-1.5 space-x-reverse py-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all shadow-3xs relative ${
                showExportPopup
                  ? 'bg-[#1e4631] text-white border-[#1e4631]'
                  : 'bg-white text-[#7c6a59] border-[#eaddca] hover:text-[#2d2219] hover:bg-[#fcfaf4]'
              }`}
            >
              <Download className={`w-4 h-4 ml-1.5 ${showExportPopup ? 'text-white' : 'text-emerald-600'}`} />
              <span>تصدير الملخص 📥</span>
            </button>
          </div>

          <div className="text-right">
            <h2 className="text-sm sm:text-base font-black text-[#2d2219] leading-tight">{currentLesson.title}</h2>
            <p className="text-[10px] text-[#7c6a59] font-semibold">{currentLesson.subTitle}</p>
          </div>
        </div>

        {/* نافذة جدولة التكرار المتباعد بنسق رملي ناعم */}
        <AnimatePresence>
          {showSchedulePopup && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#f6f1e5] border border-[#eaddca] p-4 rounded-2xl space-y-4 shadow-sm"
              id="spaced-scheduler-popup"
            >
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#7c6a59]">اختر دورة التكرار المتباعد المناسبة:</span>
                <h5 className="text-[#1e4631] flex items-center space-x-1.5 space-x-reverse">
                  <Activity className="w-4 h-4 text-[#c86446]" />
                  <span>جدولة منبه المراجعة الدورية</span>
                </h5>
              </div>

              <div className="flex space-x-2 space-x-reverse">
                {[1, 3, 7, 14].map(days => (
                  <button
                    key={days}
                    onClick={() => setScheduleDays(days)}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs border transition-all ${
                      scheduleDays === days
                        ? 'bg-[#1e4631] text-white border-[#1e4631] shadow-xs'
                        : 'bg-white text-[#7c6a59] border-[#eaddca] hover:bg-[#fcfaf4]'
                    }`}
                  >
                    كل {days} {days === 1 ? 'يوم' : 'أيام'}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    onAddReminder(currentLesson.id, currentLesson.title, currentUnit.title, scheduleDays);
                    setShowSchedulePopup(false);
                  }}
                  className="bg-[#c86446] hover:bg-[#b05237] text-white py-2 px-5 rounded-xl font-bold text-xs transition-all shadow-xs"
                >
                  حفظ وضبط منبه الجدولة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* نافذة تصدير وتنزيل الملخصات الدراسية */}
        <AnimatePresence>
          {showExportPopup && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#f6f1e5] border border-[#ebdcb9] p-5 rounded-2xl space-y-4 shadow-sm"
              id="lesson-exporter-popup"
            >
              <div className="flex justify-between items-center text-xs font-bold border-b border-[#eaddca] pb-2">
                <span className="text-[#7c6a59]">اختر نطاق وصيغة التصدير المناسبة للمراجعة الخارجية:</span>
                <h5 className="text-[#1e4631] flex items-center space-x-1.5 space-x-reverse font-black">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>تصدير الملخص الأكاديمي</span>
                </h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* القسم الأول: الدرس الحالي */}
                <div className="bg-white border border-[#eaddca] p-3 rounded-xl space-y-3">
                  <h6 className="text-xs font-black text-[#1e4631] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span>الدرس الحالي فقط ({currentLesson.title})</span>
                  </h6>
                  <p className="text-[10px] text-[#7c6a59] font-medium leading-relaxed">
                    تصدير تفاصيل الدرس الحالي من الشروحات، النقاط الهامة، الملاحظات الطبية، والبطاقات التعليمية.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        handleDownloadTxt('lesson');
                        setShowExportPopup(false);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#ebdcb9]/40 hover:bg-[#ebdcb9]/80 border border-[#ebdcb9] text-[#7c6a59] hover:text-[#2d2219] font-bold text-[11px] transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>ملف نصي (.txt)</span>
                    </button>
                    <button
                      onClick={() => {
                        handlePrintPDF('lesson');
                        setShowExportPopup(false);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة / PDF 🖨️</span>
                    </button>
                  </div>
                </div>

                {/* القسم الثاني: الوحدة بالكامل */}
                <div className="bg-white border border-[#eaddca] p-3 rounded-xl space-y-3">
                  <h6 className="text-xs font-black text-[#c86446] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c86446]"></span>
                    <span>الوحدة الدراسية بالكامل ({currentUnit.title})</span>
                  </h6>
                  <p className="text-[10px] text-[#7c6a59] font-medium leading-relaxed">
                    تصدير كتابي شامل لجميع الدروس المندرجة تحت هذه الوحدة في ملف واحد منسق ومهيأ للمراجعة السريعة.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        handleDownloadTxt('unit');
                        setShowExportPopup(false);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#ebdcb9]/40 hover:bg-[#ebdcb9]/80 border border-[#ebdcb9] text-[#7c6a59] hover:text-[#2d2219] font-bold text-[11px] transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>ملف نصي (.txt)</span>
                    </button>
                    <button
                      onClick={() => {
                        handlePrintPDF('unit');
                        setShowExportPopup(false);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#c86446]/10 hover:bg-[#c86446]/20 border border-[#c86446]/20 text-[#c86446] font-bold text-[11px] transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة / PDF 🖨️</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* كارت وسائط الشرح والصور التوضيحية المدمج بالكامل */}
        <div className="bg-white border border-[#eaddca] rounded-2xl p-4 space-y-3.5 shadow-3xs" id="scientific-media-customizer">
          <div className="flex justify-between items-center text-xs font-bold">
            <button
              onClick={() => setShowMediaInput(!showMediaInput)}
              className="flex items-center space-x-1.5 space-x-reverse text-[#1e4631] bg-[#f6f1e5] hover:bg-[#ebdcb9] px-3 py-1.5 rounded-xl border border-[#eaddca] transition-all text-[10px]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>تخصيص الشرح (صورة أو فيديو)</span>
            </button>
            <div className="flex items-center space-x-1.5 space-x-reverse text-[#2d2219] font-bold">
              <Image className="w-4 h-4 text-[#1e4631]" />
              <span>وسائط الشرح العلمية للدرس</span>
            </div>
          </div>

          <AnimatePresence>
            {showMediaInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#fcfaf4] border border-[#eaddca] rounded-xl p-3.5 space-y-3 overflow-hidden text-xs"
              >
                <p className="text-[#7c6a59] font-bold leading-relaxed text-[10px]">
                  أضف رابط صورة علمية حقيقية أو رابط فيديو شرح (مثل رابط فيديو أو صورة من قوقل درايف Google Drive أو أي مصدر خارجي):
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="ضع رابط صورة أو فيديو هنا..."
                    value={tempMediaUrl}
                    onChange={(e) => setTempMediaUrl(e.target.value)}
                    className="flex-1 bg-white border border-[#eaddca] rounded-xl py-2 px-3 text-xs text-[#2d2219] font-bold focus:outline-none focus:border-[#1e4631] text-left"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        localStorage.setItem(`lesson_media_${currentLesson.id}`, tempMediaUrl);
                        setCustomMediaUrl(tempMediaUrl);
                        setShowMediaInput(false);
                      }}
                      className="bg-[#1e4631] hover:bg-[#122b1e] text-white py-2 px-4 rounded-xl font-bold"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem(`lesson_media_${currentLesson.id}`);
                        setCustomMediaUrl('');
                        setTempMediaUrl('');
                        setShowMediaInput(false);
                      }}
                      className="bg-[#f6f1e5] hover:bg-[#ebdcb9] text-[#7c6a59] py-2 px-3 rounded-xl font-semibold flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 ml-1" />
                      <span>إعادة تعيين</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* البلوك الفعلي لعرض الصورة العلمية الحية للدرس */}
          <div className="relative rounded-2xl overflow-hidden bg-[#2d2219] border border-[#eaddca] shadow-sm">
            {customMediaUrl ? (
              customMediaUrl.includes('drive.google.com') ? (
                (() => {
                  const match = customMediaUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                  const embedUrl = match && match[1] ? `https://drive.google.com/file/d/${match[1]}/preview` : customMediaUrl;
                  return (
                    <div className="relative aspect-video w-full h-[320px]">
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full border-0 rounded-2xl"
                        allow="autoplay; encrypted-media; fullscreen"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  );
                })()
              ) : customMediaUrl.endsWith('.mp4') || customMediaUrl.endsWith('.webm') ? (
                <div className="relative aspect-video w-full h-[320px] bg-black">
                  <video
                    src={customMediaUrl}
                    controls
                    className="w-full h-full rounded-2xl"
                  />
                </div>
              ) : (
                <div className="relative h-80 w-full">
                  <img
                    src={getDirectGoogleDriveImageUrl(customMediaUrl)}
                    alt={currentLesson.title}
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getDirectGoogleDriveImageUrl(LESSON_DEFAULT_IMAGES[currentLesson.id] || LESSON_DEFAULT_IMAGES['u1_l1']);
                    }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#2d2219]/90 via-[#2d2219]/40 to-transparent p-4 text-right">
                    <span className="text-[10px] font-black bg-[#c86446] text-white px-2 py-0.5 rounded-full mb-1 inline-block">وسائط مخصصة من المدرس</span>
                    <h5 className="text-xs font-extrabold text-white leading-tight">{currentLesson.title}</h5>
                  </div>
                </div>
              )
            ) : (
              <div className="relative h-80 w-full">
                <img
                  src={getDirectGoogleDriveImageUrl(LESSON_DEFAULT_IMAGES[currentLesson.id] || LESSON_DEFAULT_IMAGES['u1_l1'])}
                  alt={currentLesson.title}
                  className="w-full h-full object-cover rounded-2xl saturate-[1.02]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#2d2219]/90 via-[#2d2219]/40 to-transparent p-4 text-right">
                  <span className="text-[10px] font-black bg-[#1e4631] text-white px-2 py-0.5 rounded-full mb-1 inline-block">صورة علمية حقيقية توضيحية</span>
                  <h5 className="text-xs font-extrabold text-white leading-tight">{currentLesson.title}</h5>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* بانر الانتقال السريع للمعمل الافتراضي المحدث بهوية التراكوتا والنيلي الدافئ */}
        {onNavigateToLab && (
          <div className="bg-[#f6f1e5]/60 border border-[#eaddca] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs animate-fadeIn" id="quick-lab-link">
            <div className="text-right flex items-start space-x-3 space-x-reverse">
              <div className="bg-[#ebdcb9] text-[#1e4631] p-2.5 rounded-xl border border-[#eaddca] mt-0.5">
                <Beaker className="w-5 h-5 text-[#1e4631]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-[#1e4631]">هل تريد إجراء التجربة المعملية لهذا الدرس؟</h4>
                <p className="text-[10px] font-bold text-[#7c6a59] leading-relaxed">
                  يحتوي هذا الدرس على محاكاة معملية تفاعلية لتطبيق المفاهيم وتركيز الجوانب العملية والفسيولوجية فوراً.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const targetLabId = LESSON_TO_LAB_MAP[currentLesson.id] || `lab_${currentLesson.id}`;
                onNavigateToLab(targetLabId);
              }}
              className="bg-[#1e4631] hover:bg-[#122b1e] text-white font-black text-xs py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 space-x-reverse shrink-0 self-end sm:self-center"
            >
              <span>إجراء التجربة التفاعلية الآن</span>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            </button>
          </div>
        )}

        {/* بلوك رندر الشرح والمحتوى المقروء المنسق مسبقاً */}
        <div className="bg-white border border-[#eaddca]/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs text-right" id="lesson-text-content-card">
          <div className="border-b border-[#ebdcb9] pb-3 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex items-center gap-2">
              {viewMode === 'flipbook' && (
                <button
                  onClick={() => setIsBookFullscreen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#1e4631]/10 text-[#1e4631] hover:bg-[#1e4631]/20 transition-all flex items-center space-x-1.5 space-x-reverse border border-[#1e4631]/25 cursor-pointer shadow-3xs"
                  title="عرض الكتاب بملء الشاشة"
                >
                  <Maximize2 className="w-3.5 h-3.5 ml-1" />
                  <span>ملء الشاشة</span>
                </button>
              )}

              <div className="flex bg-[#fcfaf4] p-1 rounded-xl border border-[#eaddca]/60 shadow-3xs">
                <button
                  onClick={() => setViewMode('flipbook')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                    viewMode === 'flipbook'
                      ? 'bg-[#1e4631] text-white shadow-3xs'
                      : 'text-[#7c6a59] hover:bg-[#f6f1e5]/40'
                  }`}
                >
                  <span>📘 كتاب تفاعلي (فليب بوك)</span>
                </button>
                <button
                  onClick={() => setViewMode('continuous')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                    viewMode === 'continuous'
                      ? 'bg-[#1e4631] text-white shadow-3xs'
                      : 'text-[#7c6a59] hover:bg-[#f6f1e5]/40'
                  }`}
                >
                  <span>📜 قراءة سردية متصلة</span>
                </button>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#a6937c] block">نمط العرض التعليمي المطور</span>
              <span className="text-xs font-black text-[#1e4631]">كتاب الطالب التفاعلي</span>
            </div>
          </div>

          {/* Mobile Tab Toggle for Inline Flipbook */}
          {viewMode === 'flipbook' && (
            <div className="flex lg:hidden items-center justify-center bg-[#fcfaf4] p-1 rounded-xl border border-[#eaddca]/60 shadow-3xs w-full max-w-sm mx-auto mb-2">
              <button
                onClick={() => setMobileActiveTab('content')}
                className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-black transition-all ${
                  mobileActiveTab === 'content'
                    ? 'bg-[#1e4631] text-white shadow-3xs'
                    : 'text-[#7c6a59] hover:text-[#1e4631]'
                }`}
              >
                📘 الشرح والمحتوى
              </button>
              <button
                onClick={() => setMobileActiveTab('image')}
                className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-black transition-all ${
                  mobileActiveTab === 'image'
                    ? 'bg-[#1e4631] text-white shadow-3xs'
                    : 'text-[#7c6a59] hover:text-[#1e4631]'
                }`}
              >
                🎨 الشكل التوضيحي
              </button>
            </div>
          )}

          {viewMode === 'flipbook' ? (
            <div className="space-y-6">
              {/* Book Body - Standardized elegant fixed height for stability */}
              <div className="relative bg-[#faf7f0] rounded-2xl border-2 border-[#e3d5c1] shadow-lg overflow-hidden lg:h-[580px] flex flex-col lg:grid lg:grid-cols-2">
                {/* Central spine fold (visible on desktop) */}
                <div className="hidden lg:block absolute inset-y-0 left-1/2 w-[3px] bg-gradient-to-r from-transparent via-[#d6c4aa] to-transparent z-20 pointer-events-none" />
                <div className="hidden lg:block absolute inset-y-0 left-1/2 w-[16px] -translate-x-1/2 bg-gradient-to-r from-black/5 via-transparent to-black/5 z-10 pointer-events-none" />

                {/* Left Page: Beautiful Dynamic Image/Illustration Page */}
                <div className={`relative p-6 bg-[#fcfaf5] border-b lg:border-b-0 lg:border-l border-[#ebdcb9] flex-col justify-between min-h-[300px] lg:h-full overflow-hidden ${
                  mobileActiveTab === 'image' ? 'flex' : 'hidden lg:flex'
                }`}>
                  {/* Header / Watermark of Left Page */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#a6937c] border-b border-[#ebdcb9]/40 pb-2 mb-4 shrink-0">
                    <span>أطلس الأحياء الملون</span>
                    <span className="flex items-center gap-1">
                      <span>رسم توضيحي</span>
                      <Image className="w-3.5 h-3.5 text-[#c86446]" />
                    </span>
                  </div>

                  {/* Main Image View */}
                  <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {(() => {
                        const currentSlide = lessonSlides[currentSlideIdx] || lessonSlides[0];
                        const autoMatchedImg = getScientificImageByText(currentSlide?.title || '', currentSlide?.blocks?.map(b => b.text || '').join(' ') || '', currentLesson.id);
                        const activeSlideImg = slideCustomImages[currentSlideIdx] || autoMatchedImg;
                        
                        return (
                          <motion.div
                            key={currentSlideIdx}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-4 w-full flex flex-col items-center justify-center min-h-0 h-full"
                          >
                            <div className="relative rounded-xl overflow-hidden shadow-xs border border-[#eaddca]/80 aspect-video w-full lg:h-[260px] lg:w-full bg-slate-900 group shrink-0">
                              <img
                                src={getDirectGoogleDriveImageUrl(activeSlideImg)}
                                alt={currentSlide?.title}
                                className="w-full h-full object-cover saturate-[1.05] group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                              
                              {/* Caption inside the image */}
                              <div className="absolute bottom-3 right-3 left-3 text-right">
                                <span className="text-[9px] font-black bg-[#ebdcb9]/90 text-[#3c2f24] px-2 py-0.5 rounded-full mb-1 inline-block">
                                  شكل توضيحي رقم {currentSlideIdx + 1}
                                </span>
                                <p className="text-[11px] font-black text-white truncate leading-tight">
                                  {currentSlide?.title}
                                </p>
                              </div>
                            </div>

                            {/* Edit Image Link (Allows the user to paste their own custom image URL later) */}
                            <div className="flex justify-end w-full">
                              {slideImageInputIdx === currentSlideIdx ? (
                                <div className="bg-[#f6f1e5] border border-[#ebdcb9] p-2.5 rounded-xl space-y-2 w-full text-right shadow-3xs">
                                  <p className="text-[10px] font-bold text-[#7c6a59]">الصق رابط الصورة العلمية المخصصة لهذه الفقرة:</p>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="https://example.com/image.jpg"
                                      value={slideImageInputUrl}
                                      onChange={(e) => setSlideImageInputUrl(e.target.value)}
                                      className="flex-1 bg-white border border-[#eaddca] rounded-lg py-1 px-2.5 text-[11px] font-bold text-[#2d2219] focus:outline-none focus:border-[#1e4631] text-left"
                                    />
                                    <button
                                      onClick={() => {
                                        if (slideImageInputUrl.trim()) {
                                          localStorage.setItem(`slide_media_${currentLesson.id}_${currentSlideIdx}`, slideImageInputUrl.trim());
                                          setSlideCustomImages(prev => ({ ...prev, [currentSlideIdx]: slideImageInputUrl.trim() }));
                                        }
                                        setSlideImageInputIdx(null);
                                      }}
                                      className="bg-[#1e4631] hover:bg-[#122b1e] text-white py-1 px-3 rounded-lg text-[10px] font-black"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      onClick={() => {
                                        localStorage.removeItem(`slide_media_${currentLesson.id}_${currentSlideIdx}`);
                                        setSlideCustomImages(prev => {
                                          const copy = { ...prev };
                                          delete copy[currentSlideIdx];
                                          return copy;
                                        });
                                        setSlideImageInputIdx(null);
                                      }}
                                      className="bg-white hover:bg-slate-50 text-[#c86446] border border-[#eaddca] py-1 px-2 rounded-lg text-[10px] font-bold"
                                    >
                                      حذف
                                    </button>
                                    <button
                                      onClick={() => setSlideImageInputIdx(null)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 py-1 px-2 rounded-lg text-[10px] font-semibold"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSlideImageInputIdx(currentSlideIdx);
                                    setSlideImageInputUrl(slideCustomImages[currentSlideIdx] || '');
                                  }}
                                  className="text-[10px] font-bold text-[#1e4631] hover:text-[#122b1e] flex items-center space-x-1 space-x-reverse bg-[#1e4631]/5 hover:bg-[#1e4631]/10 px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  <Settings className="w-3 h-3 ml-1" />
                                  <span>تخصيص صورة الشريحة</span>
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>

                  {/* Footer Watermark of Left Page */}
                  <div className="mt-4 border-t border-[#ebdcb9]/40 pt-2 flex justify-between items-center text-[9px] text-[#a6937c] font-medium shrink-0">
                    <span>صفحة {currentSlideIdx * 2 + 1}</span>
                    <span className="font-semibold">{currentLesson.title}</span>
                  </div>
                </div>

                {/* Right Page: Text Content & Formatting */}
                <div className={`relative p-6 sm:p-8 bg-white flex-col justify-between lg:h-full overflow-hidden ${
                  mobileActiveTab === 'content' ? 'flex' : 'hidden lg:flex'
                }`}>
                  {/* Header of Right Page */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#a6937c] border-b border-[#ebdcb9]/40 pb-2 mb-4 shrink-0">
                    <span className="font-mono text-[#1e4631] bg-[#1e4631]/5 px-2 py-0.5 rounded-full">
                      القسم {currentSlideIdx + 1} من {lessonSlides.length}
                    </span>
                    <span>محتوى الدرس الدراسي</span>
                  </div>

                  {/* Main Content View with Page turning anim & elegant inside scrolling */}
                  <div className="flex-1 overflow-y-auto pr-1 max-h-[380px] lg:max-h-[420px] scrollbar-thin scrollbar-thumb-[#1e4631]/20 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">
                      {(() => {
                        const currentSlide = lessonSlides[currentSlideIdx] || lessonSlides[0];
                        if (!currentSlide) return null;
                        return (
                          <motion.div
                            key={currentSlideIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-4 text-right pb-4"
                          >
                            {/* Slide Title */}
                            <h3 className="text-sm sm:text-base font-black text-[#1e4631] border-r-4 border-[#1e4631] pr-3 mb-2 leading-snug">
                              {currentSlide.title}
                            </h3>

                            {/* Render all blocks in slide */}
                            <div className="text-[#3c2f24] leading-relaxed text-xs sm:text-sm space-y-3.5" style={{ lineHeight: '1.8' }}>
                              {currentSlide.blocks.map((block, bIdx) => {
                                if ((block.type === 'heading2' || block.type === 'heading3') && bIdx === 0) {
                                  return null;
                                }
                                
                                switch (block.type) {
                                  case 'heading2':
                                    return (
                                      <h2 key={bIdx} className="text-xs sm:text-sm font-black text-[#1e4631] mt-3 mb-2 border-r-2 border-[#1e4631] pr-2">
                                        {parseBoldText(block.text || '')}
                                      </h2>
                                    );
                                  case 'heading3':
                                    return (
                                      <h3 key={bIdx} className="text-xs sm:text-sm font-bold text-[#1e4631] mt-3 mb-2 border-r-2 border-[#c86446] pr-2">
                                        {parseBoldText(block.text || '')}
                                      </h3>
                                    );
                                  case 'heading4':
                                    return (
                                      <h4 key={bIdx} className="text-[11px] sm:text-xs font-bold text-[#7c6a59] mt-2 mb-1 pr-1">
                                        {parseBoldText(block.text || '')}
                                      </h4>
                                    );
                                  case 'definition':
                                    return (
                                      <div key={bIdx} className="bg-[#1e4631]/5 border-r-4 border-[#1e4631] p-3 rounded-l-xl text-[#2d2219] font-semibold leading-relaxed my-2 text-[11px] sm:text-xs shadow-3xs flex items-start space-x-2 space-x-reverse">
                                        <Info className="w-4 h-4 text-[#1e4631] shrink-0 ml-1.5 mt-0.5" />
                                        <p className="flex-1 whitespace-pre-line leading-relaxed">{parseBoldText(block.text || '')}</p>
                                      </div>
                                    );
                                  case 'list':
                                    return (
                                      <div key={bIdx} className="space-y-2 my-2">
                                        {block.items?.map((item, idx) => {
                                          if (item.isBullet) {
                                            const content = item.text.replace(/^[\*\-]\s*/, '');
                                            return (
                                              <div key={idx} className="flex items-start space-x-2 space-x-reverse bg-[#fcfaf4] border border-[#eaddca]/40 p-2 px-2.5 rounded-lg">
                                                <CheckCircle className="w-3.5 h-3.5 text-[#1e4631] mt-0.5 shrink-0 ml-1.5" />
                                                <div className="text-[11px] sm:text-xs text-[#3c2f24] leading-relaxed font-semibold flex-1">
                                                  {parseBoldText(content)}
                                                </div>
                                              </div>
                                            );
                                          }
                                          if (item.isNumbered) {
                                            const match = item.text.match(/^(\d+)\.\s*(.*)/);
                                            if (match) {
                                              const num = match[1];
                                              const content = match[2];
                                              return (
                                                <div key={idx} className="flex items-start space-x-2 space-x-reverse bg-[#fcfaf4] border border-[#eaddca]/40 p-2 px-2.5 rounded-lg">
                                                  <div className="w-4 h-4 rounded-full bg-[#1e4631] text-white font-mono text-[9px] font-black flex items-center justify-center shrink-0 ml-1.5 mt-0.5">
                                                    {num}
                                                  </div>
                                                  <div className="text-[11px] sm:text-xs text-[#3c2f24] leading-relaxed font-semibold flex-1">
                                                    {parseBoldText(content)}
                                                  </div>
                                                </div>
                                              );
                                            }
                                          }
                                          return (
                                            <p key={idx} className="text-[#3c2f24] leading-relaxed text-[11px] sm:text-xs font-semibold pr-2">
                                              {parseBoldText(item.text)}
                                            </p>
                                          );
                                        })}
                                      </div>
                                    );
                                  case 'table': {
                                    const rows = block.rows || [];
                                    const validRows = rows.map(r => r.trim()).filter(r => r !== '' && !r.includes(':---') && !r.includes('---:'));
                                    if (validRows.length === 0) return null;
                                    
                                    const parsedRows = validRows.map(row => {
                                      const cleanRow = row.replace(/^\|/, '').replace(/\|$/, '');
                                      return cleanRow.split('|').map(cell => cell.trim());
                                    });
                                    
                                    const headers = parsedRows[0];
                                    const bodyRows = parsedRows.slice(1);
                                    
                                    return (
                                      <div key={bIdx} className="overflow-x-auto my-3 border border-[#eaddca]/50 rounded-xl shadow-3xs">
                                        <table className="w-full text-right border-collapse text-[10px] sm:text-[11px]">
                                          <thead>
                                            <tr className="bg-[#f6f1e5] border-b border-[#eaddca] text-[#1e4631] font-black">
                                              {headers.map((header, hidx) => (
                                                <th key={hidx} className="p-2 text-right">
                                                  {parseBoldText(header)}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[#eaddca]/30 bg-white">
                                            {bodyRows.map((rowCells, rIdx) => (
                                              <tr key={rIdx} className="hover:bg-[#fdfbf7]/50 transition-colors">
                                                {rowCells.map((cell, cIdx) => (
                                                  <td key={cIdx} className="p-2 text-[#3c2f24] leading-relaxed font-bold">
                                                    {parseBoldText(cell)}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  }
                                  case 'paragraph':
                                  default:
                                    return (
                                      <p key={bIdx} className="text-[#3c2f24] leading-relaxed text-[11px] sm:text-xs font-semibold whitespace-pre-line my-1.5">
                                        {parseBoldText(block.text || '')}
                                      </p>
                                    );
                                }
                              })}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>

                  {/* Footer of Right Page */}
                  <div className="mt-6 border-t border-[#ebdcb9]/40 pt-2 flex justify-between items-center text-[9px] text-[#a6937c] font-medium shrink-0">
                    <span>وزارة التربية والتعليم</span>
                    <span>صفحة {(currentSlideIdx * 2) + 2}</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump Slide Thumbnails / Bookmarks bar */}
              <div className="bg-[#fcfaf4] p-3 rounded-xl border border-[#ebdcb9] flex flex-col md:flex-row items-center justify-between gap-3">
                <span className="text-[10px] text-[#7c6a59] font-black shrink-0">فهرس فصول الدرس السريع:</span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {lessonSlides.map((slide, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIdx(idx)}
                      className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
                        currentSlideIdx === idx
                          ? 'bg-[#1e4631] text-white border-[#1e4631] shadow-2xs'
                          : 'bg-white text-[#7c6a59] border-[#eaddca] hover:bg-[#f6f1e5]/40'
                      }`}
                    >
                      {slide.title.length > 25 ? slide.title.slice(0, 25) + '...' : slide.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons for Page Flipping */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (currentSlideIdx < lessonSlides.length - 1) {
                      setCurrentSlideIdx(prev => prev + 1);
                    }
                  }}
                  disabled={currentSlideIdx === lessonSlides.length - 1}
                  className="flex items-center space-x-1 space-x-reverse bg-[#1e4631] hover:bg-[#122b1e] text-white py-2.5 px-6 rounded-xl text-xs font-black disabled:opacity-30 disabled:pointer-events-none shadow-xs transition-all cursor-pointer"
                >
                  <span>الصفحة التالية</span>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </button>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs font-black text-[#2d2219]">
                    الفقرة {currentSlideIdx + 1} من {lessonSlides.length}
                  </span>
                  <span className="text-[10px] text-[#a6937c] font-medium bg-[#ebdcb9]/40 px-2.5 py-1 rounded-full border border-[#ebdcb9]/60">
                    {Math.round(((currentSlideIdx + 1) / lessonSlides.length) * 100)}% مقروءة
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (currentSlideIdx > 0) {
                      setCurrentSlideIdx(prev => prev - 1);
                    }
                  }}
                  disabled={currentSlideIdx === 0}
                  className="flex items-center space-x-1 space-x-reverse bg-[#1e4631] hover:bg-[#122b1e] text-white py-2.5 px-6 rounded-xl text-xs font-black disabled:opacity-30 disabled:pointer-events-none shadow-xs transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 ml-1" />
                  <span>الصفحة السابقة</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[#3c2f24] text-right leading-relaxed text-sm space-y-4" style={{ lineHeight: '1.85' }} id="lesson-content-body">
              {lessonBlocks.map((block, index) => {
                switch (block.type) {
                  case 'divider':
                    return <hr key={index} className="border-[#eaddca]/60 my-6" />;
                  
                  case 'heading2':
                    return (
                      <h2 key={index} className="text-base sm:text-lg font-black text-[#1e4631] mt-8 mb-4 border-r-4 border-[#1e4631] pr-3">
                        {parseBoldText(block.text || '')}
                      </h2>
                    );
                  
                  case 'heading3':
                    return (
                      <h3 key={index} className="text-sm sm:text-base font-black text-[#1e4631] mt-6 mb-3 border-r-4 border-[#c86446] pr-3">
                        {parseBoldText(block.text || '')}
                      </h3>
                    );
                  
                  case 'heading4':
                    return (
                      <h4 key={index} className="text-xs sm:text-sm font-bold text-[#7c6a59] mt-5 mb-2 pr-2">
                        {parseBoldText(block.text || '')}
                      </h4>
                    );
                  
                  case 'definition':
                    return (
                      <div key={index} className="bg-[#1e4631]/5 border-r-4 border-[#1e4631] p-4 rounded-l-2xl text-[#2d2219] font-semibold leading-relaxed my-4 text-xs sm:text-sm shadow-3xs flex items-start space-x-3 space-x-reverse">
                        <Info className="w-5 h-5 text-[#1e4631] shrink-0 ml-2.5 mt-0.5" />
                        <p className="flex-1 whitespace-pre-line leading-relaxed">{parseBoldText(block.text || '')}</p>
                      </div>
                    );
                  
                  case 'list':
                    return (
                      <div key={index} className="space-y-3 my-4">
                        {block.items?.map((item, idx) => {
                          if (item.isBullet) {
                            const content = item.text.replace(/^[\*\-]\s*/, '');
                            return (
                              <div key={idx} className="flex items-start space-x-2.5 space-x-reverse bg-[#fcfaf4] border border-[#eaddca]/40 p-3.5 rounded-xl hover:bg-[#f6f1e5]/40 transition-colors duration-200">
                                <CheckCircle className="w-4 h-4 text-[#1e4631] mt-0.5 shrink-0 ml-2" />
                                <div className="text-xs sm:text-sm text-[#3c2f24] leading-relaxed font-semibold flex-1">
                                  {parseBoldText(content)}
                                </div>
                              </div>
                            );
                          }
                          if (item.isNumbered) {
                            const match = item.text.match(/^(\d+)\.\s*(.*)/);
                            if (match) {
                              const num = match[1];
                              const content = match[2];
                              return (
                                <div key={idx} className="flex items-start space-x-2.5 space-x-reverse bg-[#fcfaf4] border border-[#eaddca]/40 p-3.5 rounded-xl hover:bg-[#f6f1e5]/40 transition-colors duration-200">
                                  <div className="w-5 h-5 rounded-full bg-[#1e4631] text-white font-mono text-[10px] font-black flex items-center justify-center shrink-0 ml-2 mt-0.5">
                                    {num}
                                  </div>
                                  <div className="text-xs sm:text-sm text-[#3c2f24] leading-relaxed font-semibold flex-1">
                                    {parseBoldText(content)}
                                  </div>
                                </div>
                              );
                            }
                          }
                          return (
                            <p key={idx} className="text-[#3c2f24] leading-relaxed text-xs sm:text-sm font-semibold pr-2">
                              {parseBoldText(item.text)}
                            </p>
                          );
                        })}
                      </div>
                    );
                  
                  case 'table': {
                    const rows = block.rows || [];
                    const validRows = rows.map(r => r.trim()).filter(r => r !== '' && !r.includes(':---') && !r.includes('---:'));
                    if (validRows.length === 0) return null;
                    
                    const parsedRows = validRows.map(row => {
                      const cleanRow = row.replace(/^\|/, '').replace(/\|$/, '');
                      return cleanRow.split('|').map(cell => cell.trim());
                    });
                    
                    const headers = parsedRows[0];
                    const bodyRows = parsedRows.slice(1);
                    
                    return (
                      <div key={index} className="overflow-x-auto my-6 border border-[#eaddca]/60 rounded-2xl shadow-3xs">
                        <table className="w-full text-right border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-[#f6f1e5] border-b border-[#eaddca] text-[#1e4631] font-black">
                              {headers.map((header, idx) => (
                                <th key={idx} className="p-3 sm:p-4 text-right">
                                  {parseBoldText(header)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#eaddca]/30 bg-white">
                            {bodyRows.map((rowCells, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-[#fdfbf7]/50 transition-colors">
                                {rowCells.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="p-3 sm:p-4 text-[#3c2f24] leading-relaxed font-bold">
                                    {parseBoldText(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  
                  case 'paragraph':
                  default:
                    return (
                      <p key={index} className="text-[#3c2f24] leading-relaxed text-xs sm:text-sm font-semibold whitespace-pre-line my-3">
                        {parseBoldText(block.text || '')}
                      </p>
                    );
                }
              })}
            </div>
          )}
        </div>

        {/* المخططات التشريحية إن وجدت */}
        {currentLesson.diagramId && (
          <div className="bg-white border border-[#eaddca] rounded-2xl p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-[#7c6a59] uppercase tracking-wider mb-2 border-b border-[#f6f1e5] pb-1.5">مخطط تشريحي فسيولوجي تفاعلي مصاحب:</h4>
            <InteractiveDiagram diagramId={currentLesson.diagramId} />
          </div>
        )}

        {/* نقاط ملخص الوزارة والملاحظات المنهجية المحدثة لونياً */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-white border border-[#eaddca] rounded-2xl p-5 space-y-3 shadow-3xs text-right">
            <h4 className="text-xs font-bold text-[#1e4631] flex items-center space-x-1.5 space-x-reverse border-b border-[#f6f1e5] pb-2">
              <CheckCircle className="w-4 h-4 ml-1.5 text-[#1e4631]" />
              <span>النقاط الجوهرية المستخلصة (الملخص):</span>
            </h4>
            <ul className="space-y-2 text-xs text-[#3c2f24]">
              {currentLesson.keyTakeaways.map((point, idx) => (
                <li key={idx} className="leading-relaxed font-semibold flex items-start space-x-1 space-x-reverse">
                  <span className="text-[#1e4631] font-black ml-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {currentLesson.healthTips && (
            <div className="bg-[#f6f1e5]/30 border border-[#ebdcb9] rounded-2xl p-5 space-y-3 shadow-3xs text-right">
              <h4 className="text-xs font-bold text-[#c86446] flex items-center space-x-1.5 space-x-reverse border-b border-[#ebdcb9] pb-2">
                <AlertCircle className="w-4 h-4 ml-1.5 text-[#c86446]" />
                <span>نصائح وملاحظات منهج الوزارة:</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#3c2f24]">
                {currentLesson.healthTips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed font-semibold flex items-start space-x-1 space-x-reverse">
                    <span className="text-[#c86446] font-bold ml-1">★</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* بطاقات المذاكرة والتحصيل التفاعلية */}
        {currentLesson.flashcards && currentLesson.flashcards.length > 0 && (
          <div className="bg-[#fcfaf4] border border-[#eaddca]/60 rounded-3xl p-6 space-y-4 shadow-xs" id="flashcards-panel">
            <div className="flex justify-between items-center text-xs font-bold border-b border-[#ebdcb9] pb-3">
              <span className="text-[#a6937c] font-mono font-bold">البطاقة {activeCardIdx + 1} من {currentLesson.flashcards.length}</span>
              <h4 className="text-[#1e4631] font-black">اختبر حفظك الاسترجاعي: بطاقات المذاكرة التفاعلية</h4>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-md h-48 text-right focus:outline-none block relative group"
              >
                <div className={`w-full h-full bg-white border border-[#eaddca] rounded-3xl p-6 flex flex-col justify-between shadow-3xs cursor-pointer text-right transition-all duration-300 hover:shadow-sm ${isFlipped ? 'ring-2 ring-[#1e4631]/20' : ''}`}>
                  {!isFlipped ? (
                    <div className="flex flex-col justify-between h-full space-y-3">
                      <span className="text-[10px] font-bold text-[#c86446] uppercase tracking-wider block">السؤال الاختباري السريع:</span>
                      <p className="text-xs sm:text-sm font-black text-[#2d2219] leading-relaxed text-right flex-1 flex items-center justify-center">
                        {currentLesson.flashcards[activeCardIdx].question}
                      </p>
                      <span className="text-[9px] text-[#1e4631] text-center font-bold block bg-[#1e4631]/5 py-1.5 rounded-xl group-hover:bg-[#1e4631]/10 transition-colors">انقر لعرض الإجابة النموذجية الفورية 👆</span>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between h-full space-y-3">
                      <span className="text-[10px] font-bold text-[#1e4631] uppercase tracking-wider block">الإجابة الصحيحة النموذجية:</span>
                      <p className="text-xs sm:text-sm font-bold text-[#3c2f24] leading-relaxed text-right flex-1 flex items-center justify-center">
                        {currentLesson.flashcards[activeCardIdx].answer}
                      </p>
                      <span className="text-[9px] text-[#c86446] text-center font-bold block bg-[#c86446]/5 py-1.5 rounded-xl group-hover:bg-[#c86446]/10 transition-colors">انقر للقلب والرجوع للسؤال 🔄</span>
                    </div>
                  )}
                </div>
              </button>

              <div className="flex items-center justify-between w-full max-w-md mt-4">
                <button
                  onClick={() => {
                    setActiveCardIdx(prev => Math.min(currentLesson.flashcards!.length - 1, prev + 1));
                    setIsFlipped(false);
                  }}
                  disabled={activeCardIdx === currentLesson.flashcards.length - 1}
                  className="flex items-center space-x-1 space-x-reverse bg-white hover:bg-[#f6f1e5]/40 text-[#3c2f24] border border-[#eaddca]/80 py-2 px-4 rounded-xl text-[10px] font-extrabold disabled:opacity-30 shadow-3xs transition-all"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                </button>

                <button
                  onClick={() => {
                    setActiveCardIdx(prev => Math.max(0, prev - 1));
                    setIsFlipped(false);
                  }}
                  disabled={activeCardIdx === 0}
                  className="flex items-center space-x-1 space-x-reverse bg-white hover:bg-[#f6f1e5]/40 text-[#3c2f24] border border-[#eaddca]/80 py-2 px-4 rounded-xl text-[10px] font-extrabold disabled:opacity-30 shadow-3xs transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  <span>السابق</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {isBookFullscreen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#ebdcb9]/45 backdrop-blur-md p-0 sm:p-4 md:p-6 flex flex-col items-center justify-center text-right animate-fadeIn" id="book-fullscreen-container">
          <div className="bg-[#faf7f0] w-full h-full max-w-7xl rounded-none sm:rounded-3xl border-0 sm:border-3 border-[#e3d5c1] shadow-2xl overflow-hidden flex flex-col relative">
            
            {/* Elegant Header of Fullscreen Book - Responsive Layout */}
            <div className="bg-white border-b border-[#eaddca]/80 p-3 sm:p-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <button
                  onClick={() => setIsBookFullscreen(false)}
                  className="flex items-center space-x-1.5 space-x-reverse bg-rose-600 hover:bg-rose-700 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/15 cursor-pointer shrink-0"
                >
                  <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span>إغلاق</span>
                </button>

                {/* Mobile & Tablet Page Toggle - Hidden on lg (Desktop) */}
                <div className="flex lg:hidden items-center bg-[#f6f1e5] p-0.5 sm:p-1 rounded-xl border border-[#eaddca] shrink-0">
                  <button
                    onClick={() => setMobileActiveTab('content')}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all ${
                      mobileActiveTab === 'content'
                        ? 'bg-[#1e4631] text-white shadow-3xs'
                        : 'text-[#7c6a59] hover:text-[#1e4631]'
                    }`}
                  >
                    الشرح والمحتوى
                  </button>
                  <button
                    onClick={() => setMobileActiveTab('image')}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all ${
                      mobileActiveTab === 'image'
                        ? 'bg-[#1e4631] text-white shadow-3xs'
                        : 'text-[#7c6a59] hover:text-[#1e4631]'
                    }`}
                  >
                    الشكل التوضيحي
                  </button>
                </div>
              </div>

              <div className="text-center sm:text-right w-full sm:w-auto shrink-0 sm:shrink">
                <span className="hidden md:inline-block text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mb-0.5">كتاب الطالب التفاعلي - وضع ملء الشاشة</span>
                <h3 className="text-xs sm:text-sm font-black text-[#1e4631] line-clamp-1">{currentLesson.title}</h3>
              </div>
            </div>

            {/* Dual Page View in Fullscreen */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 relative min-h-0 bg-[#faf7f0]">
              {/* Central Spine Fold */}
              <div className="hidden lg:block absolute inset-y-0 left-1/2 w-[3px] bg-gradient-to-r from-transparent via-[#d6c4aa] to-transparent z-20 pointer-events-none" />
              <div className="hidden lg:block absolute inset-y-0 left-1/2 w-[16px] -translate-x-1/2 bg-gradient-to-r from-black/5 via-transparent to-black/5 z-10 pointer-events-none" />

              {/* Left Page (Image/Illustration) - Hidden on mobile if content is active */}
              <div className={`relative p-4 sm:p-6 lg:p-8 bg-[#fcfaf5] border-b lg:border-b-0 lg:border-l border-[#ebdcb9] flex-col justify-between overflow-hidden h-full min-h-0 ${
                mobileActiveTab === 'image' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center text-[10px] font-bold text-[#a6937c] border-b border-[#ebdcb9]/40 pb-2 mb-3 sm:mb-4 shrink-0">
                  <span>أطلس الأحياء الملون - شكل توضيحي عالي الدقة</span>
                  <span className="flex items-center gap-1">
                    <span>رسم توضيحي</span>
                    <Image className="w-3.5 h-3.5 text-[#c86446]" />
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden py-2 sm:py-4">
                  <AnimatePresence mode="wait">
                    {(() => {
                      const currentSlide = lessonSlides[currentSlideIdx] || lessonSlides[0];
                      const autoMatchedImg = getScientificImageByText(currentSlide?.title || '', currentSlide?.blocks?.map(b => b.text || '').join(' ') || '', currentLesson.id);
                      const activeSlideImg = slideCustomImages[currentSlideIdx] || autoMatchedImg;

                      return (
                        <motion.div
                          key={currentSlideIdx}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25 }}
                          className="w-full h-full flex flex-col items-center justify-center min-h-0"
                        >
                          <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#eaddca] w-full max-w-2xl h-full max-h-[45vh] lg:max-h-[380px] bg-slate-900 group shrink-0">
                            <img
                              src={getDirectGoogleDriveImageUrl(activeSlideImg)}
                              alt={currentSlide?.title}
                              className="w-full h-full object-cover saturate-[1.05]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-4 right-4 left-4 text-right">
                              <span className="text-[10px] font-black bg-[#ebdcb9] text-[#3c2f24] px-2.5 py-1 rounded-full mb-1.5 inline-block">
                                شكل توضيحي رقم {currentSlideIdx + 1}
                              </span>
                              <p className="text-sm font-black text-white leading-tight">
                                {currentSlide?.title}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                <div className="mt-3 sm:mt-4 border-t border-[#ebdcb9]/40 pt-2 flex justify-between items-center text-[10px] text-[#a6937c] font-medium shrink-0">
                  <span>صفحة {currentSlideIdx * 2 + 1}</span>
                  <span className="font-semibold">{currentLesson.title}</span>
                </div>
              </div>

              {/* Right Page (Content) - Hidden on mobile if image is active */}
              <div className={`relative p-4 sm:p-6 lg:p-10 bg-white flex-col justify-between overflow-hidden h-full min-h-0 ${
                mobileActiveTab === 'content' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center text-[10px] font-bold text-[#a6937c] border-b border-[#ebdcb9]/40 pb-2 mb-3 sm:mb-4 shrink-0">
                  <span className="font-mono text-[#1e4631] bg-[#1e4631]/5 px-2.5 py-1 rounded-full">
                    القسم {currentSlideIdx + 1} من {lessonSlides.length}
                  </span>
                  <span>محتوى الدرس الدراسي الدراسي</span>
                </div>

                {/* Larger Text Size for Enhanced Readability in Fullscreen */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1e4631]/20 scrollbar-track-transparent">
                  <AnimatePresence mode="wait">
                    {(() => {
                      const currentSlide = lessonSlides[currentSlideIdx] || lessonSlides[0];
                      if (!currentSlide) return null;
                      return (
                        <motion.div
                          key={currentSlideIdx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4 sm:space-y-5 text-right pb-6"
                        >
                          <h3 className="text-base sm:text-lg font-black text-[#1e4631] border-r-4 border-[#1e4631] pr-3 mb-2 leading-snug">
                            {currentSlide.title}
                          </h3>

                          <div className="text-[#3c2f24] leading-relaxed text-sm sm:text-base space-y-4" style={{ lineHeight: '1.95' }}>
                            {currentSlide.blocks.map((block, bIdx) => {
                              if ((block.type === 'heading2' || block.type === 'heading3') && bIdx === 0) {
                                return null;
                              }

                              switch (block.type) {
                                case 'heading2':
                                  return (
                                    <h2 key={bIdx} className="text-sm sm:text-base font-black text-[#1e4631] mt-4 mb-2 border-r-2 border-[#1e4631] pr-2">
                                      {parseBoldText(block.text || '')}
                                    </h2>
                                  );
                                case 'heading3':
                                  return (
                                    <h3 key={bIdx} className="text-sm sm:text-base font-bold text-[#1e4631] mt-4 mb-2 border-r-2 border-[#c86446] pr-2">
                                      {parseBoldText(block.text || '')}
                                    </h3>
                                  );
                                case 'heading4':
                                  return (
                                    <h4 key={bIdx} className="text-xs sm:text-sm font-bold text-[#7c6a59] mt-3 mb-1 pr-1">
                                      {parseBoldText(block.text || '')}
                                    </h4>
                                  );
                                case 'definition':
                                  return (
                                    <div key={bIdx} className="bg-[#1e4631]/5 border-r-4 border-[#1e4631] p-3 sm:p-4 rounded-l-xl text-[#2d2219] font-semibold leading-relaxed my-2 sm:my-3 text-xs sm:text-sm shadow-3xs flex items-start space-x-2 space-x-reverse">
                                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e4631] shrink-0 ml-1.5 mt-0.5" />
                                      <p className="flex-1 whitespace-pre-line leading-relaxed">{parseBoldText(block.text || '')}</p>
                                    </div>
                                  );
                                case 'list':
                                  return (
                                    <div key={bIdx} className="space-y-2.5 sm:space-y-3.5 my-2.5 sm:my-3">
                                      {block.items?.map((item, idx) => {
                                        if (item.isBullet) {
                                          const content = item.text.replace(/^[\*\-]\s*/, '');
                                          return (
                                            <div key={idx} className="flex items-start space-x-2 space-x-reverse bg-[#fcfaf4] border border-[#eaddca]/40 p-2.5 sm:p-3 px-3 sm:px-4 rounded-lg">
                                              <CheckCircle className="w-4 h-4 text-[#1e4631] mt-0.5 shrink-0 ml-1.5" />
                                              <div className="text-xs sm:text-sm text-[#3c2f24] leading-relaxed font-semibold flex-1">
                                                {parseBoldText(content)}
                                              </div>
                                            </div>
                                          );
                                        }
                                        if (item.isNumbered) {
                                          const match = item.text.match(/^(\d+)\.\s*(.*)/);
                                          if (match) {
                                            const num = match[1];
                                            const content = match[2];
                                            return (
                                              <div key={idx} className="flex items-start space-x-2 space-x-reverse bg-[#fcfaf4] border border-[#eaddca]/40 p-2.5 sm:p-3 px-3 sm:px-4 rounded-lg">
                                                <div className="w-5 h-5 rounded-full bg-[#1e4631] text-white font-mono text-[10px] font-black flex items-center justify-center shrink-0 ml-1.5 mt-0.5">
                                                  {num}
                                                </div>
                                                <div className="text-xs sm:text-sm text-[#3c2f24] leading-relaxed font-semibold flex-1">
                                                  {parseBoldText(content)}
                                                </div>
                                              </div>
                                            );
                                          }
                                        }
                                        return (
                                          <p key={idx} className="text-[#3c2f24] leading-relaxed text-xs sm:text-sm font-semibold pr-2">
                                            {parseBoldText(item.text)}
                                          </p>
                                        );
                                      })}
                                    </div>
                                  );
                                case 'table': {
                                  const rows = block.rows || [];
                                  const validRows = rows.map(r => r.trim()).filter(r => r !== '' && !r.includes(':---') && !r.includes('---:'));
                                  if (validRows.length === 0) return null;

                                  const parsedRows = validRows.map(row => {
                                    const cleanRow = row.replace(/^\|/, '').replace(/\|$/, '');
                                    return cleanRow.split('|').map(cell => cell.trim());
                                  });

                                  const headers = parsedRows[0];
                                  const bodyRows = parsedRows.slice(1);

                                  return (
                                    <div key={bIdx} className="overflow-x-auto my-3 sm:my-4 border border-[#eaddca]/50 rounded-xl shadow-3xs">
                                      <table className="w-full text-right border-collapse text-xs sm:text-sm">
                                        <thead>
                                          <tr className="bg-[#f6f1e5] border-b border-[#eaddca] text-[#1e4631] font-black">
                                            {headers.map((header, hidx) => (
                                              <th key={hidx} className="p-2 sm:p-3 text-right">
                                                {parseBoldText(header)}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#eaddca]/30 bg-white">
                                          {bodyRows.map((rowCells, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-[#fdfbf7]/50 transition-colors">
                                              {rowCells.map((cell, cIdx) => (
                                                <td key={cIdx} className="p-2 sm:p-3 text-[#3c2f24] leading-relaxed font-bold">
                                                  {parseBoldText(cell)}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                }
                                case 'paragraph':
                                default:
                                  return (
                                    <p key={bIdx} className="text-[#3c2f24] leading-relaxed text-xs sm:text-sm font-semibold whitespace-pre-line my-1.5 sm:my-2">
                                      {parseBoldText(block.text || '')}
                                    </p>
                                  );
                              }
                            })}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                <div className="mt-3 sm:mt-6 border-t border-[#ebdcb9]/40 pt-2 flex justify-between items-center text-[10px] text-[#a6937c] font-medium shrink-0">
                  <span>وزارة التربية والتعليم</span>
                  <span>صفحة {(currentSlideIdx * 2) + 2}</span>
                </div>
              </div>
            </div>

            {/* Bottom Navigation of Fullscreen Book - Optimized for Mobile Horizontal Row */}
            <div className="bg-white border-t border-[#eaddca]/85 p-3 sm:p-4 px-4 sm:px-6 flex flex-row items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => {
                  if (currentSlideIdx < lessonSlides.length - 1) {
                    setCurrentSlideIdx(prev => prev + 1);
                  }
                }}
                disabled={currentSlideIdx === lessonSlides.length - 1}
                className="flex items-center space-x-1 space-x-reverse bg-[#1e4631] hover:bg-[#122b1e] text-white py-2 px-3 sm:px-6 rounded-xl text-xs font-black disabled:opacity-30 disabled:pointer-events-none shadow-xs transition-all cursor-pointer w-auto justify-center"
              >
                <span className="hidden sm:inline">الصفحة التالية</span>
                <span className="inline sm:hidden">التالي</span>
                <ChevronLeft className="w-4 h-4 mr-0.5 sm:mr-1" />
              </button>

              {/* Staggered dynamic page indicators */}
              <div className="flex flex-wrap gap-1 items-center justify-center max-w-[140px] sm:max-w-xl overflow-hidden py-1">
                {lessonSlides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIdx(idx)}
                    className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border transition-all ${
                      currentSlideIdx === idx
                        ? 'bg-[#1e4631] text-white border-[#1e4631]'
                        : 'bg-white text-[#7c6a59] border-[#eaddca] hover:bg-[#f6f1e5]/40'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (currentSlideIdx > 0) {
                    setCurrentSlideIdx(prev => prev - 1);
                  }
                }}
                disabled={currentSlideIdx === 0}
                className="flex items-center space-x-1 space-x-reverse bg-[#1e4631] hover:bg-[#122b1e] text-white py-2 px-3 sm:px-6 rounded-xl text-xs font-black disabled:opacity-30 disabled:pointer-events-none shadow-xs transition-all cursor-pointer w-auto justify-center"
              >
                <ChevronRight className="w-4 h-4 ml-0.5 sm:mr-1" />
                <span className="hidden sm:inline">الصفحة السابقة</span>
                <span className="inline sm:hidden">السابق</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}