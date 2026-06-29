/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, Search, Award, Bookmark, BookmarkCheck, Sparkles, 
  HelpCircle, ChevronDown, Check, Compass, Info, ArrowRight,
  Filter, BookOpen, Layers, Globe
} from 'lucide-react';

interface GlossaryTerm {
  id: string;
  term: string;
  englishTerm?: string;
  definition: string;
  category: 'nutrition' | 'digestive' | 'circulation' | 'excretion' | 'response';
  categoryLabel: string;
  keyFact: string; // حقيقة علمية مهمة للامتحان الشهادة السودانية
  diagramId?: string; // لربطه بالرسم التشريحي عند الانتقال
  lessonId?: string; // لربطه بالدرس المقابل
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // 1. التغذية والتمثيل الغذائي
  {
    id: 'cuticle',
    term: 'الكيوتيني (الكيوتيكل)',
    englishTerm: 'Cuticle',
    definition: 'طبقة شمعية واقية غير منفذة للماء تغطي خلايا البشرة الخارجية لأوراق النباتات وسيقانها لتقليل الفقد المائي الناتج عن عملية النتح.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'سؤال امتحان متكرر: الكيوتيني يمنع جفاف الورقة ونفاذ الماء، وتزداد سماكته في النباتات الصحراوية كاستجابة بيئية.',
    diagramId: 'leaf_anatomy',
    lessonId: 'leaf_structure'
  },
  {
    id: 'palisade_tissue',
    term: 'النسيج العمادي',
    englishTerm: 'Palisade Tissue',
    definition: 'صف أو صفين من الخلايا البرانشيمية المستطيلة المتطاولة التي تقع أسفل البشرة العليا لورقة النبات مباشرة، وتتميز باحتوائها على نسبة كثيفة جداً من البلاستيدات الخضراء لضمان أعلى كفاءة لعملية البناء الضوئي.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'علل: النسيج العمادي غني بالبلاستيدات لأنه يواجه الضوء الساقط على السطح العلوي للورقة مباشرة.',
    diagramId: 'leaf_anatomy',
    lessonId: 'leaf_structure'
  },
  {
    id: 'spongy_tissue',
    term: 'النسيج الإسفنجي',
    englishTerm: 'Spongy Tissue',
    definition: 'نسيج يقع أسفل النسيج العمادي في ورقة النبات، يتكون من خلايا غير منتظمة الشكل ومتباعدة تفصل بينها مسافات بينية واسعة تسهل حركة الهواء وتبادل الغازات (CO2 و O2) والنتح.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'المسافات البينية الكبيرة في النسيج الإسفنجي تعمل بمثابة غرف تهوية وتخزين بخار الماء والغازات.',
    diagramId: 'leaf_anatomy',
    lessonId: 'leaf_structure'
  },
  {
    id: 'stomata',
    term: 'الثغور والخلايا الحارسة',
    englishTerm: 'Stomata & Guard Cells',
    definition: 'فتحات دقيقة تتخلل بشرة الورقة (خاصة السفلى) تحاط كل منها بخليتين حارستين تحتويان على بلاستيدات وتتحكمان بفتح وإغلاق الثغر لتنظيم تبادل الغازات وفقد الماء.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'تتميز الخلايا الحارسة بجدار داخلي سميك وجدار خارجي رقيق، مما يسبب تقوسها وانفتاح الثغر عند امتلائها بالماء وضغط الانتفاخ.',
    diagramId: 'leaf_anatomy',
    lessonId: 'leaf_structure'
  },
  {
    id: 'kwashiorkor',
    term: 'الكواشيركور',
    englishTerm: 'Kwashiorkor',
    definition: 'حالة مرضية من حالات سوء التغذية ناتجة عن نقص حاد وشديد في البروتينات في الغذاء اليومي مع وفرة أو كفاية في الكربوهيدرات وسعرات الطاقة.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'أهم أعراض الكواشيركور: انتفاخ البطن (الاستسقاء بسبب نقص ألبومين الدم)، وتورم الأطراف بالماء، وجفاف الجلد وتساقط الشعر.',
    lessonId: 'nutrition_diseases'
  },
  {
    id: 'marasmus',
    term: 'الماراسموس (الهزال الحاد)',
    englishTerm: 'Marasmus',
    definition: 'مرض ناتج عن نقص شامل وكامل لجميع العناصر الغذائية بما فيها السعرات الحرارية والبروتينات، ويصيب غالباً الأطفال الرضع عند الفطام المبكر.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'الفرق الجوهري: طفل الماراسموس يبدو كجلد على عظم وضامر العضلات تماماً وبدون انتفاخ في البطن عكس الكواشيركور.',
    lessonId: 'nutrition_diseases'
  },
  {
    id: 'beri_beri',
    term: 'البري بري',
    englishTerm: 'Beri-Beri',
    definition: 'مرض ينتج عن النقص المستمر لفيتامين ب1 (الثيامين) في الغذاء، ويؤدي إلى اضطراب الجهاز العصبي وضعف عضلات القلب وهزال الأطراف.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'يظهر مرض البري بري بكثرة لدى الشعوب التي تعتمد في غذائها الأساسي على الأرز المقشور الفاقد للنخالة.',
    lessonId: 'nutrition_diseases'
  },
  {
    id: 'pellagra',
    term: 'البلاجرا',
    englishTerm: 'Pellagra',
    definition: 'مرض ينتج عن نقص فيتامين ب3 (النياسين أو حمض النيكوتينيك)، ويتميز بثلاثة أعراض رئيسية تبدأ بحرف الدال باللاتينية: التهاب الجلد، الإسهال، والخرف.',
    category: 'nutrition',
    categoryLabel: 'التغذية والتمثيل الغذائي',
    keyFact: 'الاسم مشتق من الإيطالية ويعني "الجلد الخشن"، حيث تظهر التهابات قشرية متناظرة عند التعرض لأشعة الشمس.',
    lessonId: 'nutrition_diseases'
  },

