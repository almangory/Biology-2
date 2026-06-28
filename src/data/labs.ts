/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualExperiment } from '../types';

export interface LabSimulation extends VirtualExperiment {
  calcOutput: (inputs: Record<string, any>) => {
    outputValue: number;
    outputLabel: string;
    description: string;
    visualState: any; // data to help frontend render custom animations
  };
}

export const VIRTUAL_LABS: LabSimulation[] = [
  {
    id: 'lab_u1_l1',
    title: 'معمل الكشف عن المواد الغذائية ومسببات سوء التغذية',
    objective: 'إثبات وجود النشا، والسكريات الأحادية، والبروتينات في عينات الطعام المجهولة باستخدام كواشف اليود، وبندكت النحاسي، والبيوريت، وتحديد المرض المسبب لسوء التغذية المرتبط.',
    materials: [
      'عينات كربوهيدرات ونشا وبروتين مجهولة',
      'كاشف اليود (بني مصفر للكشف عن النشا)',
      'كاشف بندكت الأزرق (للكشف عن السكريات الأحادية مع حمام مائي ساخن)',
      'كاشف البيوريت البنفسجي (للكشف عن روابط البروتين الببتيدية)',
      'حمام مائي دافئ، أنابيب اختبار، ماصات مدرجة'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اختر عينة الطعام المراد الكشف عنها من قائمة المتغيرات.', actionLabel: 'اختيار العينة' },
      { stepNumber: 2, instruction: 'اختر كاشف الفحص الكيميائي المناسب لإضافته إلى أنبوب الاختبار.', actionLabel: 'تحديد الكاشف' },
      { stepNumber: 3, instruction: 'لاحظ تغير لون المحلول الكيميائي واستخلص المادة الغذائية ومرض سوء التغذية في حال نقصها.', actionLabel: 'مراقبة التفاعل' }
    ],
    variables: [
      {
        name: 'food_sample',
        label: 'اختر عينة الطعام المجهولة:',
        type: 'select',
        options: [
          { value: 'sample_a', label: 'عينة الطعام (أ) - مسحوق أبيض ذائب' },
          { value: 'sample_b', label: 'عينة الطعام (ب) - سائل حلو شفاف' },
          { value: 'sample_c', label: 'عينة الطعام (ج) - زلال مخفف' }
        ],
        defaultValue: 'sample_a'
      },
      {
        name: 'reagent',
        label: 'اختر كاشف الفحص الكيميائي للخلط:',
        type: 'select',
        options: [
          { value: 'iodine', label: 'محلول اليود (Iodine Reagent)' },
          { value: 'benedict', label: 'محلول بندكت النحاسي + تسخين (Benedict\'s)' },
          { value: 'biuret', label: 'كاشف البيوريت القلوي (Biuret Reagent)' }
        ],
        defaultValue: 'iodine'
      }
    ],
    calcOutput: (inputs) => {
      const sample = inputs.food_sample ?? 'sample_a';
      const reagent = inputs.reagent ?? 'iodine';

      let detectedNutrient = '';
      let colorChange = 'بقاء اللون كما هو دون تغيير';
      let status = 'سالب (-)';
      let deficiencyDisease = '';
      let explanation = '';
      let hexColor = '#94a3b8'; // gray fallback

      if (sample === 'sample_a') {
        // Starch
        if (reagent === 'iodine') {
          detectedNutrient = 'النشا (كربوهيدرات معقدة)';
          colorChange = 'تحول لون الكاشف من البني المصفر إلى الأزرق الداكن / الأسود';
          status = 'موجب (+) نشط';
          hexColor = '#1e3a8a'; // dark blue
          explanation = 'تفاعل اليود مع سلاسل الأميلوز في النشا لتكوين مركب كيميائي معقد يمتص الضوء ويعطي اللون الأزرق الداكن المميز.';
        } else {
          explanation = 'لم يحدث تفاعل كيميائي. العينة لا تحتوي على السكريات الأحادية المختزلة أو البروتينات.';
        }
      } else if (sample === 'sample_b') {
        // Glucose
        if (reagent === 'benedict') {
          detectedNutrient = 'الجلوكوز / السكريات الأحادية المختزلة';
          colorChange = 'تحول لون الكاشف من الأزرق السماوي إلى الأحمر الطوبي (مع راسب)';
          status = 'موجب (+) نشط جداً';
          hexColor = '#b91c1c'; // brick red
          explanation = 'اختزل سكر الجلوكوز الأحادي أيونات النحاس الثنائية الزرقاء في كاشف بندكت بالحرارة إلى أيونات نحاس أحادية ترسبت على هيئة أكسيد النحاسوز الأحمر الطوبي.';
        } else {
          explanation = 'لم يحدث تفاعل كيميائي. عينات السكريات الأحادية لا تتفاعل مع كاشف اليود أو كاشف البيوريت بدون وجود روابط ببتيدية.';
        }
      } else if (sample === 'sample_c') {
        // Protein
        if (reagent === 'biuret') {
          detectedNutrient = 'الروابط الببتيدية / البروتينات كاملة القيمة';
          colorChange = 'تحول لون الكاشف من الأزرق الخفيف إلى البنفسجي الفاتح / الأرجواني';
          status = 'موجب (+) نشط';
          hexColor = '#7c3aed'; // purple
          explanation = 'تتفاعل أيونات النحاس الثنائية لكاشف البيوريت القلوي مع الروابط الببتيدية المتعددة في جزيء البروتين لتكون معقداً بنفسجي اللون ثنائي التكافؤ.';
        } else {
          explanation = 'لم يحدث تفاعل كيميائي. البروتينات خالية من النشا والسكريات الحرة البسيطة، لذلك لم تتفاعل مع اليود أو بندكت.';
        }
      }

      const diseaseMap: Record<string, string> = {
        'النشا (كربوهيدرات معقدة)': 'الهزال الشديد (المارزمس) نتيجة لنقص مصادر الطاقة الكربوهيدراتية والدهنية في الغذاء.',
        'الجلوكوز / السكريات الأحادية المختزلة': 'نقص مصادر الطاقة الأساسية وضعف النشاط البدني العام والتمثيل الغذائي السليم.',
        'الروابط الببتيدية / البروتينات كاملة القيمة': 'الكواشيوركور (Kwashiorkor) الذي يسبب انتفاخ البطن بسبب رشح السوائل وتساقط الشعر نتيجة لنقص بروتينات البلازما.'
      };

      deficiencyDisease = detectedNutrient ? (diseaseMap[detectedNutrient] || 'لا يوجد مرض مباشر') : 'لا يوجد تفاعل موجب؛ لا يمكن تحديد نقص مباشر.';

      let resultText = detectedNutrient 
        ? `كشف موجب! المادة المكتشفة هي: [ ${detectedNutrient} ].\n\nتفسير علمي: ${explanation}\n\nالمرض الناتج عن نقص هذه المادة المنهجي: ${deficiencyDisease}`
        : `تفاعل سلبي! ${explanation} لم يتم الكشف عن المادة المناسبة باستخدام الكاشف المختار.`;

      return {
        outputValue: detectedNutrient ? 1 : 0,
        outputLabel: detectedNutrient ? `موجب (+): ${detectedNutrient}` : 'تفاعل سلبي (-)',
        description: resultText,
        visualState: {
          color: hexColor,
          detectedNutrient,
          status,
          reagent
        }
      };
    }
  },
  {
    id: 'lab_photosynthesis',
    title: 'معمل البناء الضوئي وإطلاق الأكسجين (نبات الإيلوديا المائي)',
    objective: 'إثبات أثر شدة الإضاءة، وتركيز غاز ثاني أكسيد الكربون (CO2)، ودرجة الحرارة على معدل البناء الضوئي بقياس عدد فقاعات غاز الأكسجين (O2) المتصاعدة في الدقيقة.',
    materials: [
      'نبات إيلوديا مائي نشط',
      'كأس زجاجية بها ماء وصنبور يحتوي بيكربونات الصوديوم كمصدر لـ CO2',
      'مصباح ضوئي ذو شدة متغيرة لتمثيل مصدر الضوء',
      'ميزان حرارة مخبري دقيق',
      'قمع زجاجي وأنبوب اختبار مدرج لجمع الغاز المتصاعد'
    ],
    steps: [
      { stepNumber: 1, instruction: 'ضع نبات الإيلوديا المائي مقلوباً تحت القمع الزجاجي في الكأس المليئة بالماء.', actionLabel: 'تجهيز النبات' },
      { stepNumber: 2, instruction: 'اضبط شدة الإضاءة وحرارة الماء وتركيز بيكربونات الصوديوم (مصدر CO2) من لوحة التحكم المجاورة.', actionLabel: 'ضبط العوامل' },
      { stepNumber: 3, instruction: 'انقر على "بدء التجربة" لتشغيل الضوء ومراقبة تصاعد فقاعات غاز الأكسجين وقياس معدل الإنتاج.', actionLabel: 'تشغيل الضوء وبدء العد' }
    ],
    variables: [
      {
        name: 'light_intensity',
        label: 'شدة الإضاءة (واط)',
        type: 'slider',
        min: 0,
        max: 100,
        step: 10,
        defaultValue: 40
      },
      {
        name: 'co2_concentration',
        label: 'تركيز بيكربونات الصوديوم (مصدر CO2) %',
        type: 'slider',
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 0.5
      },
      {
        name: 'temperature',
        label: 'درجة حرارة الماء (درجة مئوية)',
        type: 'slider',
        min: 5,
        max: 55,
        step: 1,
        defaultValue: 25
      }
    ],
    calcOutput: (inputs) => {
      const light = inputs.light_intensity ?? 40;
      const co2 = inputs.co2_concentration ?? 0.5;
      const temp = inputs.temperature ?? 25;

      let tempFactor = 0;
      if (temp < 40) {
        tempFactor = Math.max(0, 1 - Math.pow((temp - 35) / 30, 2));
      } else if (temp < 48) {
        tempFactor = Math.max(0, 1 - (temp - 40) / 8);
      } else {
        tempFactor = 0;
      }

      const lightFactor = Math.min(1, light / 80);
      const co2Factor = Math.min(1, co2 / 1.5);

      const baseBubbles = 45;
      const actualBubbles = Math.round(baseBubbles * lightFactor * co2Factor * tempFactor);

      let description = '';
      if (temp >= 48) {
        description = 'توقف البناء الضوئي تماماً! لقد أدى الارتفاع الحاد في درجة الحرارة (أكثر من 45 درجة مئوية) إلى تخريب وهلاك بروتينات الإنزيمات الهاضمة والتركيبية بنبات الإيلوديا (Denaturation).';
      } else if (light === 0) {
        description = 'توقف البناء الضوئي! غياب الضوء تماماً يمنع تنشيط اليخضور (الكلوروفيل)، مما يعيق شطر جزيئات الماء ووقف التفاعلات الضوئية.';
      } else if (co2 === 0) {
        description = 'معدل متدني جداً! غياب ثاني أكسيد الكربون يمنع تثبيت الكربون في التفاعلات اللاضوئية (دورة كالفن) لتركيب السكر.';
      } else {
        description = `تجربة ناجحة! يتم البناء الضوئي بكفاءة جيدة منتجاً غاز الأكسجين بمعدل ${actualBubbles} فقاعة في الدقيقة تحت الظروف الحالية.`;
      }

      return {
        outputValue: actualBubbles,
        outputLabel: `${actualBubbles} فقاعة / دقيقة`,
        description,
        visualState: {
          bubbleSpeed: actualBubbles > 0 ? Math.max(1, 11 - Math.ceil(actualBubbles / 5)) : 0,
          lightOn: light > 0,
          isDead: temp >= 48
        }
      };
    }
  },
  {
    id: 'lab_u1_l3',
    title: 'معمل هضم السليلوز والمواد المعقدة لدى الحيوانات والمجترات',
    objective: 'دراسة ومحاكاة كيفية هضم السليلوز والمواد العشبية الصعبة في القناة الهضمية ومعدة الحيوانات المجترة (مثل الأبقار والضأن) مقارنة بالحيوانات غير المجترة وتأثير الميكروبات المتعايشة.',
    materials: [
      'عينات أعشاب مجففة غنية بالسليلوز، بكتيريا هاضمة متعايشة',
      'محاكاة مخبرية لحجرة الكرش (Rumen) في الحيوان المجتر',
      'محلول مخبري لقياس نواتج الهضم البكتيري وحمض اللبنيك'
    ],
    steps: [
      { stepNumber: 1, instruction: 'حدد نوع الحيوان في التجربة (مجتر أو غير مجتر) لتحديد طبيعة الجهاز الهضمي المساعد.', actionLabel: 'تحديد نوع الحيوان' },
      { stepNumber: 2, instruction: 'اضبط مدة تخمير الغذاء في المعدة لملاحظة كفاءة هضم السليلوز العشبي.', actionLabel: 'تعديل التخمير' },
      { stepNumber: 3, instruction: 'قس النسبة المئوية للسليلوز المهضوم والطاقة الحرارية الناتجة للحيوان.', actionLabel: 'قياس نواتج الهضم' }
    ],
    variables: [
      {
        name: 'animal_type',
        label: 'اختر نوع الحيوان الخاضع للتجربة:',
        type: 'select',
        options: [
          { value: 'ruminant', label: 'حيوان مجتر (البقرة - معدة مركبة من 4 حجرات)' },
          { value: 'non_ruminant', label: 'حيوان غير مجتر (الحصان - معدة بسيطة مع أعور متسع)' }
        ],
        defaultValue: 'ruminant'
      },
      {
        name: 'fermentation_time',
        label: 'مدة بقاء الطعام للتخمر البكتيري (ساعات):',
        type: 'slider',
        min: 2,
        max: 48,
        step: 2,
        defaultValue: 24
      }
    ],
    calcOutput: (inputs) => {
      const animal = inputs.animal_type ?? 'ruminant';
      const time = inputs.fermentation_time ?? 24;

      let digestionRate = 0;
      let shortChainFattyAcids = 0; // major energy source for ruminants
      let description = '';

      if (animal === 'ruminant') {
        // Ruminants are highly efficient due to rumen microbes
        digestionRate = Math.round(Math.min(95, 20 + (time * 1.8)));
        shortChainFattyAcids = Math.round(digestionRate * 1.5);
        description = `معدة مركبة متميزة! الكرش (Rumen) يحتوي على ملايين الميكروبات المتعايشة (البكتيريا والبروتوزوا) التي تفرز إنزيم السيليوليز (Cellulase). خلال ${time} ساعة، تم تفكيك السليلوز بكفاءة عالية بلغت ${digestionRate}% لإنتاج أحماض دهنية طيارة تزود الحيوان بالطاقة اللازمة لنموه الحليب واللحم.`;
      } else {
        // Non-ruminant herbivores digest cellulose in the cecum (الأعور), which is after stomach, hence less efficient
        digestionRate = Math.round(Math.min(45, 5 + (time * 0.8)));
        shortChainFattyAcids = Math.round(digestionRate * 0.9);
        description = `معدة بسيطة! الهضم البكتيري يتم في الأعور والقولون بعد المعدة والامعاء الدقيقة، مما يقلل الاستفادة الفعلية. كفاءة هضم السليلوز متدنية لم تتجاوز ${digestionRate}% خلال ${time} ساعة، لذلك يطرد الحصان الكثير من الألياف في روثه دون هضم كامل.`;
      }

      return {
        outputValue: digestionRate,
        outputLabel: `نسبة هضم السليلوز: ${digestionRate}%`,
        description,
        visualState: {
          digestionRate,
          shortChainFattyAcids,
          animal
        }
      };
    }
  },
  {
    id: 'lab_u1_l4',
    title: 'معمل أثر الإنزيمات الهاضمة في درجات حموضة pH وحرارة متباينة',
    objective: 'محاكاة آلية هضم النشا والبروتينات والدهون بواسطة إنزيمات الأميليز، الببسين، واللايباز تحت درجات حموضة (pH) ودرجات حرارة مختلفة لإثبات حساسية وتخصص الإنزيمات الحيوية.',
    materials: [
      'أنبوب اختبار معقم، محاليل كيميائية لضبط الـ pH',
      'إنزيمات هاضمة: أميليز اللعاب، ببسين المعدة، لايباز البنكرياس',
      'كواشف لقياس مدى هضم وتفكك المواد الغذائية المعقدة'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اختر الإنزيم الهضمي المراد استكشافه والمادة الغذائية المستهدفة.', actionLabel: 'تحديد الإنزيم' },
      { stepNumber: 2, instruction: 'اضبط درجة حموضة الوسط (pH) ودرجة الحرارة في حمام الماء الافتراضي.', actionLabel: 'تهيئة الوسط' },
      { stepNumber: 3, instruction: 'انقر على تشغيل التجربة لقياس النسبة المئوية للمادة المهضومة وراقب أسباب النشاط والتثبيط.', actionLabel: 'بدء الهضم المخبري' }
    ],
    variables: [
      {
        name: 'enzyme',
        label: 'اختر الإنزيم الهضمي تحت الفحص:',
        type: 'select',
        options: [
          { value: 'amylase', label: 'أميليز اللعاب (يهضم النشا إلى مالتوز)' },
          { value: 'pepsin', label: 'الببسين المعدي (يهضم البروتين إلى عديدات ببتيد)' },
          { value: 'lipase', label: 'اللايباز البنكرياسي (يهضم الدهون إلى أحماض دهنية)' }
        ],
        defaultValue: 'amylase'
      },
      {
        name: 'ph_level',
        label: 'درجة حموضة الوسط (pH):',
        type: 'slider',
        min: 1,
        max: 12,
        step: 0.5,
        defaultValue: 7
      },
      {
        name: 'temp_c',
        label: 'درجة حرارة الوسط (درجة مئوية):',
        type: 'slider',
        min: 10,
        max: 80,
        step: 2,
        defaultValue: 37
      }
    ],
    calcOutput: (inputs) => {
      const enzyme = inputs.enzyme ?? 'amylase';
      const ph = inputs.ph_level ?? 7;
      const temp = inputs.temp_c ?? 37;

      let optimalPh = 7;
      let optimalTemp = 37;
      let activity = 0;
      let desc = '';

      if (enzyme === 'amylase') {
        optimalPh = 7.4; // Neutral
        const tempDiff = Math.abs(temp - optimalTemp);
        const phDiff = Math.abs(ph - optimalPh);
        activity = Math.max(0, Math.round(100 - (tempDiff * 2.5) - (phDiff * 20)));
        if (temp > 55) activity = 0; // Denatured
        desc = activity > 0 
          ? `الأميليز اللعابي يعمل بنشاط ${activity}% في الفم. فكك النشا بنجاح إلى سكر المالتوز الثنائي في pH متعادل يقارب ${ph}.`
          : `الأميليز اللعابي خامل تماماً (نشاط 0%). السبب هو أن الإنزيم تلف بسبب الحرارة العالية (>55°م) أو تغير الرقم الهيدروجيني pH بشكل حاد عن النطاق المتعادل.`;
      } else if (enzyme === 'pepsin') {
        optimalPh = 2.0; // Strongly acidic
        const tempDiff = Math.abs(temp - optimalTemp);
        const phDiff = Math.abs(ph - optimalPh);
        activity = Math.max(0, Math.round(100 - (tempDiff * 2.5) - (phDiff * 15)));
        if (temp > 60) activity = 0;
        desc = activity > 0
          ? `الببسين المعدي يعمل بقوة استثنائية (نشاط ${activity}%) في المعدة. تفككت سلاسل البروتين المعقدة إلى سلاسل ببتيد قصيرة بفعل حموضة الـ pH العالية الموفرة بواسطة حمض HCl.`
          : `الببسين خامل (0%). السبب: غياب الوسط الحمضي القوي (pH=${ph}) المانع لتنشيط إنزيم الببسينوجين، أو تلف البنية الفراغية للبروتين بسبب الحرارة المرتفعة.`;
      } else if (enzyme === 'lipase') {
        optimalPh = 8.0; // Weakly alkaline
        const tempDiff = Math.abs(temp - optimalTemp);
        const phDiff = Math.abs(ph - optimalPh);
        activity = Math.max(0, Math.round(100 - (tempDiff * 2.5) - (phDiff * 18)));
        if (temp > 55) activity = 0;
        desc = activity > 0
          ? `اللايباز البنكرياسي ينشط بمعدل ${activity}% بمساعدة العصارة الصفراوية في الاثني عشر. قام بتحليل المستحلب الدهني إلى أحماض دهنية وجلسرين في pH قلوي خفيف.`
          : `اللايباز خامل (0%). لا يمكن لللايباز هضم الدهون بكفاءة في أوساط حمضية مفرطة أو عند درجات حرارة خارجة عن المألوف الفيزيولوجي البشري.`;
      }

      return {
        outputValue: activity,
        outputLabel: `نشاط الإنزيم الكلي: ${activity}%`,
        description: desc,
        visualState: {
          activity,
          enzyme,
          ph,
          temp
        }
      };
    }
  },
  {
    id: 'lab_transpiration',
    title: 'معمل قياس النفقات البيئية ومعدل نتح النبات (البوتوميتر)',
    objective: 'دراسة أثر العوامل الخارجية (الحرارة، الرياح، الرطوبة، والضوء) على معدل نضح وفقد الماء من أوراق نبات أخضر كامل باستخدام جهاز البوتوميتر الافتراضي.',
    materials: [
      'جهاز بوتوميتر مائي دقيق يحتوي أنبوبة شعرية وفقاعة هواء دلالية',
      'غصن نبات مورق طازج (مثل نبات الكركديه) مثبت بإحكام داخل سدادة البوتوميتر',
      'مروحة كهربائية ذات سرعات متغيرة لمحاكاة الرياح',
      'غرفة تحكم حراري وضبط رطوبة هواء الغرفة',
      'مصباح إضاءة قوي متغير الشدة'
    ],
    steps: [
      { stepNumber: 1, instruction: 'ثبت الغصن المورق في فتحة الجهاز تحت الماء لتجنب دخول فقاعات هواء إضافية تسد أوعية الخشب.', actionLabel: 'ثبت الغصن المورق' },
      { stepNumber: 2, instruction: 'اضبط لوحة العوامل البيئية المحيطة من رطوبة، سرعة رياح، إضاءة، وحرارة.', actionLabel: 'تهيئة البيئة الافتراضية' },
      { stepNumber: 3, instruction: 'قس المسافة التي تقطعها فقاعة الهواء داخل الأنبوب الشعري في مدة 5 دقائق لتحديد معدل امتصاص الماء المساوي للنتح.', actionLabel: 'قياس حركة الفقاعة ومعدل الفقد' }
    ],
    variables: [
      {
        name: 'temp',
        label: 'درجة حرارة الغرفة (درجة مئوية)',
        type: 'slider',
        min: 15,
        max: 45,
        step: 1,
        defaultValue: 25
      },
      {
        name: 'wind_speed',
        label: 'سرعة الرياح المحيطة (متر / ثانية)',
        type: 'slider',
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 1
      },
      {
        name: 'humidity',
        label: 'الرطوبة النسبية للهواء %',
        type: 'slider',
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 50
      },
      {
        name: 'light_on',
        label: 'مصدر الضوء (مصباح)',
        type: 'toggle',
        defaultValue: true
      }
    ],
    calcOutput: (inputs) => {
      const temp = inputs.temp ?? 25;
      const wind = inputs.wind_speed ?? 1;
      const humidity = inputs.humidity ?? 50;
      const lightOn = inputs.light_on ?? true;

      const tempValue = typeof temp === 'number' ? temp : 25;
      const windValue = typeof wind === 'number' ? wind : 1;
      const humidityValue = typeof humidity === 'number' ? humidity : 50;
      const lightOnValue = typeof lightOn === 'boolean' ? lightOn : true;

      const tempMult = 1 + (tempValue - 15) / 15;
      const windMult = 1 + windValue / 4;
      const humidityMult = Math.max(0.1, (100 - humidityValue) / 50);
      const lightMult = lightOnValue ? 1.5 : 0.4;

      const baseRate = 8.5;
      const finalRate = Math.round(baseRate * tempMult * windMult * humidityMult * lightMult * 10) / 10;

      let description = '';
      if (humidityValue >= 95) {
        description = 'معدل النتح منخفض جداً! تشبع الهواء الجوي ببخار الماء (الرطوبة تقارب 100%) يمنع تبخر الماء من خلايا النسيج الإسفنجي للثغور لغياب تدرج الرطوبة.';
      } else if (tempValue >= 42) {
        description = 'معدل نتح حاد جداً! الحرارة المرتفعة تزيد طاقة تبخر الماء، وتجبر النبات على فقد كميات ضخمة من الماء لتبريد أوراقه ولن يتمكن من الاستمرار طويلاً دون ري مستمر.';
      } else if (!lightOnValue) {
        description = 'معدل نتح منخفض (نتح كيوتيني فقط). في غياب الضوء (الظلام) تنغلق معظم الثغور البوتومترية للحفاظ على الماء، ويقتصر النضح على طبقة الكيوتيكل الخارجية.';
      } else {
        description = `تجربة ناجحة! معدل النتح طبيعي ومستقر عند [ ${finalRate} ملم / 5 دقائق ]. حركة فقاعة الهواء تدل على امتصاص الغصن للماء لتعويض المفقود بالتبخر الفعلي للأوراق.`;
      }

      return {
        outputValue: finalRate,
        outputLabel: `${finalRate} ملم / 5 دقائق`,
        description,
        visualState: {
          bubbleSpeed: finalRate > 0 ? Math.min(10, finalRate / 3) : 0,
          lightOn: lightOnValue,
          temp: tempValue,
          humidity: humidityValue,
          wind: windValue
        }
      };
    }
  },
  {
    id: 'lab_blood_typing',
    title: 'معمل مطابقة وفحص فصائل الدم ونقل الدم الآمن',
    objective: 'محاكاة فحص فصيلة دم المريض المجهولة بخلط قطرات الدم مع أمصال الفحص ومراقبة حدوث التخثر والتحقق من سلامة نقل الدم.',
    materials: [
      'عينات دم مجهولة لثلاثة طلاب سودانيين (أحمد، منى، فاطمة)',
      'أمصال الفحص الكيميائية المعقمة: مصل مضاد A، مصل مضاد B، مصل مضاد D للـ Rh',
      'شريحة زجاجية نظيفة ذات ثلاث حفر دائرية للفحص',
      'عيدان خشبية معقمة للمزج التام',
      'لوحة اختبار مطابقة نقل الدم الافتراضية'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اختر عينة دم الطالب المجهولة المراد فحصها من القائمة.', actionLabel: 'اختيار العينة' },
      { stepNumber: 2, instruction: 'أضف قطرة من مصل المضاد A، مصل المضاد B، ومصل المضاد D في الدوائر الثلاث على الترتيب.', actionLabel: 'إضافة الأمصال الفاحصة' },
      { stepNumber: 3, instruction: 'امزج قطرات الدم مع الأمصال، ولاحظ الدوائر التي يحدث فيها تخثر وحدد الفصيلة بدقة واختبر إمكانية نقل الدم للمستقبل.', actionLabel: 'المزج والمطابقة الكيميائية' }
    ],
    variables: [
      {
        name: 'sample_id',
        label: 'اختر عينة الطالب المراد فحصها:',
        type: 'select',
        options: [
          { value: 'ahmed', label: 'عينة دم أحمد' },
          { value: 'mona', label: 'عينة دم منى' },
          { value: 'fatima', label: 'عينة دم فاطمة' }
        ],
        defaultValue: 'ahmed'
      },
      {
        name: 'recipient_type',
        label: 'اختر فصيلة الشخص المستقبل للتحقق من سلامة النقل:',
        type: 'select',
        options: [
          { value: 'A+', label: 'مستقبل فصيلته A+' },
          { value: 'B-', label: 'مستقبل فصيلته B-' },
          { value: 'AB+', label: 'مستقبل فصيلته AB+' },
          { value: 'O-', label: 'مستقبل فصيلته O-' }
        ],
        defaultValue: 'AB+'
      }
    ],
    calcOutput: (inputs) => {
      const sample = inputs.sample_id ?? 'ahmed';
      const recipient = inputs.recipient_type ?? 'AB+';

      let bloodType = 'O-';
      let clumpingA = false;
      let clumpingB = false;
      let clumpingD = false;

      if (sample === 'ahmed') {
        bloodType = 'A+';
        clumpingA = true;
        clumpingB = false;
        clumpingD = true;
      } else if (sample === 'mona') {
        bloodType = 'O-';
        clumpingA = false;
        clumpingB = false;
        clumpingD = false;
      } else if (sample === 'fatima') {
        bloodType = 'B-';
        clumpingA = false;
        clumpingB = true;
        clumpingD = false;
      }

      const checkCompatibility = (donor: string, recv: string): boolean => {
        const dType = donor.replace(/[+-]/g, '');
        const dRh = donor.endsWith('+');
        const rType = recv.replace(/[+-]/g, '');
        const rRh = recv.endsWith('+');

        if (dRh && !rRh) return false;

        if (dType === 'O') return true;
        if (rType === 'AB') return true;
        if (dType === rType) return true;
        if (dType === 'A' && rType === 'AB') return true;
        if (dType === 'B' && rType === 'AB') return true;

        return false;
      };

      const isSafe = checkCompatibility(bloodType, recipient);
      let transferResult = isSafe
        ? `نقل الدم آمن تماماً! يمكن نقل فصيلة المتبرع (${bloodType}) للمستقبل (${recipient}) بأمان دون حدوث صدمة تخثرية.`
        : `خطر قاتل! لا يجوز نقل فصيلة المتبرع (${bloodType}) للمستقبل (${recipient}) لأن بلازما المستقبل ستحارب وتخرثر خلايا دم المتبرع وتؤدي لوفاته فوراً.`;

      let analysisDescription = `عند خلط عينة الدم بالغربال:
      - مضاد A: ${clumpingA ? 'تخثر وتكتل حاد' : 'متجانس وسليم'}.
      - مضاد B: ${clumpingB ? 'تخثر وتكتل حاد' : 'متجانس وسليم'}.
      - مضاد D (عامل ريزيسي): ${clumpingD ? 'تخثر (العامل الريزيسي موجب Rh+)' : 'لم يتخثر (العامل الريزيسي سالب Rh-)'}.
      
      إذن فصيلة دم هذا الطالب هي: [ ${bloodType} ].`;

      return {
        outputValue: isSafe ? 1 : 0,
        outputLabel: `فصيلة الدم المكتشفة: ${bloodType}`,
        description: `${analysisDescription}\n\n${transferResult}`,
        visualState: {
          clumpA: clumpingA,
          clumpB: clumpingB,
          clumpD: clumpingD,
          bloodType,
          isSafe
        }
      };
    }
  },
  {
    id: 'lab_u2_l3',
    title: 'معمل خطوط الدفاع المناعية وتكوين الأجسام المضادة المتخصصة',
    objective: 'دراسة ومحاكاة كيفية تصدي الجهاز المناعي لمسببات الأمراض (البكتيريا والفيروسات) وأثر اللقاح المسبق على سرعة الاستجابة اللمفاوية وإنتاج الأجسام المضادة IgG/IgM.',
    materials: [
      'عينات مجهرية لمسببات الأمراض (المستضدات)',
      'لوحة استثارة الخلايا البائية (B-cells) والخلايا التائية المساعدة (Th)',
      'كاشف قياس تراكيز الأجسام المضادة في بلازما الدم'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اضبط كمية الجراثيم أو مسببات الأمراض المحقونة في الجسم.', actionLabel: 'حقن المستضد' },
      { stepNumber: 2, instruction: 'اختر ما إذا كان الطالب محصناً بالتلقيح المسبق أم غير مطعم لمقارنة الاستجابة الأولى بالثانية.', actionLabel: 'تحديد حالة المناعة' },
      { stepNumber: 3, instruction: 'شغل التجربة لقياس سرعة القضاء على المستضدات ومنحنى الأجسام المضادة المتشكلة.', actionLabel: 'بدء الاستجابة' }
    ],
    variables: [
      {
        name: 'pathogen_load',
        label: 'جرعة مسببات الأمراض (عدد الخلايا الجرثومية):',
        type: 'slider',
        min: 100,
        max: 5000,
        step: 500,
        defaultValue: 1500
      },
      {
        name: 'vaccination_status',
        label: 'حالة التمنيع (اللقاح المسبق):',
        type: 'toggle',
        defaultValue: false
      }
    ],
    calcOutput: (inputs) => {
      const load = inputs.pathogen_load ?? 1500;
      const isVaccinated = inputs.vaccination_status ?? false;

      let daysToClear = 0;
      let maxAntibodies = 0; // arbitrary units
      let description = '';

      if (isVaccinated) {
        // Secondary immune response: rapid, high antibody count, zero symptoms
        daysToClear = Math.round(1 + load / 2500); // 1-3 days
        maxAntibodies = Math.round(800 + load * 0.1);
        description = `استجابة مناعية ثانوية مذهلة! لوجود خلايا الذاكرة (Memory cells) المتكونة من اللقاح المسبق، تعرفت الخلايا اللمفاوية البائية فوراً على مستضد المرض، وقامت بالانقسام لإنتاج الأجسام المضادة بغزارة قصوى بلغت ${maxAntibodies} وحدة، وقضت تماماً على العدوى في غضون ${daysToClear} أيام فقط دون أي أعراض تذكر للطالب.`;
      } else {
        // Primary immune response: slow, low antibody count, severe symptoms
        daysToClear = Math.round(7 + load / 1000); // 7-12 days
        maxAntibodies = Math.round(150 + load * 0.02);
        description = `استجابة مناعية أولية بطيئة! يحتاج الجسم إلى فترة حضانة وتعرف تتراوح بين 5 إلى 7 أيام حتى تتمكن الخلايا البائية من تشكيل خلايا بلازمية متخصصة لإنتاج أجسام مضادة متواضعة لم تتجاوز ${maxAntibodies} وحدة. استغرق التخلص التام من الجراثيم ${daysToClear} أيام عانى فيها الطالب من ارتفاع حاد في الحرارة وأعراض المرض المنهجية لضعف الدفاعات.`;
      }

      return {
        outputValue: maxAntibodies,
        outputLabel: `${maxAntibodies} وحدة أجسام مضادة / مل`,
        description,
        visualState: {
          daysToClear,
          maxAntibodies,
          isVaccinated,
          load
        }
      };
    }
  },
  {
    id: 'lab_u3_l1',
    title: 'معمل تخمر الخميرة وقياس معدل التنفس الخلوي اللاهوائي',
    objective: 'محاكاة عملية التنفس اللاهوائي (التخمر الكحولي) في خلايا فطر الخميرة لتحديد كمية غاز CO2 المنبعث ومقارنة تأثير تراكيز السكر ودرجات الحرارة المختلفة.',
    materials: [
      'دورق مخروطي مغلق بإحكام بسدادة مطاطية ذات خرطوم توصيل',
      'محلول معلق فطر الخميرة الطازج، ماء مقطر ودافئ',
      'سكر الجلوكوز النقي كمادة تفاعل أساسية',
      'مخبار مدرج مقلوب في حوض مائي لقياس غاز CO2، كاشف ماء الجير الرائق'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اضبط تركيز سكر الجلوكوز المضاف في دورق الخميرة لتحديد مادة التفاعل.', actionLabel: 'إضافة السكر' },
      { stepNumber: 2, instruction: 'اضبط درجة حرارة الحمام المائي لتنشيط أو تثبيط إنزيمات خلايا فطر الخميرة.', actionLabel: 'تحديد درجة الحرارة' },
      { stepNumber: 3, instruction: 'قس النسبة المئوية لغاز ثنائي أكسيد الكربون المنبعث والكحول الإيثيلي المتكون كناتج تخمر.', actionLabel: 'رصد النواتج اللاهوائية' }
    ],
    variables: [
      {
        name: 'sugar_concentration',
        label: 'تركيز سكر الجلوكوز المضاف %:',
        type: 'slider',
        min: 0,
        max: 15,
        step: 1,
        defaultValue: 5
      },
      {
        name: 'temp_celsius',
        label: 'درجة حرارة الماء (درجة مئوية):',
        type: 'slider',
        min: 0,
        max: 65,
        step: 1,
        defaultValue: 35
      }
    ],
    calcOutput: (inputs) => {
      const sugar = inputs.sugar_concentration ?? 5;
      const temp = inputs.temp_celsius ?? 35;

      let tempFactor = 0;
      if (temp < 40) {
        tempFactor = Math.max(0, temp / 40); // linear rise up to 40C
      } else if (temp < 50) {
        tempFactor = Math.max(0, 1 - (temp - 40) / 10); // drop down to 50C
      } else {
        tempFactor = 0; // enzymes denature completely above 50C
      }

      const sugarFactor = sugar > 0 ? Math.min(1.2, 0.4 + sugar / 10) : 0;
      const co2Rate = Math.round(35 * tempFactor * sugarFactor);

      let description = '';
      if (temp >= 50) {
        description = 'توقف التخمر تماماً! درجات الحرارة المرتفعة أدت إلى تدمير وتشويه بروتين الإنزيمات الحيوية المنشطة للتنفس اللاهوائي في خلايا فطر الخميرة (Zymase enzyme denaturation).';
      } else if (sugar === 0) {
        description = 'لا يوجد تفاعل! غياب سكر الجلوكوز (مادة التفاعل الأساسية) يحرم فطر الخميرة من مصدر إنتاج الطاقة، مما يعطل تكسير الروابط وإطلاق الغاز.';
      } else if (temp <= 10) {
        description = 'التفاعل بطيء وشبه متوقف بسبب البرودة الشديدة التي تثبط طاقة حركة الجزيئات والإنزيمات مؤقتاً دون إتلافها.';
      } else {
        description = `تجربة تخمر ممتازة! تتنفس خلايا الخميرة لاهوائياً وتطرح غاز ثنائي أكسيد الكربون بمعدل متزايد بلغ ${co2Rate} مل/دقيقة، مع تشكل كحول إيثيلي (إيثانول) وطاقة متواضعة (2 ATP). تفاعل ماء الجير كان إيجابياً وتكدر بالغاز المجموع.`;
      }

      return {
        outputValue: co2Rate,
        outputLabel: `${co2Rate} مل CO₂ / دقيقة`,
        description,
        visualState: {
          co2Rate,
          sugar,
          temp,
          isDead: temp >= 50
        }
      };
    }
  },
  {
    id: 'lab_u3_l2',
    title: 'معمل السعة الحيوية للرئتين ومعدل استهلاك الأكسجين أثناء المجهود',
    objective: 'قياس وحساب السعة الحيوية الرئوية الكلية (Vital Capacity) وتغيرات معدل التنفس وتدفق الدم الشرياني استجابة للجهد العضلي ومستويات اللياقة البدنية.',
    materials: [
      'جهاز قياس التنفس الحجمي (Spirometer) المائي مع شاشة رسم بياني',
      'ساعة توقيت رقمية دقيقة، ومستشعر نبضات القلب والجهد اللاسلكي',
      'لوحة الجهد البدني والتمارين المتطورة في بيئة مخبرية مغلقة'
    ],
    steps: [
      { stepNumber: 1, instruction: 'حدد نوع ومستوى الجهد العضلي والرياضي المطبق على الشخص.', actionLabel: 'تحديد الجهد العضلي' },
      { stepNumber: 2, instruction: 'اختر الحالة البدنية للشخص الخاضع للتجربة (رياضي مدرب مقابل غير رياضي).', actionLabel: 'اللياقة البدنية' },
      { stepNumber: 3, instruction: 'راقب السعة الحيوية ونبضات القلب في الدقيقة وعمق الشهيق والزفير في المنحنى البياني.', actionLabel: 'تحليل السعة الرئوية' }
    ],
    variables: [
      {
        name: 'exercise_level',
        label: 'اختر مستوى الجهد البدني والرياضي:',
        type: 'select',
        options: [
          { value: 'rest', label: 'راحة تامة واستلقاء (Rest)' },
          { value: 'walk', label: 'مشي خفيف معتدل (Light walking)' },
          { value: 'run', label: 'جري سريع ونشاط مكثف (Vigorous running)' }
        ],
        defaultValue: 'rest'
      },
      {
        name: 'athlete_status',
        label: 'حالة اللياقة البدنية للشخص:',
        type: 'toggle',
        defaultValue: false
      }
    ],
    calcOutput: (inputs) => {
      const exercise = inputs.exercise_level ?? 'rest';
      const isAthlete = inputs.athlete_status ?? false;

      let heartRate = 70;
      let respRate = 12;
      let vitalCapacity = isAthlete ? 5.8 : 4.2; // Athlete lungs are larger
      let description = '';

      if (exercise === 'rest') {
        heartRate = isAthlete ? 58 : 72;
        respRate = isAthlete ? 10 : 14;
        description = `حالة الراحة (Homeostasis): معدل ضربات القلب مستقر عند ${heartRate} نبضة/دقيقة ومعدل التنفس هادئ جداً بمقدار ${respRate} نفساً في الدقيقة. السعة الحيوية للرئتين تبلغ ${vitalCapacity} لتراً، مما يعكس سعة ممتازة وتبادلاً كاملاً ومريحاً للغازات على مستوى الحويصلات الهوائية (Alveoli) دون إجهاد.`;
      } else if (exercise === 'walk') {
        heartRate = isAthlete ? 85 : 105;
        respRate = isAthlete ? 16 : 22;
        description = `جهد معتدل: ارتفعت نبضات القلب لتصل إلى ${heartRate} نبضة/دقيقة لتلبية الحاجة المتزايدة للعضلات من الأكسجين والجلوكوز. زاد معدل التنفس إلى ${respRate} نفساً لزيادة تهوية الرئتين وطرح تراكمات CO₂ الزائدة في الدم والحفاظ على توازن الأس الهيدروجيني.`;
      } else {
        heartRate = isAthlete ? 130 : 175;
        respRate = isAthlete ? 28 : 42;
        description = `مجهود شاق وجري سريع! تضاعفت النبضات لتصل إلى ${heartRate} نبضة/دقيقة. الشخص غير الرياضي يقترب من حد الإرهاق الأقصى ومعدل تنفس سطحي متسارع جداً بلغ ${respRate} نفساً مع إنتاج حمض اللاكتيك في العضلات بالتنفس اللاهوائي، بينما الرياضي يظهر تكيفاً رئوياً مدهشاً وتدفق دم ممتازاً بسعة رئوية تبلغ ${vitalCapacity} لتراً مع كفاءة استعادة نبض طبيعية فائقة السرعة.`;
      }

      return {
        outputValue: heartRate,
        outputLabel: `${heartRate} نبضة / دقيقة`,
        description,
        visualState: {
          heartRate,
          respRate,
          vitalCapacity,
          exercise,
          isAthlete
        }
      };
    }
  },
  {
    id: 'lab_u4_l1',
    title: 'معمل آلية النضح والنتح والإخراج الثغري في النبات',
    objective: 'محاكاة كيف تفرز خلايا الأوراق والسيقان الفضلات والماء الزائد عن طريق النتح الثغري والعديسي والكيوتيني، أو النضح الدمعي (Guttation) في أطراف الأوراق صباحاً.',
    materials: [
      'نبات مائي، كواشف ورقية جافة بكلوريد الكوبالت (تتحول من الأزرق للوردي بالرطوبة)',
      'سائل ملون لفحص تدفق الغذاء والماء الصاعد بالأنابيب الخشبية',
      'غرفة تحكم مناخية وضوابط حرارية ومائية دقيقة'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اضبط مستوى ري ورطوبة التربة المحيطة بجذور النبات.', actionLabel: 'تعديل رطوبة التربة' },
      { stepNumber: 2, instruction: 'اضبط رطوبة وحرارة الهواء الجوي المحيط بالأوراق للاستكشاف البوتومتري.', actionLabel: 'تعديل جو الغرفة' },
      { stepNumber: 3, instruction: 'لاحظ التغير الفسيولوجي المتمثل في تكون قطرات دمعية (نضح) أو فقد تبخيري (نتح) ومعدله الفوري.', actionLabel: 'مراقبة آلية الإخراج' }
    ],
    variables: [
      {
        name: 'soil_moisture',
        label: 'ري ورطوبة التربة %:',
        type: 'slider',
        min: 10,
        max: 100,
        step: 10,
        defaultValue: 60
      },
      {
        name: 'air_humidity_c',
        label: 'الرطوبة النسبية للهواء %:',
        type: 'slider',
        min: 20,
        max: 98,
        step: 2,
        defaultValue: 50
      }
    ],
    calcOutput: (inputs) => {
      const soil = inputs.soil_moisture ?? 60;
      const air = inputs.air_humidity_c ?? 50;

      let transpirationRate = Math.round(15 * (soil / 50) * ((100 - air) / 50));
      let guttationDrops = 0;
      let description = '';

      if (soil >= 90 && air >= 90) {
        // High root pressure, no evaporation = Guttation!
        transpirationRate = 1; // nearly zero transpiration
        guttationDrops = Math.round((soil - 80) / 2);
        description = `ظاهرة النضح الدمعي (Guttation) المدهشة! التربة مشبعة بالماء تماماً الجذور تمتص بقوة هيدروستاتيكية عالية (Root pressure)، بينما الهواء الخارجي عالي الرطوبة (الندى) مانع تماماً لتبخر الماء (النتح). يضطر النبات لإخراج قطرات الماء السائل الزائد مع الأملاح الذائبة عبر فتحات متخصصة تدعى الثغور المائية (Hydathodes) عند أطراف الأوراق في الصباح الباكر.`;
      } else if (soil <= 20) {
        transpirationRate = Math.round(transpirationRate * 0.1);
        description = `جفاف شديد ومقاومة الإخراج! رطوبة التربة منخفضة جداً (${soil}%)، مما أدى لغلق الثغور فوراً بواسطة هرمون حمض الأبسيسك (Abscisic acid) لحماية بروتوبلازم النبات من الموت جفافاً، وتوقف الإخراج المائي تماماً عدا النتح الكيوتيني الضئيل جداً.`;
      } else {
        guttationDrops = 0;
        description = `آلية النتح الطبيعي نشطة بمعدل ${transpirationRate} ميكرولتر/ساعة. يتبخر الماء من الخلايا الإسفنجية للأوراق عابراً الثغور المفتوحة، مما يولد قوة سحب سالبة (Transpiration pull) ترفع الماء والذائبات من الجذور للأعلى عابرة أوعية الخشب، وهو الميكانزم الرئيسي للتخلص من حرارة شمس السودان الحارقة وتبريد النبات.`;
      }

      return {
        outputValue: transpirationRate,
        outputLabel: guttationDrops > 0 ? `نضح: ${guttationDrops} قطرة دمعية` : `نتح: ${transpirationRate} ميكرولتر / ساعة`,
        description,
        visualState: {
          transpirationRate,
          guttationDrops,
          soil,
          air
        }
      };
    }
  },
  {
    id: 'lab_u4_l2',
    title: 'معمل الكلية الاصطناعية وتصفية اليوريا من دم المريض الافتراضي',
    objective: 'محاكاة آلية الترشيح الكبيبي والانتشار الغشائي لغسيل وتنقية الدم وتصفية اليوريا والفضلات النيتروجينية والأملاح الزائدة باستخدام غشاء ديلزة شبه منفذ.',
    materials: [
      'جهاز ديلزة اصطناعي (Hemodialysis monitor) مجهز بخطوط دم',
      'سائل غسيل كلى يحتوي تراكيز جلوكوز وأملاح متوازنة مع البلازما',
      'أجهزة قياس تركيز اليوريا والفضلات النيتروجينية في دم المريض قبل وبعد الفحص'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اضبط مستوى تركيز اليوريا والفضلات الابتدائية في دم المريض الافتراضي.', actionLabel: 'تحديد درجة تسمم اليوريا' },
      { stepNumber: 2, instruction: 'اضبط معدل تدفق سائل غسيل الكلى الاصطناعي ومقاومته الغشائية الدقيقة.', actionLabel: 'تعديل تدفق الغسيل' },
      { stepNumber: 3, instruction: 'شغل دورة التصفية ولاحظ الانخفاض الفوري لسموم الدم وكمية الملح المنقاة.', actionLabel: 'بدء دورة الديلزة' }
    ],
    variables: [
      {
        name: 'blood_urea_level',
        label: 'تركيز اليوريا الابتدائي في دم المريض (مجم/ديسيلتر):',
        type: 'slider',
        min: 40,
        max: 220,
        step: 10,
        defaultValue: 150
      },
      {
        name: 'dialysis_flow',
        label: 'معدل تدفق سائل غسيل الكلى (مل/دقيقة):',
        type: 'slider',
        min: 100,
        max: 500,
        step: 50,
        defaultValue: 300
      }
    ],
    calcOutput: (inputs) => {
      const urea = inputs.blood_urea_level ?? 150;
      const flow = inputs.dialysis_flow ?? 300;

      // Rate of filtration is determined by concentration gradient (urea) and flow speed of dialysate
      const rateOfPurification = Math.round((flow / 500) * (urea * 0.45));
      const finalBloodUrea = Math.max(15, Math.round(urea - rateOfPurification * 2.5));

      let description = '';
      if (finalBloodUrea <= 40) {
        description = `تنقية دم ناجحة وفائقة! انخفض تركيز اليوريا السام في الدم من ${urea} مجم/ديسيلتر ليصل إلى المعدل الطبيعي الآمن [ ${finalBloodUrea} مجم/ديسيلتر ]. انتقلت جزيئات اليوريا والفضلات الصغيرة بالانتشار السلبي (Simple diffusion) عبر الغشاء شبه المنفذ لجهاز الديلزة من الدم ذو التركيز المرتفع إلى سائل الغسيل الخالي تماماً منها دون فقد لبروتينات الدم وخلاياه الكبيرة.`;
      } else if (flow <= 150) {
        description = `معدل تصفية ضعيف وغير كافٍ! تدفق سائل الغسيل بطيء جداً (${flow} مل/دقيقة) مما يعجل بحدوث اتزان متبادل وتوقف الانتشار عبر الغشاء. بقي تركيز سموم اليوريا مرتفعاً وخطيراً عند ${finalBloodUrea} مجم/ديسيلتر عارضاً المريض الافتراضي لخطر تسمم الدم البولي الشديد (Uremia).`;
      } else {
        description = `تنقية جارية: معدل إزالة اليوريا الكلي هو ${rateOfPurification} مجم/دقيقة. انخفضت مستويات سموم الدم لتصل إلى ${finalBloodUrea} مجم/ديسيلتر تحت تأثير تدفق سائل الديلزة الحالي. التجربة توضح دور الكلية البشري العظيم في المحافظة على التوازن الداخلي الذاتي (Homeostasis) وطرح الفضلات السامة.`;
      }

      return {
        outputValue: finalBloodUrea,
        outputLabel: `يوريا الدم النهائية: ${finalBloodUrea} مجم/دسل`,
        description,
        visualState: {
          rateOfPurification,
          finalBloodUrea,
          urea,
          flow
        }
      };
    }
  },
  {
    id: 'lab_u5_l1',
    title: 'معمل الانتحاء النباتي الضوئي والأرضي والمائي في البادرات',
    objective: 'محاكاة ودراسة كيف تنحني وتستجيب بادرات النباتات الصغيرة لمؤثرات الضوء الجانبي، الجاذبية، والرطوبة المائية بتأثير توزيع هرمون الأوكسين في الخلايا.',
    materials: [
      'علبة إنبات زجاجية داكنة، بادرات فاصوليا أو ذرة طازجة مستقيمة الساق',
      'مصدر ضوئي أحادي الجانب (نافذة أو مصباح)، إسفنج مائي رطب، سدادة إمالة للجاذبية',
      'جهاز تلوين فلوري دقيق لرصد تراكيز هرمونات الأوكسينات في خلايا الساق والجذر'
    ],
    steps: [
      { stepNumber: 1, instruction: 'اختر المؤثر البيئي المطبق على البادرة (ضوء أحادي، إمالة الجاذبية، أو رطوبة مائية).', actionLabel: 'تحديد المؤثر' },
      { stepNumber: 2, instruction: 'اختر معالجة هرمون الأوكسين (أوكسين طبيعي، إزالة القمة النامية للغمد، أو إضافة أوكسين صناعي).', actionLabel: 'معالجة البادرة' },
      { stepNumber: 3, instruction: 'لاحظ حركة البادرة والنمو المنحني للساق والجذور والتركيز الخلوي للأوكسين كاستجابة بيولوجية.', actionLabel: 'رصد الانحناء' }
    ],
    variables: [
      {
        name: 'stimulus',
        label: 'اختر المؤثر البيئي المطبق:',
        type: 'select',
        options: [
          { value: 'light', label: 'ضوء أحادي الجانب من اليمين (Phototropism)' },
          { value: 'gravity', label: 'إمالة أصيص الإنبات أفقياً 90 درجة (Geotropism)' },
          { value: 'water', label: 'توزيع رطوبة الماء والري جانبي (Hydrotropism)' }
        ],
        defaultValue: 'light'
      },
      {
        name: 'auxin_status',
        label: 'حالة معالجة القمة النامية (تخزين الأوكسين):',
        type: 'select',
        options: [
          { value: 'normal', label: 'قمة نامية سليمة وطبيعية (Intact coleoptile)' },
          { value: 'decapitated', label: 'قطع وإزالة القمة النامية تماماً (Decapitated)' }
        ],
        defaultValue: 'normal'
      }
    ],
    calcOutput: (inputs) => {
      const stimulus = inputs.stimulus ?? 'light';
      const auxin = inputs.auxin_status ?? 'normal';

      let curvatureAngle = 0; // degrees of bending
      let description = '';

      if (auxin === 'decapitated') {
        curvatureAngle = 0;
        description = `لا يوجد أي انتحاء أو استجابة للنمو! قمت بإزالة القمة النامية للغمد الورقي (Coleoptile tip) وهي موقع تصنيع وإفراز هرمون الأوكسين (Indole acetic acid - IAA). غياب الأوكسين يمنع استطالة الخلايا وتفاعلها الفسيولوجي مع أي مؤثر خارجي كالضوء أو الجاذبية.`;
      } else {
        if (stimulus === 'light') {
          curvatureAngle = 35; // Bends 35 degrees towards light
          description = `انتحاء ضوئي موجب للساق! يتأثر هرمون الأوكسين بالضوء فيهرب وينتقل من الجانب المضيء إلى الجانب المظلم (البعيد عن الضوء). يؤدي تراكم الأوكسين في الجانب المظلم إلى استطالة خلايا هذا الجانب بمعدل أسرع بكثير من الجانب المضيء، مما يجبر الساق على الانحناء بـ 35 درجة مباشرة باتجاه مصدر الضوء للحصول على طاقة التمثيل الضوئي.`;
        } else if (stimulus === 'gravity') {
          curvatureAngle = -45; // roots bend down, stems bend up
          description = `انتحاء أرضي مزدوج! بفعل الجاذبية، يهبط الأوكسين ويتراكم في الجانب السفلي للساق والجذر أفقيي النمو. في الساق، يحفز الأوكسين الزائد استطالة خلايا الجانب السفلي فينحني الساق لأعلى ضد الجاذبية (انتحاء سالب). أما في الجذر، فإن تراكم الأوكسين بالتركيزات المرتفعة يثبط استطالة خلايا الجانب السفلي، فتستطيل خلايا الجانب العلوي أسرع وينحني الجذر لأسفل باتجاه مركز الجاذبية (انتحاء موجب).`;
        } else {
          curvatureAngle = 25;
          description = `انتحاء مائي موجب للجذور! تتجه أطراف الجذور الباحثة عن الماء بـ 25 درجة نحو الإسفنج الرطب الجانبي. تنمو الجذور باتجاه الرطوبة العالية بدافع كيميائي حيوي، حيث يحفز الأوكسين الانحناء المتجه نحو الرطوبة لتأمين امتصاص الماء والأملاح لنمو خلايا النبات.`;
        }
      }

      return {
        outputValue: curvatureAngle,
        outputLabel: `زاوية انحناء الاستجابة: ${curvatureAngle}°`,
        description,
        visualState: {
          curvatureAngle,
          stimulus,
          auxin
        }
      };
    }
  },
  {
    id: 'lab_u5_l2',
    title: 'معمل زمن الفعل المنعكس والاستجابة العصبية الحسية',
    objective: 'محاكاة آلية الفعل المنعكس السريع وحساب زمن الاستجابة والسيال العصبي عبر قوس الانعكاس لمؤثرات بصرية أو سمعية مفاجئة تحت تأثير الإجهاد والسهر.',
    materials: [
      'جهاز قياس سرعة رد الفعل الرقمي مع لوحة ضوء بصرية وجرس صوتي',
      'مسطرة اختبار الاستجابة الميكانيكية اليدوية لحساب الجاذبية والسقوط الحر',
      'لوحة قياس الجهد السيالي العصبي العضلي الملتقط'
    ],
    steps: [
      { stepNumber: 1, instruction: 'حدد نوع المؤثر الحسي الذي سيظهر فجأة للطالب الخاضع للتجربة (ضوء وامض أو رنين صوتي).', actionLabel: 'تحديد نوع المؤثر' },
      { stepNumber: 2, instruction: 'اختر حالة إجهاد وتعب الطالب ومقدار ساعات السهر والتركيز لديه.', actionLabel: 'ضبط حالة الدماغ والتركيز' },
      { stepNumber: 3, instruction: 'انقر على بدء الاختبار لقياس زمن الاستجابة الفوري بالملي ثانية ومحاكاة انتقال السيال عبر قوس الانعكاس.', actionLabel: 'رصد السيال العصبي والاستجابة' }
    ],
    variables: [
      {
        name: 'stimulus_type',
        label: 'اختر نوع المؤثر الحسي الفوري:',
        type: 'select',
        options: [
          { value: 'visual', label: 'وميض ضوئي أحمر مفاجئ (Visual flash)' },
          { value: 'audio', label: 'رنين جرس حاد ومفاجئ (Audio beep)' }
        ],
        defaultValue: 'visual'
      },
      {
        name: 'fatigue',
        label: 'مستوى إجهاد وتعب الطالب الخاضع للاختبار:',
        type: 'select',
        options: [
          { value: 'alert', label: 'مستيقظ تماماً ومركز (8 ساعات نوم صحي)' },
          { value: 'tired', label: 'مجهد وتعبان (سهر ونوم 3 ساعات فقط)' },
          { value: 'exhausted', label: 'إرهاق شديد وخمول حاد (سهر 24 ساعة متواصلة)' }
        ],
        defaultValue: 'alert'
      }
    ],
    calcOutput: (inputs) => {
      const stim = inputs.stimulus_type ?? 'visual';
      const fatigue = inputs.fatigue ?? 'alert';

      let baseTime = stim === 'visual' ? 190 : 150; // Audio is faster in human nervous system
      let finalReactionTime = baseTime;
      let impulseSpeed = 120; // meters per second in myelinated neurons

      if (fatigue === 'alert') {
        finalReactionTime = baseTime;
        impulseSpeed = 120;
      } else if (fatigue === 'tired') {
        finalReactionTime = Math.round(baseTime * 1.5);
        impulseSpeed = 80;
      } else {
        finalReactionTime = Math.round(baseTime * 2.4);
        impulseSpeed = 45;
      }

      let description = '';
      if (fatigue === 'alert') {
        description = `زمن رد فعل استثنائي وسريع جداً بلغ [ ${finalReactionTime} ملي ثانية ]! السيال العصبي انتقل بسرعة قصوى بلغت ${impulseSpeed} م/ث عبر غمد المايلين العازل للمحاور العصبية. مسار قوس الانعكاس تم بكفاءة فائقة: مستقبلات العين/الأذن -> عصب حسي -> نخاع شوكي -> عصب حركي -> العضلات المنفذة للرد الفوري دون تأخير.`;
      } else if (fatigue === 'tired') {
        description = `رد فعل متوسط التباطؤ بلغ [ ${finalReactionTime} ملي ثانية ]. السهر ونقص النوم يثبطان جزئياً كفاءة النواقل العصبية (Neurotransmitters) الكيميائية في شقوق التشابك العصبي (Synaptic cleft)، مما يعيق سرعة نقل النبضات الكهربائية ويزيد الزمن المهدور للمعالجة.`;
      } else {
        description = `خطر تباطؤ حاد جداً! زمن رد الفعل تضاعف ليصل إلى [ ${finalReactionTime} ملي ثانية ] وسرعة السيال تباطأت إلى ${impulseSpeed} م/ث. الإرهاق الشديد والسهر المتواصل يرهق الدماغ ومراكز التحليل الشوكي، مما يعيق اتخاذ القرار العضلي العكسي السريع وهو سبب رئيسي لحوادث السير وضعف الاستجابة للامتحانات.`;
      }

      return {
        outputValue: finalReactionTime,
        outputLabel: `زمن الاستجابة: ${finalReactionTime} ملي ثانية`,
        description,
        visualState: {
          finalReactionTime,
          impulseSpeed,
          fatigue,
          stim
        }
      };
    }
  },
  {
    id: 'lab_u5_l3',
    title: 'معمل هرمونات البنكرياس وتوازن سكر الجلوكوز الذاتي',
    objective: 'محاكاة آلية التغذية الراجعة السلبية لتنظيم مستويات سكر الدم ودور هرموني الأنسولين والجلوكاجون المفروزين من جزر لانجرهانز بالبنكرياس.',
    materials: [
      'جهاز قياس نسبة الجلوكوز الرقمي في دم المريض الافتراضي (Glucometer)',
      'حقن افتراضية لهرمونات الأنسولين والجلوكاجون النقيين',
      'تخطيط كيميائي حيوي فوري لمخازن الجليكوجين في كبد المريض الافتراضي'
    ],
    steps: [
      { stepNumber: 1, instruction: 'حدد الحالة الغذائية للمريض الافتراضي (صائم 12 ساعة مقابل تناول وجبة عائلية دسمة).', actionLabel: 'تحديد حالة الوجبة' },
      { stepNumber: 2, instruction: 'اختر الحالة الصحية لكفاءة خلايا البنكرياس المفرزة لهرمونات الأنسولين والجلوكاجون.', actionLabel: 'كفاءة خلايا جزر لانجرهانز' },
      { stepNumber: 3, instruction: 'قس مستويات السكر ورسم المنحنى الهرموني لتبيان كيف يعيد الجسم التوازن.', actionLabel: 'رصد توازن السكر' }
    ],
    variables: [
      {
        name: 'meal_status',
        label: 'اختر الحالة الغذائية للشخص:',
        type: 'select',
        options: [
          { value: 'fasting', label: 'صائم ومستيقظ صباحاً (Fasting - 12 hours)' },
          { value: 'after_meal', label: 'بعد تناول وجبة غنية بالكربوهيدرات والنشا (Post-meal)' }
        ],
        defaultValue: 'fasting'
      },
      {
        name: 'pancreas_health',
        label: 'كفاءة خلايا جزر لانجرهانز بالبنكرياس:',
        type: 'select',
        options: [
          { value: 'healthy', label: 'سليم تماماً (خلايا ألفا وبيتا تعمل بكفاءة)' },
          { value: 'diabetic', label: 'مصاب بالسكري النوع الأول (تلف خلايا بيتا المفرزة للأنسولين)' }
        ],
        defaultValue: 'healthy'
      }
    ],
    calcOutput: (inputs) => {
      const meal = inputs.meal_status ?? 'fasting';
      const health = inputs.pancreas_health ?? 'healthy';

      let glucoseLevel = 80; // mg/dL
      let insulinReleased = 5; // microU/mL
      let glucagonReleased = 20; // pg/mL
      let description = '';

      if (health === 'healthy') {
        if (meal === 'fasting') {
          glucoseLevel = 85;
          insulinReleased = 2;
          glucagonReleased = 45; // High to release glucose from liver glycogen
          description = `تنظيم صائم مثالي: سكر الدم متزن عند [ ${glucoseLevel} مجم/دسل ]. نظراً للنقص المؤقت، أفرزت خلايا ألفا في البنكرياس هرمون الجلوكاجون بقوة، والذي انتقل عبر الدم للكبد محفزاً تحلل النشا الحيواني (الجليكوجين) المخزن إلى جلوكوز حر أُطلق في مجرى الدم للحفاظ على تغذية الدماغ خلايا الجسم.`;
        } else {
          glucoseLevel = 120; // balanced back quickly by insulin
          insulinReleased = 48; // High insulin to store glucose
          glucagonReleased = 2;
          description = `توازن ما بعد الوجبة سليم! ارتفع سكر الدم الابتدائي بعد الهضم، فاستشعرت خلايا بيتا في البنكرياس ذلك فوراً وأفرزت هرمون الأنسولين بغزارة. قام الأنسولين بفتح قنوات الخلايا لامتصاص الجلوكوز وحث الكبد والعضلات على تحويل الفائض لجليكوجين مخزن، مما أعاد تركيز السكر فوراً للمعدل الآمن البالغ [ ${glucoseLevel} مجم/دسل ].`;
        }
      } else {
        // Diabetic: lack of insulin
        if (meal === 'fasting') {
          glucoseLevel = 135; // slightly elevated even fasting
          insulinReleased = 0; // zero insulin production
          glucagonReleased = 30;
          description = `حالة السكري صائماً: سكر الدم مرتفع بشكل غير طبيعي صائماً ليصل لـ [ ${glucoseLevel} مجم/دسل ]. لعدم وجود إفراز ذاتي للأنسولين لخلل مناعي ذاتي دمر خلايا بيتا البنكرياسية بالكامل، يعجز الجسم عن خفض مستوى السكر بكفاءة طبيعية.`;
        } else {
          glucoseLevel = 340; // dangerously high hyperglycemia!
          insulinReleased = 0;
          glucagonReleased = 1;
          description = `حالة فرط سكر الدم الشديد والخطير (Hyperglycemia)! ارتفع الجلوكوز بعد الوجبة بشكل جنوني ليصل لـ [ ${glucoseLevel} مجم/دسل ]. غياب الأنسولين تماماً (0) يمنع خلايا الجسم من امتصاص السكر للاحتراق، فيبقى السكر حبيساً في الدم وتطرحه الكلى في البول (البول السكري) مصحوباً بالعطش الشديد وكثرة التبول وهزال العضلات. يحتاج المريض لحقن أنسولين فوري.`;
        }
      }

      return {
        outputValue: glucoseLevel,
        outputLabel: `نسبة السكر: ${glucoseLevel} مجم / دسل`,
        description,
        visualState: {
          glucoseLevel,
          insulinReleased,
          glucagonReleased,
          meal,
          health
        }
      };
    }
  }
];