  // 2. الجهاز الهضمي للإنسان
  {
    id: 'tyalin',
    term: 'التيالين (الأميليز اللعابي)',
    englishTerm: 'Ptyalin',
    definition: 'إنزيم تفرزه الغدد اللعابية في الفم، يعمل على هضم الكربوهيدرات والنشا المطبوخ جزئياً وتحويله إلى سكر ثنائي (المالتوز) في وسط قلوي ضعيف.',
    category: 'digestive',
    categoryLabel: 'الجهاز الهضمي للإنسان',
    keyFact: 'يتوقف عمل التيالين فور وصول الطعام إلى المعدة بسبب الحموضة العالية (HCl) التي تبطل مفعوله فسيولوجياً.',
    diagramId: 'digestive_system',
    lessonId: 'digestion_mouth'
  },
  {
    id: 'pepsin',
    term: 'الببسين',
    englishTerm: 'Pepsin',
    definition: 'إنزيم رئيسي تفرزه الخلايا الرئيسية في المعدة بشكل غير نشط (ببسينوجين)، ويتم تنشيطه بواسطة حمض HCl لهضم البروتينات الكبيرة وتحويلها إلى سلاسل قصيرة من عديدات الببتيد.',
    category: 'digestive',
    categoryLabel: 'الجهاز الهضمي للإنسان',
    keyFact: 'لماذا لا تهضم المعدة نفسها؟ لأنها تفرز الببسين في صورة خاملة، وبسبب وجود طبقة مخاطية كثيفة تبطن جدار المعدة وتحميها من العصارة الحامضية.',
    diagramId: 'digestive_system',
    lessonId: 'digestion_stomach'
  },
  {
    id: 'chyme',
    term: 'الكيموس',
    englishTerm: 'Chyme',
    definition: 'كتلة الكتل الغذائية المطحونة وشبه السائلة ذات الحموضة العالية، الناتجة عن هضم الغذاء داخل المعدة بفعل انقباضات عضلاتها واختلاطها بالعصير المعدي، قبل دفعها للاثني عشر.',
    category: 'digestive',
    categoryLabel: 'الجهاز الهضمي للإنسان',
    keyFact: 'يتحرك الكيموس على دفعات صغيرة عبر فتحة البواب إلى الاثني عشر لتجنب تحميل الأمعاء الدقيقة حموضة زائدة دفعة واحدة.',
    diagramId: 'digestive_system',
    lessonId: 'digestion_stomach'
  },
  {
    id: 'villi',
    term: 'الخملات الأمعائية',
    englishTerm: 'Villi',
    definition: 'انثناءات إصبعية دقيقة لا حصر لها تبطن الجدار الداخلي للأمعاء الدقيقة، وتعمل على زيادة مساحة سطح الامتصاص بشكل هائل لنقل الغذاء المهضوم إلى مجرى الدم والليمف.',
    category: 'digestive',
    categoryLabel: 'الجهاز الهضمي للإنسان',
    keyFact: 'تحتوي كل خملة على شبكة من الشعيرات الدموية لامتصاص السكريات والأحماض الأمينية، ووعاء لبني (ليمفاوي) لامتصاص الدهون والفيتامينات الذائبة فيها (A, D, E, K).',
    diagramId: 'digestive_system',
    lessonId: 'digestion_intestine'
  },
  {
    id: 'chyle',
    term: 'الكيلوس',
    englishTerm: 'Chyle',
    definition: 'السائل اللبني المستحلب غليظ القوام المتكون في الأمعاء الدقيقة بعد اكتمال هضم الدهون والسكريات والبروتينات كلياً، ويصبح جاهزاً للامتصاص عبر الجدران الخلوية للخملات.',
    category: 'digestive',
    categoryLabel: 'الجهاز الهضمي للإنسان',
    keyFact: 'يختلف الكيلوس (اللبني القلوي بالأمعاء) عن الكيموس (الحامضي الكثيف بالمعدة) في التركيب والوسط الكيميائي.',
    diagramId: 'digestive_system',
    lessonId: 'digestion_intestine'
  },

  // 3. النقل والدوران
  {
    id: 'mitral_valve',
    term: 'الصمام المترالي (ثنائي الشرفات)',
    englishTerm: 'Mitral Valve',
    definition: 'صمام قلوي يقع في الجانب الأيسر من القلب بين الأذين الأيسر والبطين الأيسر، ويتكون من شرفتين تمنعان ارتداد الدم المؤكسج للأعلى إلى الأذين عند انقباض البطين.',
    category: 'circulation',
    categoryLabel: 'النقل والدوران',
    keyFact: 'الضغط في البطين الأيسر مرتفع جداً لدفع الدم للأبهر، لذلك يحتاج الصمام المترالي لأوتار قلبية متينة تثبته بقوة لمنع انقلابه.',
    diagramId: 'heart_anatomy',
    lessonId: 'heart_structure'
  },
  {
    id: 'pacemaker',
    term: 'العقدة الجيب أذينية (صانعة الخطو)',
    englishTerm: 'SA Node (Pacemaker)',
    definition: 'مجموعة من الخلايا العضلية العصبية المتخصصة في جدار الأذين الأيمن بالقرب من مصب الوريد الأجوف العلوي، تقوم بتوليد النبضات الكهربائية التلقائية المنظمة لانقباض القلب دورياً.',
    category: 'circulation',
    categoryLabel: 'النقل والدوران',
    keyFact: 'تعمل صانعة الخطو ذاتياً دون تدخل الأعصاب الخارجية، لكن الأعصاب الودية والباراودية تعدل وتسرع أو تبطئ معدلها حسب حاجة الجسم الأوكسجينية.',
    diagramId: 'heart_anatomy',
    lessonId: 'heart_structure'
  },
  {
    id: 'aorta',
    term: 'الشريان الأبهر (الأورطي)',
    englishTerm: 'Aorta',
    definition: 'أكبر وأقوى شريان في الجسم البشري، ينبثق من البطين الأيسر حاملاً الدم المؤكسج تحت ضغط عالٍ جداً ليوزعه عبر تفرعاته إلى جميع أعضاء وأنحاء الجسم.',
    category: 'circulation',
    categoryLabel: 'النقل والدوران',
    keyFact: 'يمتاز جدار الأبهر بسماكة استثنائية ومرونة مطاطية عالية تمكنه من امتصاص صدمة ضغط الدم الانقباضي والمحافظة على تدفق مستمر أثناء الانبساط.',
    diagramId: 'heart_anatomy',
    lessonId: 'blood_vessels'
  },

  // 4. الإخراج والتنظيم البولي
  {
    id: 'nephron',
    term: 'النيفرون',
    englishTerm: 'Nephron',
    definition: 'الوحدة البنائية والوظيفية المجهرية الدقيقة للكلية، ويبلغ عددها حوالي مليون نيفرون في كل كلية بشرية، وتتكون من كبسولة ترشيح (بومان) وأنيببات ملتفة تؤدي للنخاع والمجمع.',
    category: 'excretion',
    categoryLabel: 'الإخراج والتنظيم البولي',
    keyFact: 'في النيفرون تتم ثلاث عمليات بولية متكاملة بالتتابع: الترشيح الفائق، إعادة الامتصاص الاختياري، والإفراز الأنبوبي.',
    diagramId: 'kidney_anatomy',
    lessonId: 'kidney_structure'
  },
  {
    id: 'bowman_capsule',
    term: 'محفظة بومان',
    englishTerm: 'Bowman\'s Capsule',
    definition: 'تركيب انتفاخي كأسي الشكل مزدوج الجدار في بداية النيفرون بقشرة الكلية، يحيط بشبكة الشعيرات الدموية الشريانية عالية الضغط (الكبيبة أو الجمع) حيث تتم عملية ترشيح الدم.',
    category: 'excretion',
    categoryLabel: 'الإخراج والتنظيم البولي',
    keyFact: 'تسمح محفظة بومان بمرور الماء والجلوكوز واليوريا والأملاح بينما تمنع جزيئات البروتين الكبيرة وخلايا الدم الحمراء تماماً.',
    diagramId: 'kidney_anatomy',
    lessonId: 'kidney_structure'
  },
  {
    id: 'henle_loop',
    term: 'التواء هنلي',
    englishTerm: 'Loop of Henle',
    definition: 'جزء من أنبوبة النيفرون يأخذ شكل حرف U يمتد عميقاً داخل منطقة النخاع البولي للكلية، ويقوم بدور محوري في تنظيم امتصاص الماء وتركيز البول وإرجاع الصوديوم للدم.',
    category: 'excretion',
    categoryLabel: 'الإخراج والتنظيم البولي',
    keyFact: 'طول التواء هنلي يتناسب طردياً مع قدرة الكائن على العيش في البيئات القاحلة وتوفير الماء؛ الكائنات الصحراوية تمتلك التواءات هنلي طويلة جداً.',
    diagramId: 'kidney_anatomy',
    lessonId: 'kidney_structure'
  },
  {
    id: 'ultrafiltration',
    term: 'الترشيح الفائق (الأسموزي والضغط)',
    englishTerm: 'Ultrafiltration',
    definition: 'العملية الأولى لتكوين البول بمحفظة بومان، حيث يدفع ضغط الدم المرتفع السوائل والجزئيات الذائبة الصغيرة للمرور قسراً عبر جدران شعيرات الكبيبة المسامية لتتحول إلى "رشيح بولي".',
    category: 'excretion',
    categoryLabel: 'الإخراج والتنظيم البولي',
    keyFact: 'علل: ضغط الدم في الكبيبة مرتفع جداً مقارنة بالشعيرات العادية؛ لأن قطر الشريان الوارد المغذي أوسع بكثير من قطر الشريان الصادر الخارج منها.',
    lessonId: 'urine_formation'
  },

  // 5. التنسيق الهرموني والاستجابة
  {
    id: 'auxins',
    term: 'الأكسينات',
    englishTerm: 'Auxins',
    definition: 'مجموعة من الهرمونات النباتية الكيميائية (أشهرها حمض إندول الخليك IAA) تفرزها القمم النامية للسيقان والجذور، وتنظم معدلات نمو الخلايا وتوجه انحناء الأعضاء استجابة للمؤثرات.',
    category: 'response',
    categoryLabel: 'التنسيق الهرموني والاستجابة',
    keyFact: 'تتميز الأكسينات بأنها تهاجر وتبتعد عن الضوء (تتجمع في الجانب المظلم للفرع)، مما يسبب استطالة خلايا الجانب المظلم بشكل أسرع وينحني الساق نحو الضوء.',
    lessonId: 'plant_coordination'
  },
  {
    id: 'reflex_arc',
    term: 'القوس الانعكاسية',
    englishTerm: 'Reflex Arc',
    definition: 'المسار العصبي المتكامل الذي تسلكه النبضات العصبية لإتمام الفعل المنعكس اللاإرادي السريع حماية للجسم، ويتكون من خمسة عناصر: مستقبل، عصب حسي، عصب موصل، عصب حركي، وعضو استجابة.',
    category: 'response',
    categoryLabel: 'التنسيق الهرموني والاستجابة',
    keyFact: 'القوس الانعكاسية تتجاوز مراكز الوعي بالمخ مؤقتاً لضمان السرعة القصوى في الاستجابة (مثل سحب اليد فوراً عند لمس جسم ساخن) حماية لسلامة الكائن.',
    lessonId: 'nervous_coordination'
  },
  {
    id: 'phototropism',
    term: 'الانتحاء الضوئي',
    englishTerm: 'Phototropism',
    definition: 'استجابة نمو النبات الموجه بانحناء الساق (انتحاء موجب) أو الجذر (انتحاء سالب) نحو مصدر الضوء الخارجي الأحادي الاتجاه بفعل توزيع تركيزات الأكسينات النباتية بشكل غير متناظر.',
    category: 'response',
    categoryLabel: 'التنسيق الهرموني والاستجابة',
    keyFact: 'سؤال امتحان الشهادة: الساق منتحى ضوئي موجب بينما الجذر منتحى ضوئي سالب لأن التركيز المرتفع للأكسين ينشط الساق ويثبط الجذر.',
    lessonId: 'plant_coordination'
  }
];

interface BiologyGlossaryProps {
  onNavigateToSection: (tabId: string, extraId?: string) => void;
  isDarkMode: boolean;
}

export default function BiologyGlossary({ onNavigateToSection, isDarkMode }: BiologyGlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sudan_biology_glossary_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  // Word of the day based on the calendar date (changes every day deterministically)
  const wordOfTheDay = useMemo(() => {
    const day = new Date().getDate();
    const index = day % GLOSSARY_TERMS.length;
    return GLOSSARY_TERMS[index];
  }, []);

  const toggleBookmark = (id: string, termText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (bookmarkedIds.includes(id)) {
      updated = bookmarkedIds.filter(bId => bId !== id);
    } else {
      updated = [...bookmarkedIds, id];
    }
    setBookmarkedIds(updated);
    localStorage.setItem('sudan_biology_glossary_bookmarks', JSON.stringify(updated));
  };

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(item => {
      const matchesCategory = selectedCategory === 'all' || 
        (selectedCategory === 'bookmarks' && bookmarkedIds.includes(item.id)) || 
        item.category === selectedCategory;

      const normSearch = searchQuery.toLowerCase().trim();
      if (!normSearch) return matchesCategory;

      const matchesText = item.term.includes(normSearch) || 
        (item.englishTerm && item.englishTerm.toLowerCase().includes(normSearch)) || 
        item.definition.includes(normSearch) ||
        item.keyFact.includes(normSearch);

      return matchesCategory && matchesText;
    });
  }, [searchQuery, selectedCategory, bookmarkedIds]);

  const categories = [
    { id: 'all', label: 'الكل ✨', count: GLOSSARY_TERMS.length },
    { id: 'nutrition', label: 'البناء والتغذية 🍃', count: GLOSSARY_TERMS.filter(t => t.category === 'nutrition').length },
    { id: 'digestive', label: 'الجهاز الهضمي 🥗', count: GLOSSARY_TERMS.filter(t => t.category === 'digestive').length },
    { id: 'circulation', label: 'القلب والدوران ❤️', count: GLOSSARY_TERMS.filter(t => t.category === 'circulation').length },
    { id: 'excretion', label: 'الكلية والإخراج 🔬', count: GLOSSARY_TERMS.filter(t => t.category === 'excretion').length },
    { id: 'response', label: 'الهرمونات والأنشطة ⚡', count: GLOSSARY_TERMS.filter(t => t.category === 'response').length },
    { id: 'bookmarks', label: 'المفضلة الخاصة بي ⭐', count: bookmarkedIds.length }
  ];

  return (
    <div className="space-y-6 text-right animate-fadeIn" id="glossary-module">
      
      {/* 1. Header Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#1c1c18] to-[#141411] border-slate-800' 
          : 'bg-gradient-to-br from-[#fcfaf4] to-[#f6f1e5] border-[#eaddca]'
      } shadow-3xs`}>
        <div className="absolute left-6 top-4 text-[#c86446]/5 pointer-events-none hidden md:block">
          <BookOpen className="w-36 h-36" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className={`p-2.5 rounded-2xl ${isDarkMode ? 'bg-[#292924] text-amber-400' : 'bg-white text-[#c86446]'} border ${isDarkMode ? 'border-[#3a3a35]' : 'border-[#eaddca]/60'} shadow-3xs`}>
              <Book className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] uppercase tracking-wider font-extrabold ${isDarkMode ? 'text-amber-500' : 'text-[#c86446]'}`}>الموسوعة الأكاديمية الشاملة</span>
              <h2 className={`text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#2d2219]'}`}>قاموس المصطلحات العلمية التفاعلي 📖</h2>
            </div>
          </div>
          
          <p className={`text-xs leading-relaxed max-w-2xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} font-semibold`}>
            مساحة مخصصة لاستكشاف المصطلحات والتعاريف الحيوية الواردة بكتاب الأحياء للصف الثاني الثانوي السوداني. تم صياغة وتدقيق هذه المصطلحات علمياً لتطابق الكلمات المفتاحية المطلوبة في تصحيح امتحانات الشهادة السودانية الرسمية.
          </p>

          {/* Search box with inline icons */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="ابحث عن أي مصطلح علمي... (مثال: بومان، كواشيركور)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-3 pl-4 pr-11 text-xs sm:text-sm rounded-2xl transition-all font-semibold outline-none border ${
                isDarkMode 
                  ? 'bg-slate-900/95 border-slate-800 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500' 
                  : 'bg-white border-[#eaddca] text-slate-800 focus:border-[#c86446] focus:ring-1 focus:ring-[#c86446]'
              }`}
            />
            <div className="absolute right-3.5 top-3 text-[#baa896]">
              <Search className="w-4.5 h-4.5" />
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={`absolute left-3.5 top-3.5 text-xs font-bold transition-all ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Split Row: Word of the Day + Glossary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Word of the day and selected term detail (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* A. Word of the Day widget */}
          <div className={`border rounded-2xl p-5 space-y-4 shadow-3xs transition-all ${
            isDarkMode ? 'bg-[#1e1e1a] border-slate-800' : 'bg-gradient-to-br from-amber-50/20 to-white border-[#ebdcb9]'
          }`}>
            <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-slate-200/50">
              <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} block`}>التحصيل المعرفي المتجدد</span>
              <div className="flex items-center space-x-1 space-x-reverse text-amber-600">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-black">مصطلح اليوم العلمي</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <h4 className={`text-base font-black ${isDarkMode ? 'text-amber-400' : 'text-[#c86446]'}`}>
                  {wordOfTheDay.term}
                </h4>
                {wordOfTheDay.englishTerm && (
                  <span className="text-[10px] font-mono text-[#a6937c] font-bold">
                    {wordOfTheDay.englishTerm}
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                {wordOfTheDay.definition}
              </p>
            </div>

            <div className={`p-3 rounded-xl text-[10px] leading-relaxed font-bold border ${
              isDarkMode ? 'bg-[#292924]/40 border-slate-800 text-amber-300/90' : 'bg-[#fcfaf4] border-[#eaddca]/60 text-amber-900'
            }`}>
              💡 <strong>التركيز الامتحاني:</strong> {wordOfTheDay.keyFact}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTerm(wordOfTheDay)}
                className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black transition-all border text-center ${
                  isDarkMode 
                    ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                توسيع التفاصيل كاملة
              </button>
              {wordOfTheDay.diagramId && (
                <button
                  onClick={() => onNavigateToSection('labs', wordOfTheDay.diagramId)}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black transition-all text-center flex items-center justify-center space-x-1.5 space-x-reverse ${
                    isDarkMode ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400 hover:bg-emerald-900/40 border' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 ml-1" />
                  <span>الرسم التشريحي</span>
                </button>
              )}
            </div>
          </div>

          {/* B. Spaced Repetition Reminder & Stats */}
          <div className={`border rounded-2xl p-5 space-y-3.5 shadow-3xs ${
            isDarkMode ? 'bg-[#1a1a17] border-slate-800' : 'bg-[#fcfaf4] border-[#eaddca]/50'
          }`}>
            <div className="flex items-center space-x-2 space-x-reverse text-[#c86446]">
              <Award className="w-4.5 h-4.5" />
              <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>نظام الحفظ المستقر للشهادة 🌟</span>
            </div>
            <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-450' : 'text-slate-500'} font-medium`}>
              إن إتقان المصطلحات العلمية الدقيقة يمثل 25% من مجموع درجات ورقة امتحان الأحياء بجمهورية السودان. استخدم زر النجمة لحفظ المصطلحات المعقدة ومراجعتها دورياً لضمان استقرارها بالذاكرة بعيدة المدى.
            </p>
            <div className={`grid grid-cols-2 gap-3 text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'}`}>
                <span className="block text-sm font-black text-[#c86446]">{GLOSSARY_TERMS.length}</span>
                <span className="text-[9px] text-[#a6937c] font-bold">مصطلح مدمج</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'}`}>
                <span className="block text-sm font-black text-emerald-650">{bookmarkedIds.length}</span>
                <span className="text-[9px] text-[#a6937c] font-bold">في مفضلتك</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Category Filters & Main Terms Cards Grid (Col span 8) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Category Selector Scroll Container */}
          <div className="flex flex-wrap gap-2 pb-1" id="glossary-category-tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 space-x-reverse ${
                  selectedCategory === cat.id
                    ? isDarkMode 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-600 shadow-3xs font-black' 
                      : 'bg-[#c86446]/10 text-[#c86446] border-[#c86446] shadow-3xs font-black'
                    : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                  selectedCategory === cat.id 
                    ? isDarkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-[#c86446]/20 text-[#c86446]'
                    : isDarkMode ? 'bg-slate-850 text-slate-500' : 'bg-slate-100 text-slate-450'
                } font-bold font-mono`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Terms Cards Grid / List view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="glossary-grid">
            <AnimatePresence mode="popLayout">
              {filteredTerms.map((term) => {
                const isBookmarked = bookmarkedIds.includes(term.id);
                return (
                  <motion.div
                    layout
                    key={term.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedTerm(term)}
                    className={`border rounded-2xl p-4.5 text-right transition-all duration-250 cursor-pointer flex flex-col justify-between hover:shadow-2xs space-y-3.5 group relative overflow-hidden ${
                      selectedTerm?.id === term.id
                        ? isDarkMode 
                          ? 'bg-[#1f1a14] border-amber-800 ring-1 ring-amber-500/35' 
                          : 'bg-[#fdfcf9] border-[#c86446] ring-1 ring-[#c86446]/20'
                        : isDarkMode 
                          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-750' 
                          : 'bg-white border-[#eaddca]/40 hover:border-[#eaddca]/90'
                    }`}
                  >
                    {/* Top title bar */}
                    <div>
                      <div className="flex items-start justify-between">
                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => toggleBookmark(term.id, term.term, e)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isBookmarked
                              ? isDarkMode ? 'bg-amber-900/30 border-amber-850 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
                              : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300' : 'bg-white border-slate-100 text-slate-350 hover:text-slate-500'
                          }`}
                          title={isBookmarked ? 'إزالة من المفضلة الأكاديمية' : 'إضافة إلى المفضلة الأكاديمية'}
                        >
                          {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>

                        <div className="text-right">
                          <span className={`text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-bold block w-max ml-auto mb-1.5 ${
                            term.category === 'nutrition' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            term.category === 'digestive' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                            term.category === 'circulation' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                            term.category === 'excretion' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                            'bg-indigo-50 text-indigo-800 border border-indigo-100'
                          }`}>
                            {term.categoryLabel}
                          </span>
                          <h4 className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white group-hover:text-amber-400' : 'text-[#2d2219] group-hover:text-[#c86446]'} transition-colors`}>
                            {term.term}
                          </h4>
                          {term.englishTerm && (
                            <span className="text-[9px] font-mono text-[#a6937c] font-black block mt-0.5">
                              {term.englishTerm}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className={`text-xs mt-3 leading-relaxed line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} font-semibold`}>
                        {term.definition}
                      </p>
                    </div>

                    {/* Bottom Action bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 text-[9px] sm:text-[10px] font-bold text-slate-450">
                      <span className="flex items-center text-[#c86446]">
                        إظهار التفاصيل والامتحانات ⟵
                      </span>
                      {term.diagramId && (
                        <span className="flex items-center text-emerald-650 font-black">
                          🔗 مرتبط برسم تشريحي
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty view state */}
            {filteredTerms.length === 0 && (
              <div className={`col-span-full border rounded-2xl p-10 text-center space-y-3 ${
                isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/60 border-slate-200'
              }`}>
                <Info className="w-10 h-10 text-[#baa896] mx-auto opacity-75" />
                <div className="space-y-1">
                  <h4 className={`text-xs sm:text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>لا توجد مصطلحات مطابقة للبحث</h4>
                  <p className="text-[10px] text-[#a6937c] font-semibold max-w-sm mx-auto">لم نجد مصطلحاً يطابق خيارات التصفية والبحث الحالية. فضلاً تأكد من تحديد التصنيف المناسب أو إعادة تعيين البحث.</p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className={`mt-2 py-1.5 px-3 rounded-lg text-[10px] font-black transition-all ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-[#c86446] text-white shadow-3xs'
                  }`}
                >
                  عرض كافة المصطلحات
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. Detailed Term Information Modal/Drawer (AnimatePresence) */}
      <AnimatePresence>
        {selectedTerm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="glossary-detail-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTerm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-right overflow-hidden border ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-[#ebdcb9] text-slate-850'
              }`}
            >
              {/* Decorative Corner Blob */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#c86446]/5 rounded-br-full pointer-events-none" />

              <div className="space-y-5 relative z-10">
                {/* Meta Category & English tag */}
                <div className="flex items-center justify-between border-b pb-3.5 border-dashed border-slate-200/60">
                  <button
                    onClick={() => setSelectedTerm(null)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      isDarkMode ? 'bg-slate-800 hover:bg-slate-750 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                    }`}
                  >
                    إغلاق ×
                  </button>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black border ${
                    selectedTerm.category === 'nutrition' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                    selectedTerm.category === 'digestive' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                    selectedTerm.category === 'circulation' ? 'bg-rose-50 text-rose-800 border-rose-100' :
                    selectedTerm.category === 'excretion' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                    'bg-indigo-50 text-indigo-800 border-indigo-100'
                  }`}>
                    {selectedTerm.categoryLabel}
                  </span>
                </div>

                {/* Term title and English */}
                <div className="space-y-1">
                  <h3 className={`text-base sm:text-lg font-black ${isDarkMode ? 'text-amber-400' : 'text-[#c86446]'}`}>
                    {selectedTerm.term}
                  </h3>
                  {selectedTerm.englishTerm && (
                    <p className="text-xs font-mono text-[#a6937c] font-extrabold">
                      الاسم العلمي الإنجليزي: {selectedTerm.englishTerm}
                    </p>
                  )}
                </div>

                {/* Term Definition */}
                <div className="space-y-1.5">
                  <h5 className={`text-xs font-black ${isDarkMode ? 'text-slate-400' : 'text-[#2d2219]'}`}>التعريف الأكاديمي المعتمد:</h5>
                  <p className={`text-xs sm:text-[13px] leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-medium`}>
                    {selectedTerm.definition}
                  </p>
                </div>

                {/* Key Fact / Exam Tip */}
                <div className={`p-4.5 rounded-2xl border space-y-2 ${
                  isDarkMode ? 'bg-[#292924]/40 border-slate-800/80 text-amber-300' : 'bg-[#fcfaf4] border-[#ebdcb9] text-amber-900'
                }`}>
                  <div className="flex items-center space-x-1.5 space-x-reverse font-black text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ملاحظة التركيز في امتحان الشهادة الثانوية:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-semibold">
                    {selectedTerm.keyFact}
                  </p>
                </div>

                {/* Navigation and interactive links */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {selectedTerm.lessonId && (
                    <button
                      onClick={() => {
                        setSelectedTerm(null);
                        onNavigateToSection('lessons', selectedTerm.lessonId);
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                        isDarkMode 
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700' 
                          : 'bg-white hover:bg-slate-100 text-slate-750 border border-slate-250 shadow-3xs'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 ml-1.5 text-slate-500" />
                      <span>اقرأ الدرس الكامل الخاص بالمصطلح</span>
                    </button>
                  )}

                  {selectedTerm.diagramId && (
                    <button
                      onClick={() => {
                        setSelectedTerm(null);
                        onNavigateToSection('labs', selectedTerm.diagramId);
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                        isDarkMode 
                          ? 'bg-emerald-900/40 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800' 
                          : 'bg-[#1e4631] hover:bg-[#153223] text-white shadow-2xs'
                      }`}
                    >
                      <Compass className="w-4 h-4 ml-1.5 text-emerald-250" />
                      <span>افتح الرسم التشريحي التفاعلي للعضو</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
