/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VIRTUAL_LABS } from '../data/labs';
import { motion, AnimatePresence } from 'motion/react';
import { Beaker, Settings, Play, RefreshCw, CheckCircle, Info, Star, Maximize2, Minimize2, Search, BookOpen, Layers } from 'lucide-react';
import { StudentProgress } from '../types';

interface VirtualLabProps {
  initialLabId?: string;
  progress?: StudentProgress;
  onUpdateProgress?: (updater: (prev: StudentProgress) => StudentProgress) => void;
  isDarkMode?: boolean;
}

const LAB_UNITS = [
  {
    id: 'unit_all',
    title: 'جميع الوحدات والتجارب',
    badge: 'الكل',
    color: 'emerald',
    labIds: VIRTUAL_LABS.map(l => l.id),
    description: 'استعرض جميع التجارب الافتراضية الأربعة عشر المتاحة في المنهج'
  },
  {
    id: 'unit_1',
    title: 'الوحدة الأولى: التغذية والهضم',
    badge: 'الوحدة ١',
    color: 'blue',
    labIds: ['lab_u1_l1', 'lab_photosynthesis', 'lab_u1_l3', 'lab_u1_l4'],
    description: 'تجارب الكشف الكيميائي، البناء الضوئي في الإيلوديا، هضم السليلوز، وتأثير الـ pH والحرارة على الإنزيمات'
  },
  {
    id: 'unit_2',
    title: 'الوحدة الثانية: النقل والمناعة',
    badge: 'الوحدة ٢',
    color: 'purple',
    labIds: ['lab_transpiration', 'lab_blood_typing', 'lab_u2_l3'],
    description: 'تجارب البوتوميتر لقياس نتح النبات، فحص ومطابقة فصائل الدم، ومحاكاة خطوط الدفاع المناعية'
  },
  {
    id: 'unit_3',
    title: 'الوحدة الثالثة: التنفس والتبادل الغازي',
    badge: 'الوحدة ٣',
    color: 'amber',
    labIds: ['lab_u3_l1', 'lab_u3_l2'],
    description: 'تجارب التخمر اللاهوائي في الخميرة، وتدريبات السعة الحيوية للرئتين ومعدل استهلاك الأكسجين'
  },
  {
    id: 'unit_4',
    title: 'الوحدة الرابعة: الإخراج والتوازن المائي',
    badge: 'الوحدة ٤',
    color: 'teal',
    labIds: ['lab_u4_l1', 'lab_u4_l2'],
    description: 'تجارب آلية النضح والنتح الثغري في النبات، ومحاكاة الكلية الاصطناعية لتصفية اليوريا من الدم'
  },
  {
    id: 'unit_5',
    title: 'الوحدة الخامسة: التنسيق والتحكم العصبي',
    badge: 'الوحدة ٥',
    color: 'rose',
    labIds: ['lab_u5_l1', 'lab_u5_l2', 'lab_u5_l3'],
    description: 'تجارب الانتحاء النباتي، قياس زمن الفعل المنعكس والاستجابة العصبية، ومستويات سكر الدم والبنكرياس'
  }
];

const resolveLabId = (id?: string): string => {
  if (!id) return VIRTUAL_LABS[0].id;
  
  let targetId = id;
  if (!targetId.startsWith('lab_')) {
    targetId = `lab_${targetId}`;
  }
  
  const mappings: Record<string, string> = {
    'lab_u1_l2': 'lab_photosynthesis',
    'lab_u2_l1': 'lab_transpiration',
    'lab_u2_l2': 'lab_blood_typing',
  };
  
  if (mappings[targetId]) {
    targetId = mappings[targetId];
  }
  
  const exists = VIRTUAL_LABS.some(lab => lab.id === targetId);
  if (exists) return targetId;
  
  return VIRTUAL_LABS[0].id;
};

export default function VirtualLab({ initialLabId, progress, onUpdateProgress, isDarkMode }: VirtualLabProps) {
  const [selectedLabId, setSelectedLabId] = useState(() => resolveLabId(initialLabId));
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync selected lab if parent changes it
  useEffect(() => {
    if (initialLabId) {
      setSelectedLabId(resolveLabId(initialLabId));
    }
  }, [initialLabId]);

  const [selectedUnitId, setSelectedUnitId] = useState('unit_all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);

  // Sync selected unit when active lab changes
  useEffect(() => {
    const activeUnit = LAB_UNITS.find(u => u.id !== 'unit_all' && u.labIds.includes(selectedLabId));
    if (activeUnit) {
      setSelectedUnitId(activeUnit.id);
    }
  }, [selectedLabId]);

  const currentLab = VIRTUAL_LABS.find(lab => lab.id === selectedLabId) || VIRTUAL_LABS[0];

  const isBookmarked = progress?.bookmarkedLabIds?.includes(selectedLabId) ?? false;

  const toggleBookmark = () => {
    if (!onUpdateProgress) return;
    onUpdateProgress(prev => {
      const currentBookmarks = prev.bookmarkedLabIds || [];
      const updated = currentBookmarks.includes(selectedLabId)
        ? currentBookmarks.filter(id => id !== selectedLabId)
        : [...currentBookmarks, selectedLabId];
      return {
        ...prev,
        bookmarkedLabIds: updated
      };
    });
  };

  // Store user-selected variable values for current lab
  const [variablesState, setVariablesState] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Responsive dimensions state for dynamic scaling
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic scale multiplier for laboratory apparatuses based on viewport dimensions
  const dynamicScale = (() => {
    // Standard scaling based on width
    const baseScale = windowWidth < 480 ? 0.75 : windowWidth < 640 ? 0.9 : windowWidth < 1024 ? 1.15 : 1.35;
    if (isFullscreen) {
      // In fullscreen, scale up proportionally but prevent height overflow
      const heightScale = Math.min(windowHeight / 680, windowWidth / 1100) * 1.5;
      return Math.max(1.0, Math.min(1.8, heightScale));
    }
    return baseScale;
  })();

  // Use vmax/vh for dynamic responsive container height that scales perfectly
  const containerHeight = isFullscreen ? 'h-[60vh] max-h-[550px] lg:max-h-[60vmax]' : 'h-[380px] sm:h-[420px] md:h-[450px]';

  // Initialize variablesState when current lab changes
  useEffect(() => {
    const initialState: Record<string, any> = {};
    currentLab.variables.forEach(v => {
      initialState[v.name] = v.defaultValue;
    });
    setVariablesState(initialState);
    setIsRunning(false);
    setCurrentStep(0);
  }, [selectedLabId]);

  const handleVariableChange = (name: string, value: any) => {
    setVariablesState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const activeSimulationResult = currentLab.calcOutput(variablesState);

  // Extract variables for direct interactive visualization response
  const lightIntensity = variablesState.light_intensity ?? 40;
  const co2Concentration = variablesState.co2_concentration ?? 0.5;
  const temperature = variablesState.temperature ?? 25;
  const sampleId = variablesState.sample_id ?? 'ahmed';
  const recipientType = variablesState.recipient_type ?? 'AB+';
  const temp = variablesState.temp ?? 25;
  const windSpeed = variablesState.wind_speed ?? 1;
  const humidity = variablesState.humidity ?? 50;
  const lightOn = variablesState.light_on ?? true;

  // Generate bubbles array for photosynthesis animation
  const bubbleCount = isRunning ? activeSimulationResult.outputValue : 0;

  const renderControlPanel = (inFullscreen = false) => {
    return (
      <div className={`bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-xs text-right ${inFullscreen ? 'h-full flex flex-col justify-between' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-850">لوحة التحكم في المتغيرات</h3>
          </div>
          {!inFullscreen && onUpdateProgress && (
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg border transition-all ${
                isBookmarked
                  ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isBookmarked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            >
              <Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        <div className={`space-y-4 ${inFullscreen ? 'flex-1 overflow-y-auto pr-1' : ''}`}>
          {currentLab.variables.map(variable => (
            <div key={variable.name} className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-right">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-emerald-700 font-mono font-bold">
                  {variablesState[variable.name] !== undefined
                    ? variablesState[variable.name] + (variable.name.includes('concentration') ? '%' : variable.name.includes('temp') ? '°م' : '')
                    : ''}
                </span>
                <label className="text-slate-700 font-bold">{variable.label}</label>
              </div>

              {variable.type === 'slider' && (
                <input
                  type="range"
                  min={variable.min}
                  max={variable.max}
                  step={variable.step}
                  value={variablesState[variable.name] ?? variable.defaultValue}
                  onChange={(e) => handleVariableChange(variable.name, Number(e.target.value))}
                  className="w-full accent-emerald-600 bg-slate-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              )}

              {variable.type === 'select' && (
                <select
                  value={variablesState[variable.name] ?? variable.defaultValue}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-emerald-600/50"
                >
                  {variable.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              {variable.type === 'toggle' && (
                <button
                  onClick={() => handleVariableChange(variable.name, !variablesState[variable.name])}
                  className={`w-full py-2 px-4 rounded-lg font-bold text-xs border transition-all ${
                    variablesState[variable.name]
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {variablesState[variable.name] ? 'قيد التشغيل' : 'مغلق'}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex space-x-2 space-x-reverse pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-bold text-sm transition-all shadow-xs ${
              isRunning
                ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200/50'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/10'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-2" />
                <span>تشغيل التجربة</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              const resetState: Record<string, any> = {};
              currentLab.variables.forEach(v => {
                resetState[v.name] = v.defaultValue;
              });
              setVariablesState(resetState);
              setIsRunning(false);
              setCurrentStep(0);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-3 rounded-xl border border-slate-200"
            title="إعادة تعيين التجربة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const labContent = (
    <div 
      className="space-y-6 text-right" 
      id="virtual-lab-wrapper"
    >

      {/* Tab bar to select a laboratory */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-xs space-y-6 text-right" id="lab-selector-dashboard">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-150 mb-1.5 inline-block">الوحدات التعليمية المنهجية</span>
            <h2 className="text-base md:text-lg font-black text-slate-850">منظم ومعمل التجارب الافتراضية</h2>
          </div>
          
          {/* Search and Bookmarks Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="ابحث عن تجربة بالاسم أو الهدف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pl-9 pr-4 text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600/40 focus:ring-2 focus:ring-emerald-50 transition-all text-right"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Bookmarks Toggle Button */}
            <button
              onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
              className={`flex items-center justify-center space-x-1.5 space-x-reverse px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                showOnlyBookmarked
                  ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-3xs'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showOnlyBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>المفضلة فقط</span>
              {progress?.bookmarkedLabIds && progress.bookmarkedLabIds.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  {progress.bookmarkedLabIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Unit Tabs Horizontal Slider */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="unit-tabs-grid">
          {LAB_UNITS.map(unit => {
            const isSelected = selectedUnitId === unit.id;
            const count = unit.labIds.filter(id => {
              const lab = VIRTUAL_LABS.find(l => l.id === id);
              if (!lab) return false;
              if (showOnlyBookmarked && !progress?.bookmarkedLabIds?.includes(id)) return false;
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const titleMatch = lab.title.toLowerCase().includes(query);
                const objectiveMatch = lab.objective.toLowerCase().includes(query);
                return titleMatch || objectiveMatch;
              }
              return true;
            }).length;

            return (
              <button
                key={unit.id}
                onClick={() => {
                  setSelectedUnitId(unit.id);
                  if (unit.id !== 'unit_all' && unit.labIds.length > 0) {
                    setSelectedLabId(unit.labIds[0]);
                  }
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-right transition-all group ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs ring-1 ring-emerald-350'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    {unit.badge}
                  </span>
                  <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-500'}`}>
                    {count} {count === 1 ? 'تجربة' : count === 2 ? 'تجربتان' : count > 2 && count <= 10 ? 'تجارب' : 'تجربة'}
                  </span>
                </div>
                <span className="text-[11px] font-black leading-tight truncate w-full">{unit.title}</span>
              </button>
            );
          })}
        </div>

        {/* Unit Description banner */}
        {LAB_UNITS.find(u => u.id === selectedUnitId)?.description && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center space-x-2 space-x-reverse text-right">
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] font-medium text-slate-500 leading-normal">
              {LAB_UNITS.find(u => u.id === selectedUnitId)?.description}
            </p>
          </div>
        )}

        {/* Experiments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" id="experiments-selector-cards">
          {(() => {
            const currentUnit = LAB_UNITS.find(u => u.id === selectedUnitId);
            const displayedLabs = VIRTUAL_LABS.filter(lab => {
              // Must be in selected unit
              if (currentUnit && !currentUnit.labIds.includes(lab.id)) return false;
              
              // Bookmark filter
              if (showOnlyBookmarked && !progress?.bookmarkedLabIds?.includes(lab.id)) return false;

              // Search query filter
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const titleMatch = lab.title.toLowerCase().includes(query);
                const objectiveMatch = lab.objective.toLowerCase().includes(query);
                return titleMatch || objectiveMatch;
              }

              return true;
            });

            if (displayedLabs.length === 0) {
              return (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Beaker className="w-8 h-8 text-slate-350 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-450">لم يتم العثور على أي تجارب تطابق خيارات التصفية والبحث.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setShowOnlyBookmarked(false);
                      setSelectedUnitId('unit_all');
                    }}
                    className="mt-3 text-[11px] font-black text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    إعادة تعيين مرشحات البحث
                  </button>
                </div>
              );
            }

            return displayedLabs.map((lab) => {
              const isSelected = selectedLabId === lab.id;
              const hasBookmark = progress?.bookmarkedLabIds?.includes(lab.id) ?? false;
              const labUnit = LAB_UNITS.find(u => u.id !== 'unit_all' && u.labIds.includes(lab.id));

              return (
                <button
                  key={lab.id}
                  onClick={() => setSelectedLabId(lab.id)}
                  className={`relative flex flex-col justify-between p-4 rounded-xl border text-right transition-all group duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-50/40 to-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-400/30'
                      : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/10'
                  }`}
                >
                  <div className="space-y-2 w-full">
                    {/* Header line of card */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {labUnit ? labUnit.badge : 'عام'}
                      </span>
                      
                      <div className="flex items-center space-x-1.5 space-x-reverse">
                        {hasBookmark && (
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                        )}
                        {isSelected && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-xs font-extrabold leading-snug group-hover:text-emerald-800 transition-colors ${
                      isSelected ? 'text-emerald-900 font-black' : 'text-slate-800'
                    }`}>
                      {lab.title}
                    </h3>

                    {/* Objective snippet */}
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                      {lab.objective}
                    </p>
                  </div>

                  {/* Active Indicator Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-100/60 flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-slate-450">
                      ID: {lab.id.replace('lab_', '')}
                    </span>
                    <span className={`text-[10px] font-black flex items-center gap-1 ${
                      isSelected ? 'text-emerald-700' : 'text-slate-500 group-hover:text-emerald-600'
                    }`}>
                      <span>{isSelected ? 'المعمل النشط' : 'دخول التجربة'}</span>
                      <Beaker className={`w-3 h-3 ${isSelected ? 'animate-pulse' : ''}`} />
                    </span>
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Main Grid: Control Panel + Simulation Renderer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="lab-main-grid">
        {/* Left Column: Parameter controls and inputs (Col-span 5) */}
        <div className="xl:col-span-5 flex flex-col space-y-6">
          {renderControlPanel(false)}
        </div>

        {/* Right Column: Active Simulation and Step logs (Col-span 7) */}
        <div className="xl:col-span-7 flex flex-col space-y-6">
          {/* Virtual Visual Glass Sandbox */}
          {(() => {
            const canvasElement = (
              <div
                className="flex-1 flex items-center justify-center py-6 relative w-full animate-fadeIn transition-all duration-300"
                id="sandbox-canvas"
                style={{
                  transform: isFullscreen ? 'scale(1.05)' : 'none',
                  transformOrigin: 'center'
                }}
              >
              {/* Photosynthesis Lab Render */}
              {selectedLabId === 'lab_photosynthesis' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-sky-100 to-indigo-50 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex justify-between items-center text-right transition-all duration-300`}>
                  {/* Light Source (Lamp) */}
                  <div className="absolute left-4 top-4 flex flex-col items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 mb-1">مصدر ضوء متغير</span>
                    <div className="relative">
                      {/* Visual Lamp Head */}
                      <div className={`w-10 h-10 rounded-full border-2 border-slate-400 bg-slate-300 flex items-center justify-center shadow-xs transition-colors duration-300 ${isRunning && lightIntensity > 0 ? 'bg-yellow-200 border-yellow-400 ring-4 ring-yellow-300/40' : ''}`}>
                        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${isRunning && lightIntensity > 0 ? 'text-yellow-600 animate-pulse' : 'text-slate-500'}`}>
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx="12" cy="12" r="4" fill="currentColor" />
                        </svg>
                      </div>
                      
                      {/* Dynamic light rays / beam casting onto the beaker */}
                      {isRunning && lightIntensity > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: lightIntensity / 100 * 0.45 + 0.1 }}
                          className="absolute left-5 top-5 w-48 h-32 origin-left bg-gradient-to-r from-yellow-300/60 to-transparent pointer-events-none"
                          style={{
                            clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)',
                            transform: 'rotate(15deg)',
                          }}
                        />
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 mt-1 font-mono">{lightIntensity} واط</span>
                  </div>

                  {/* Beaker & Apparatus Setup */}
                  <div 
                    className="relative mx-auto mt-6 w-52 h-48 flex items-end justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {/* Stand/Base holding the beaker */}
                    <div className="absolute bottom-0 w-36 h-2 bg-slate-700 rounded-t-md shadow-xs" />
                    
                    {/* Glass Beaker */}
                    <div className="absolute bottom-2 w-32 h-36 border-4 border-slate-300/70 bg-gradient-to-t from-sky-400/25 to-sky-200/10 rounded-b-3xl rounded-t-sm flex items-end justify-center overflow-hidden shadow-inner">
                      
                      {/* Water Level Line & wave */}
                      <div className="absolute bottom-0 left-0 right-0 h-32 bg-sky-300/30 border-t border-sky-400/40">
                        {/* Steam waves if too hot */}
                        {isRunning && temperature >= 42 && (
                          <div className="absolute inset-x-0 top-0 flex justify-around pointer-events-none">
                            <motion.div animate={{ y: [-10, -30], opacity: [0, 0.6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1 h-8 bg-white/40 rounded-full" />
                            <motion.div animate={{ y: [-10, -30], opacity: [0, 0.6, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} className="w-1 h-8 bg-white/40 rounded-full" />
                            <motion.div animate={{ y: [-10, -30], opacity: [0, 0.6, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 1 }} className="w-1 h-8 bg-white/40 rounded-full" />
                          </div>
                        )}
                        
                        {/* Cold Ice block overlay if too cold */}
                        {temperature <= 12 && (
                          <div className="absolute bottom-0 inset-x-0 h-8 bg-blue-200/50 backdrop-blur-xs flex items-center justify-center border-t border-blue-300">
                            <span className="text-[9px] font-bold text-blue-850">ماء بارد جداً</span>
                          </div>
                        )}
                      </div>

                      {/* Inverted Glass Funnel */}
                      <div className="absolute bottom-0 w-24 h-24 flex flex-col items-center">
                        {/* Funnel Stem extending up */}
                        <div className="w-3 h-12 border-2 border-slate-300/70 bg-sky-100/40" />
                        {/* Funnel Cone */}
                        <div className="w-20 h-12 border-2 border-slate-300/70 bg-sky-100/30 rounded-b-xl" style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)' }} />
                      </div>

                      {/* Inverted Graduated Test Tube */}
                      <div className="absolute bottom-10 w-8 h-20 border-2 border-slate-300/80 bg-sky-200/20 rounded-t-full flex flex-col justify-between p-1">
                        {/* Calibration marks on test tube */}
                        <div className="w-full flex flex-col space-y-1 opacity-40">
                          <div className="w-2 h-0.5 bg-slate-600" />
                          <div className="w-4 h-0.5 bg-slate-600" />
                          <div className="w-2 h-0.5 bg-slate-600" />
                          <div className="w-4 h-0.5 bg-slate-600" />
                          <div className="w-2 h-0.5 bg-slate-600" />
                        </div>
                        {/* Gas pocket collecting at the top of the inverted tube */}
                        {isRunning && activeSimulationResult.outputValue > 0 && (
                          <motion.div
                            initial={{ height: 2 }}
                            animate={{ height: Math.min(30, 2 + activeSimulationResult.outputValue / 1.5) }}
                            className="absolute top-0 inset-x-0 bg-white/80 border-b border-sky-300 rounded-t-full"
                          />
                        )}
                      </div>

                      {/* Green Elodea Plant inside the funnel */}
                      <div className={`absolute bottom-1 w-14 h-14 flex items-end justify-center transition-all duration-500 ${temperature >= 48 ? 'saturate-50 hue-rotate-[60deg]' : co2Concentration === 0 ? 'saturate-50' : 'saturate-110 shadow-lg'}`}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Stem */}
                          <path d="M 50 100 Q 48 50 50 10" stroke="#047857" strokeWidth="4" fill="none" />
                          {/* Leaves */}
                          <path d="M 50 85 Q 20 70 45 60 Q 50 75 50 85 Z" fill="#059669" />
                          <path d="M 50 85 Q 80 70 55 60 Q 50 75 50 85 Z" fill="#059669" />
                          <path d="M 50 60 Q 15 50 45 35 Q 50 50 50 60 Z" fill="#10b981" />
                          <path d="M 50 60 Q 85 50 55 35 Q 50 50 50 60 Z" fill="#10b981" />
                          <path d="M 50 35 Q 25 20 48 10 Q 50 25 50 35 Z" fill="#34d399" />
                          <path d="M 50 35 Q 75 20 52 10 Q 50 25 50 35 Z" fill="#34d399" />
                        </svg>
                      </div>

                      {/* Floating Oxygen Bubbles rising from plant up through the funnel and test tube */}
                      {isRunning && Array.from({ length: Math.min(25, bubbleCount) }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: 130, x: 55, opacity: 0, scale: 0.5 }}
                          animate={{
                            y: [120, 95, 65, 25],
                            x: [55, 55 + Math.sin(i) * 3, 55 + (i % 2 === 0 ? 3 : -3), 55 + Math.cos(i) * 4],
                            opacity: [0, 0.9, 0.9, 0],
                            scale: [0.5, 0.8, 1, 0.8]
                          }}
                          transition={{
                            duration: 2.5 + Math.random() * 2.5,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: 'linear'
                          }}
                          className="absolute w-2 h-2 rounded-full border border-sky-200 bg-white/70 shadow-xs"
                        />
                      ))}
                    </div>

                    {/* Apparatus labels pointing to pieces */}
                    <div className="absolute right-0 top-2 flex flex-col space-y-1.5 text-[9px] font-bold text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200 shadow-3xs text-right z-20">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                        <span>أنبوب مدرج لجمع الغاز</span>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                        <span>نبات الإيلوديا المائي</span>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        <span>قمع زجاجي مقلوب</span>
                      </div>
                      {isRunning && activeSimulationResult.outputValue > 0 && (
                        <div className="flex items-center space-x-1 space-x-reverse text-emerald-600 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          <span>فقاعات غاز الأكسجين (O₂)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Blood Typing Lab Render */}
              {selectedLabId === 'lab_blood_typing' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  {/* Glass Microscope Slide */}
                  <div 
                    className="relative w-full bg-white/60 border border-slate-200/80 rounded-2xl p-3 flex flex-col space-y-2 shadow-xs transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 0.9})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-bold text-slate-400">شريحة فحص فصائل الدم الزجاجية (Blood Grouping Slide)</span>
                      <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold">
                        اسم الطالب المتبرع: {sampleId === 'ahmed' ? 'أحمد' : sampleId === 'mona' ? 'منى' : 'فاطمة'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {/* Well A */}
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-[9px] font-bold text-slate-500">حفرة فحص مصل A</span>
                        <div className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center relative overflow-hidden shadow-inner">
                          {/* Animated Dropper adding blue serum */}
                          {isRunning && (
                            <motion.div
                              initial={{ y: -15, opacity: 0 }}
                              animate={{ y: [-15, -2, -15], opacity: [0, 1, 0] }}
                              transition={{ duration: 1.5, repeat: 0 }}
                              className="absolute top-1 w-2 h-6 bg-blue-500 rounded-b-full border border-blue-600 z-20 pointer-events-none"
                            />
                          )}

                          {/* Blood Drop Mixture area */}
                          <div className="absolute inset-1.5 rounded-lg flex items-center justify-center overflow-hidden">
                            {!isRunning ? (
                              /* Untested blood drop */
                              <div className="w-8 h-8 rounded-full bg-red-600 shadow-md flex items-center justify-center animate-pulse">
                                <span className="text-[8px] font-bold text-white opacity-90">دم مجهول</span>
                              </div>
                            ) : (
                              /* Tested blood reaction */
                              <div className={`w-full h-full rounded-lg flex flex-wrap p-1 transition-all duration-500 ${activeSimulationResult.visualState.clumpA ? 'bg-rose-50 border border-rose-300' : 'bg-rose-600/90'}`}>
                                {activeSimulationResult.visualState.clumpA ? (
                                  /* Agglutinated (Clumped) Cells - Distinct Red Grains */
                                  <div className="grid grid-cols-4 gap-1 w-full h-full items-center justify-items-center">
                                    {Array.from({ length: 12 }).map((_, idx) => (
                                      <motion.div
                                        key={idx}
                                        animate={{ scale: [1, 1.2, 1], x: [0, Math.sin(idx) * 2, 0] }}
                                        transition={{ repeat: Infinity, duration: 1 + Math.random() }}
                                        className="w-2 h-2 bg-red-700 border border-red-900 rounded-full shadow-3xs"
                                      />
                                    ))}
                                    <span className="absolute bottom-1 right-1 text-[8px] font-black text-rose-800 bg-rose-100 px-1 rounded-sm">تخثر (+)</span>
                                  </div>
                                ) : (
                                  /* Uniform Smooth Negative Reaction */
                                  <div className="w-full h-full flex items-center justify-center bg-rose-600/80">
                                    <span className="text-[8px] font-bold text-white text-center">متجانس (-)</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Well B */}
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-[9px] font-bold text-slate-500">حفرة فحص مصل B</span>
                        <div className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center relative overflow-hidden shadow-inner">
                          {/* Animated Dropper adding yellow serum */}
                          {isRunning && (
                            <motion.div
                              initial={{ y: -15, opacity: 0 }}
                              animate={{ y: [-15, -2, -15], opacity: [0, 1, 0] }}
                              transition={{ duration: 1.5, repeat: 0 }}
                              className="absolute top-1 w-2 h-6 bg-yellow-400 rounded-b-full border border-yellow-500 z-20 pointer-events-none"
                            />
                          )}

                          {/* Blood Drop Mixture area */}
                          <div className="absolute inset-1.5 rounded-lg flex items-center justify-center overflow-hidden">
                            {!isRunning ? (
                              <div className="w-8 h-8 rounded-full bg-red-600 shadow-md flex items-center justify-center animate-pulse">
                                <span className="text-[8px] font-bold text-white opacity-90">دم مجهول</span>
                              </div>
                            ) : (
                              <div className={`w-full h-full rounded-lg flex flex-wrap p-1 transition-all duration-500 ${activeSimulationResult.visualState.clumpB ? 'bg-rose-50 border border-rose-300' : 'bg-rose-600/90'}`}>
                                {activeSimulationResult.visualState.clumpB ? (
                                  <div className="grid grid-cols-4 gap-1 w-full h-full items-center justify-items-center">
                                    {Array.from({ length: 12 }).map((_, idx) => (
                                      <motion.div
                                        key={idx}
                                        animate={{ scale: [1, 1.2, 1], x: [0, Math.sin(idx) * 2, 0] }}
                                        transition={{ repeat: Infinity, duration: 1 + Math.random() }}
                                        className="w-2 h-2 bg-red-700 border border-red-900 rounded-full shadow-3xs"
                                      />
                                    ))}
                                    <span className="absolute bottom-1 right-1 text-[8px] font-black text-rose-800 bg-rose-100 px-1 rounded-sm">تخثر (+)</span>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-rose-600/80">
                                    <span className="text-[8px] font-bold text-white text-center">متجانس (-)</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Well D */}
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-[9px] font-bold text-slate-500">حفرة فحص مصل D (Rh)</span>
                        <div className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center relative overflow-hidden shadow-inner">
                          {/* Animated Dropper adding clear serum */}
                          {isRunning && (
                            <motion.div
                              initial={{ y: -15, opacity: 0 }}
                              animate={{ y: [-15, -2, -15], opacity: [0, 1, 0] }}
                              transition={{ duration: 1.5, repeat: 0 }}
                              className="absolute top-1 w-2 h-6 bg-slate-200 rounded-b-full border border-slate-300 z-20 pointer-events-none"
                            />
                          )}

                          {/* Blood Drop Mixture area */}
                          <div className="absolute inset-1.5 rounded-lg flex items-center justify-center overflow-hidden">
                            {!isRunning ? (
                              <div className="w-8 h-8 rounded-full bg-red-600 shadow-md flex items-center justify-center animate-pulse">
                                <span className="text-[8px] font-bold text-white opacity-90">دم مجهول</span>
                              </div>
                            ) : (
                              <div className={`w-full h-full rounded-lg flex flex-wrap p-1 transition-all duration-500 ${activeSimulationResult.visualState.clumpD ? 'bg-rose-50 border border-rose-300' : 'bg-rose-600/90'}`}>
                                {activeSimulationResult.visualState.clumpD ? (
                                  <div className="grid grid-cols-4 gap-1 w-full h-full items-center justify-items-center">
                                    {Array.from({ length: 12 }).map((_, idx) => (
                                      <motion.div
                                        key={idx}
                                        animate={{ scale: [1, 1.2, 1], x: [0, Math.sin(idx) * 2, 0] }}
                                        transition={{ repeat: Infinity, duration: 1 + Math.random() }}
                                        className="w-2 h-2 bg-red-700 border border-red-900 rounded-full shadow-3xs"
                                      />
                                    ))}
                                    <span className="absolute bottom-1 right-1 text-[8px] font-black text-rose-800 bg-rose-100 px-1 rounded-sm">تخثر (+ Rh)</span>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-rose-600/80">
                                    <span className="text-[8px] font-bold text-white text-center">متجانس (- Rh)</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blood Transfusion Compatibility Infographic */}
                  {isRunning && (
                    <div className="w-full bg-slate-800/5 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between z-10 text-xs">
                      {/* Donor bag */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="relative w-10 h-12 border-2 border-red-400 bg-gradient-to-b from-red-500 to-red-800 rounded-b-xl flex flex-col justify-end items-center p-1 shadow-xs">
                          <span className="text-[9px] font-black text-white font-mono bg-slate-950/40 px-1 rounded-sm">
                            {activeSimulationResult.visualState.bloodType}
                          </span>
                          <div className="w-1.5 h-3 bg-red-300 absolute -top-1 rounded-md" />
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] font-bold text-slate-500">دم المتبرع</span>
                          <span className="font-extrabold text-slate-700 text-[10px]">فصيلة ({activeSimulationResult.visualState.bloodType})</span>
                        </div>
                      </div>

                      {/* Tube flow animation */}
                      <div className="flex-1 h-4 bg-slate-200 border border-slate-300 mx-3 rounded-full relative overflow-hidden flex items-center justify-center">
                        {activeSimulationResult.visualState.isSafe ? (
                          /* Safe Flow Animation */
                          <>
                            <motion.div
                              animate={{ x: [-100, 150] }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                              className="absolute w-12 h-2 bg-emerald-500/80 rounded-full"
                            />
                            <span className="text-[8px] font-black text-emerald-800 z-10">سريان آمن ✓</span>
                          </>
                        ) : (
                          /* Clumping / Blocked Flow Alert */
                          <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="w-full h-full bg-rose-600 flex items-center justify-center"
                            >
                              <span className="text-[8px] font-black text-white">انسداد وتخثر قاتل ⚠</span>
                            </motion.div>
                          </div>
                        )}
                      </div>

                      {/* Recipient body/heart */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] font-bold text-slate-500">المريض المستقبل</span>
                          <span className="font-extrabold text-slate-700 text-[10px]">فصيلة ({recipientType})</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center shadow-3xs">
                          <svg viewBox="0 0 24 24" className={`w-5 h-5 ${activeSimulationResult.visualState.isSafe ? 'text-emerald-600' : 'text-rose-600 animate-bounce'}`}>
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transpiration Lab Render */}
              {selectedLabId === 'lab_transpiration' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-sky-50 to-emerald-50 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  {/* Environmental Indicators Overlay */}
                  <div className="flex justify-between items-start z-10">
                    {/* Wind Indicator */}
                    <div className="flex flex-col items-end space-y-1 bg-white/80 p-2 rounded-lg border border-slate-200 shadow-3xs text-xs">
                      <span className="text-[9px] font-bold text-slate-500">حالة الرياح</span>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className={`w-2 h-2 rounded-full ${windSpeed > 0 ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="font-bold text-slate-700 font-mono">{windSpeed} م/ث</span>
                      </div>
                    </div>

                    {/* Humidity Indicator */}
                    <div className="flex flex-col items-end space-y-1 bg-white/80 p-2 rounded-lg border border-slate-200 shadow-3xs text-xs">
                      <span className="text-[9px] font-bold text-slate-500">الرطوبة الجوية</span>
                      <span className="font-bold text-slate-700 font-mono">{humidity}%</span>
                    </div>

                    {/* Temp Indicator */}
                    <div className="flex flex-col items-end space-y-1 bg-white/80 p-2 rounded-lg border border-slate-200 shadow-3xs text-xs">
                      <span className="text-[9px] font-bold text-slate-500">درجة الحرارة</span>
                      <span className="font-bold text-slate-700 font-mono">{temp} °م</span>
                    </div>

                    {/* Light Indicator */}
                    <div className="flex flex-col items-end space-y-1 bg-white/80 p-2 rounded-lg border border-slate-200 shadow-3xs text-xs">
                      <span className="text-[9px] font-bold text-slate-500">الإضاءة</span>
                      <span className={`font-bold ${lightOn ? 'text-amber-600' : 'text-slate-400'}`}>
                        {lightOn ? 'مفتوح (نهار)' : 'مغلق (ظلام)'}
                      </span>
                    </div>
                  </div>

                  {/* Active visual conditions rendering over the background */}
                  {isRunning && (
                    <div className="absolute inset-0 pointer-events-none z-0">
                      {/* Sun/Heat rays if temp is high */}
                      {temp >= 35 && (
                        <div className="absolute inset-0 bg-amber-500/5 transition-all duration-300" />
                      )}
                      
                      {/* Wind gusts moving from right to left */}
                      {windSpeed > 0 && (
                        <div className="absolute inset-0 flex flex-col justify-around overflow-hidden py-4 opacity-40">
                          <motion.div animate={{ x: [450, -100] }} transition={{ repeat: Infinity, duration: Math.max(1, 4 / windSpeed), ease: 'linear' }} className="w-24 h-0.5 bg-white/80 rounded-full shadow-xs" />
                          <motion.div animate={{ x: [450, -100] }} transition={{ repeat: Infinity, duration: Math.max(1, 3 / windSpeed), ease: 'linear', delay: 1 }} className="w-16 h-0.5 bg-white/80 rounded-full shadow-xs" />
                          <motion.div animate={{ x: [450, -100] }} transition={{ repeat: Infinity, duration: Math.max(1, 5 / windSpeed), ease: 'linear', delay: 2 }} className="w-20 h-0.5 bg-white/80 rounded-full shadow-xs" />
                        </div>
                      )}

                      {/* Mist overlays if humidity is very high */}
                      {humidity >= 75 && (
                        <div className="absolute inset-0 bg-slate-100/20 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-[8px] font-bold text-slate-500/50 bg-white/30 px-1 rounded-sm">ضباب رطوبة مرتفعة</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Potometer Physical Apparatus Layout */}
                  <div 
                    className="relative w-full h-40 flex items-end justify-between z-10 px-4 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.1})`,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {/* Left Side: Plant shoot sealed in water vessel */}
                    <div className="relative flex flex-col items-center">
                      {/* Plant Shoot with leaves */}
                      <div className="absolute -top-16 w-16 h-16 flex items-end justify-center z-10">
                        <svg viewBox="0 0 100 100" className={`w-full h-full text-emerald-600 transition-all ${isRunning && windSpeed > 0 ? 'animate-pulse' : ''}`}>
                          <path d="M 50 100 Q 45 60 50 20" stroke="#047857" strokeWidth="5" fill="none" />
                          {/* Leaves */}
                          <path d="M 50 80 C 20 70, 15 50, 45 40 C 50 50, 50 70, 50 80 Z" fill="currentColor" opacity="0.85" />
                          <path d="M 50 80 C 80 70, 85 50, 55 40 C 50 50, 50 70, 50 80 Z" fill="currentColor" opacity="0.85" />
                          <path d="M 50 50 C 20 40, 25 20, 48 15 C 50 25, 50 40, 50 50 Z" fill="#10b981" />
                          <path d="M 50 50 C 80 40, 75 20, 52 15 C 50 25, 50 40, 50 50 Z" fill="#10b981" />
                        </svg>
                        
                        {/* Rising water vapor droplets representing active transpiration */}
                        {isRunning && activeSimulationResult.visualState.bubbleSpeed > 0 && (
                          Array.from({ length: 3 }).map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ y: 0, opacity: 0 }}
                              animate={{ y: -30, opacity: [0, 0.8, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                              className="absolute w-1.5 h-1.5 rounded-full bg-sky-300"
                              style={{ left: 15 + i * 15 }}
                            />
                          ))
                        )}
                      </div>

                      {/* Rubber Stopper */}
                      <div className="w-8 h-4 bg-slate-700 rounded-t-sm z-10" />
                      {/* Glass reservoir filled with water */}
                      <div className="w-10 h-16 border-2 border-slate-300/80 bg-gradient-to-b from-sky-300/30 to-sky-400/40 rounded-b-xl flex justify-center items-end shadow-inner">
                        <span className="text-[7px] font-bold text-sky-850 mb-1">غرفة الغصن</span>
                      </div>
                    </div>

                    {/* Center Connector: Capillary horizontal tube with Ruler scale */}
                    <div className="flex-1 flex flex-col justify-end mx-2 pb-1 relative">
                      {/* Millimeter Graduation scale (Ruler) */}
                      <div className="w-full h-5 bg-amber-50 border border-amber-200 flex flex-col justify-end px-1 select-none shadow-3xs rounded-sm mb-1 z-0">
                        <div className="w-full flex justify-between text-[7px] font-bold text-amber-900 font-mono">
                          <span>0 ملم</span>
                          <span>20</span>
                          <span>40</span>
                          <span>60</span>
                          <span>80</span>
                          <span>100 ملم</span>
                        </div>
                        {/* Scale tick lines */}
                        <div className="w-full flex justify-between h-1 px-1">
                          {Array.from({ length: 11 }).map((_, i) => (
                            <div key={i} className={`w-0.5 bg-amber-800 ${i % 5 === 0 ? 'h-1.5' : 'h-1'}`} />
                          ))}
                        </div>
                      </div>

                      {/* Capillary Glass Tube */}
                      <div className="w-full h-4 bg-sky-200/20 border border-slate-300/70 rounded-md relative overflow-hidden flex items-center z-10">
                        {/* Colored Water inside tube */}
                        <div className="absolute inset-y-0 left-0 right-0 bg-sky-400/25" />
                        
                        {/* Indicators Air Bubble sliding along the tube */}
                        {isRunning && activeSimulationResult.visualState.bubbleSpeed > 0 ? (
                          <motion.div
                            animate={{
                              x: [240, 10],
                            }}
                            transition={{
                              duration: 15 / activeSimulationResult.visualState.bubbleSpeed,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                            className="absolute w-6 h-3 bg-white border-x-2 border-slate-600 rounded-full shadow-inner flex items-center justify-center"
                          >
                            {/* Tiny bubble indicator dot */}
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300/50" />
                          </motion.div>
                        ) : (
                          /* Stationary bubble if not running */
                          <div className="absolute left-[200px] w-6 h-3 bg-white border-x-2 border-slate-600 rounded-full shadow-inner flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300/50" />
                          </div>
                        )}
                      </div>
                      <div className="text-[7px] text-center font-bold text-slate-500 mt-0.5">أنبوبة شعرية زجاجية دقيقة</div>
                    </div>

                    {/* Right Side: Reset Syringe Reservoir */}
                    <div className="relative flex flex-col items-center">
                      {/* Syringe Plunger */}
                      <motion.div
                        animate={isRunning ? { y: [0, 3, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 8 }}
                        className="w-4 h-12 bg-slate-400 border border-slate-500 rounded-t-xs"
                        title="مكبس دفع الماء لإعادة تعيين الفقاعة"
                      />
                      {/* Syringe Cylinder with water */}
                      <div className="w-8 h-16 border-2 border-slate-300 bg-gradient-to-b from-sky-300/30 to-sky-400/40 rounded-b-lg flex justify-center relative shadow-inner">
                        {/* Stopcock valve indicator */}
                        <div className="absolute -bottom-1 w-4 h-2 bg-slate-700 rounded-xs" />
                        <span className="text-[7px] font-bold text-sky-850 absolute top-2 text-center leading-3">مستودع<br/>الماء</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lab 1: Nutrient Detectors Render */}
              {selectedLabId === 'lab_u1_l1' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-indigo-50/50 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      الكاشف المختار: {
                        variablesState.reagent === 'iodine' ? 'محلول اليود' : 
                        variablesState.reagent === 'benedict' ? 'بندكت الأزرق' : 'كاشف البيوريت'
                      }
                    </span>
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 py-1 px-2.5 rounded-full border border-indigo-100">
                      حالة التفاعل: {isRunning ? activeSimulationResult.visualState.status : 'جاهز للبدء'}
                    </span>
                  </div>

                  {/* Chemical Apparatus */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-end justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {/* Stand structure */}
                    <div className="absolute bottom-0 w-44 h-1.5 bg-slate-700 rounded-full" />
                    <div className="absolute bottom-1 w-1.5 h-36 bg-slate-600 left-8" />
                    <div className="absolute top-10 w-24 h-1.5 bg-slate-500 left-8" />

                    {/* Test Tube */}
                    <div className="absolute bottom-1 w-14 h-32 border-3 border-slate-300/80 bg-white/20 rounded-b-full flex flex-col justify-end overflow-hidden shadow-inner">
                      {/* Chemical Liquid Inside */}
                      <motion.div
                        initial={{ height: 35 }}
                        animate={{ 
                          height: isRunning ? 55 : 35,
                          backgroundColor: isRunning ? activeSimulationResult.visualState.color : '#cbd5e1'
                        }}
                        transition={{ duration: 1.5 }}
                        className="w-full flex flex-col justify-start items-center relative"
                      >
                        {/* Bubbles if running & positive */}
                        {isRunning && activeSimulationResult.outputValue > 0 && (
                          <div className="absolute inset-0 overflow-hidden">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ y: 50, x: 15 + Math.random() * 20, opacity: 0 }}
                                animate={{ y: -5, opacity: [0, 0.8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                className="absolute w-1.5 h-1.5 rounded-full bg-white/45"
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-[7px] font-extrabold text-white/90 mt-1 font-sans text-center leading-3">العينة الكاشفة</span>
                      </motion.div>
                    </div>

                    {/* Dropper hanging above */}
                    <motion.div 
                      animate={isRunning ? { y: [0, 15, 0] } : {}}
                      transition={{ duration: 1.2, repeat: 0 }}
                      className="absolute top-4 w-6 h-16 flex flex-col items-center justify-between"
                    >
                      {/* Squeeze bulb */}
                      <div className="w-5 h-5 bg-red-600 rounded-full" />
                      {/* Glass body */}
                      <div className="w-2.5 h-8 bg-sky-100/60 border border-slate-300/80 rounded-b-md flex justify-center items-end">
                        {/* Drop leaving */}
                        {isRunning && (
                          <motion.div
                            initial={{ y: 5, opacity: 1, scale: 0.8 }}
                            animate={{ y: 55, opacity: [1, 1, 0], scale: 1.1 }}
                            transition={{ duration: 0.8 }}
                            className="absolute w-2 h-2 rounded-full"
                            style={{ 
                              backgroundColor: variablesState.reagent === 'iodine' ? '#d97706' : 
                                               variablesState.reagent === 'benedict' ? '#2563eb' : '#a855f7' 
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    يمكنك قياس تفاعلات كيميائية متعددة بتغيير نوع العينة أو الكاشف الكيميائي.
                  </div>
                </div>
              )}

              {/* Lab 3: Ruminant Digestion Render */}
              {selectedLabId === 'lab_u1_l3' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      الحيوان: {variablesState.animal_type === 'ruminant' ? 'مجتر (البقرة)' : 'غير مجتر (الحصان)'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 font-mono">
                      كفاءة هضم السيليلوز: {isRunning ? activeSimulationResult.outputValue : 0}%
                    </span>
                  </div>

                  {/* Animal/Stomach Schematic representation */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="relative w-48 h-32 bg-white/70 rounded-3xl border border-emerald-150 p-3 flex flex-col justify-between shadow-xs">
                      <div className="text-[8px] font-bold text-slate-400 text-center border-b border-slate-100 pb-1">
                        رسم توضيحي لغرفة التخمر والتحلل البكتيري
                      </div>

                      {/* Chambers layout */}
                      <div className="flex-1 grid grid-cols-2 gap-2 mt-2">
                        {variablesState.animal_type === 'ruminant' ? (
                          <>
                            {/* Rumen Chamber */}
                            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-2 flex flex-col justify-between relative overflow-hidden">
                              <span className="text-[8px] font-extrabold text-emerald-800">الكرش (Rumen)</span>
                              <span className="text-[7px] text-slate-500">حيث تتم معالجة الألياف</span>
                              {isRunning && (
                                <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                                    className="w-10 h-10 border-2 border-dashed border-emerald-400/40 rounded-full"
                                  />
                                  <span className="text-[6px] font-black text-emerald-700 animate-pulse">تخمير ميكروبي</span>
                                </div>
                              )}
                            </div>

                            {/* Stomach blocks */}
                            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-2 flex flex-col justify-around">
                              <span className="text-[7px] font-extrabold text-slate-700">المنفحة (Abomasum)</span>
                              <span className="text-[6px] text-slate-400">معدة حقيقية (إفراز إنزيمي)</span>
                              <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                <motion.div 
                                  animate={isRunning ? { width: '80%' } : { width: '10%' }}
                                  className="h-full bg-slate-500"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Simple Stomach */}
                            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-2 flex flex-col justify-around">
                              <span className="text-[8px] font-extrabold text-slate-800">معدة بسيطة دقيقة</span>
                              <span className="text-[7px] text-slate-500">هضم مائي حمضي</span>
                            </div>

                            {/* Cecum Chamber */}
                            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-2 flex flex-col justify-between relative overflow-hidden">
                              <span className="text-[8px] font-extrabold text-amber-800">الأعور (Cecum)</span>
                              <span className="text-[6px] text-slate-500">تخمر بطيء بعد الأمعاء</span>
                              {isRunning && (
                                <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                                  <motion.div 
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-8 h-8 rounded-full border border-dashed border-amber-400/50"
                                  />
                                  <span className="text-[6px] font-black text-amber-750">تفكيك ميكروبي</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Microbes sparkles */}
                      {isRunning && (
                        <div className="absolute inset-x-0 bottom-1 flex justify-center space-x-2 space-x-reverse">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    المجترات تستطيع استخلاص الطاقة كاملة من الأعشاب بفضل الكائنات الدقيقة المتعايشة في كرشها.
                  </div>
                </div>
              )}

              {/* Lab 4: Digestive Enzymes Render */}
              {selectedLabId === 'lab_u1_l4' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-blue-50/40 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      الإنزيم: {
                        variablesState.enzyme === 'amylase' ? 'الأميليز' : 
                        variablesState.enzyme === 'pepsin' ? 'الببسين المعدي' : 'اللايباز البنكرياسي'
                      }
                    </span>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-50 py-1 px-2.5 rounded-full border border-blue-100">
                      حرارة الوسط: {variablesState.temp_c}°م | pH الوسط: {variablesState.ph_level}
                    </span>
                  </div>

                  {/* Reaction vessel and molecular simulation */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="w-48 h-32 border-2 border-slate-300 bg-white/80 rounded-2xl relative overflow-hidden flex flex-col justify-between p-2 shadow-inner">
                      {/* Thermometer / pH Gauge indicators */}
                      <div className="flex justify-between items-center text-[7px] font-bold text-slate-400 border-b border-slate-150 pb-1">
                        <span>مقياس النشاط الإنزيمي</span>
                        <span>مقياس الحرارة والـ pH</span>
                      </div>

                      {/* Active collision space */}
                      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                        {isRunning && activeSimulationResult.outputValue > 0 ? (
                          /* Active animation: Molecules lock and key */
                          <div className="w-full h-full relative">
                            {/* Enzyme molecule (large center) */}
                            <motion.div 
                              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute left-16 top-6 w-12 h-12 bg-sky-200 border-2 border-sky-400 rounded-full flex items-center justify-center shadow-3xs"
                            >
                              <span className="text-[7px] font-black text-sky-800">إنزيم</span>
                            </motion.div>

                            {/* Substrate colliding */}
                            <motion.div
                              animate={{ 
                                x: [0, 60, 0],
                                y: [0, 20, 0]
                              }}
                              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                              className="absolute left-4 top-4 w-5 h-5 bg-amber-400 border border-amber-600 rounded-md flex items-center justify-center"
                            >
                              <span className="text-[6px] font-bold text-white">غذاء</span>
                            </motion.div>

                            {/* Product breaking away */}
                            <motion.div
                              animate={{ 
                                x: [80, 140],
                                opacity: [0, 1, 0]
                              }}
                              transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                              className="absolute left-10 top-12 w-4 h-4 bg-emerald-400 border border-emerald-600 rounded-full flex items-center justify-center"
                            >
                              <span className="text-[5px] font-bold text-white">نواتج</span>
                            </motion.div>
                          </div>
                        ) : isRunning ? (
                          /* Denatured / Inactive state */
                          <div className="flex flex-col items-center justify-center text-center space-y-1">
                            <span className="text-[12px]">⚠️</span>
                            <span className="text-[8px] font-black text-rose-600">تثبيط كيميائي / تخريب حراري</span>
                            <span className="text-[7px] text-slate-400 leading-normal">بنية الإنزيم الفراغية مشوهة وغير قادرة على هضم المادة المستهدفة</span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400">انقر على تشغيل لبدء تحلل الغذاء</span>
                        )}
                      </div>

                      {/* Percentage gauge at bottom */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${activeSimulationResult.outputValue}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    لكل إنزيم درجة حموضة pH مثالية ودرجة حرارة قصوى (أهمها 37 درجة مئوية للجسم) يعمل عندها بكفاءة.
                  </div>
                </div>
              )}

              {/* Lab 7: Immune Defense Render */}
              {selectedLabId === 'lab_u2_l3' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-rose-50/30 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      التطعيم: {variablesState.vaccination_status ? 'مطعم ومحصن مسبقاً ✓' : 'غير مطعم (أعراض شديدة)'}
                    </span>
                    <span className="text-[10px] font-bold text-rose-800 font-mono">
                      الأجسام المضادة المتكونة: {isRunning ? activeSimulationResult.outputValue : 0} وحدة
                    </span>
                  </div>

                  {/* Immune battle cell space */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="w-52 h-32 bg-slate-900 border border-slate-700 rounded-2xl relative overflow-hidden p-2 shadow-inner">
                      {/* Glowing radar lines */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-25" />

                      {isRunning ? (
                        <div className="w-full h-full relative">
                          {/* Pathogens (Antigens) floating */}
                          {Array.from({ length: 4 }).map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                x: [20 + i * 40, 10 + i * 35, 20 + i * 40],
                                y: [20 + i * 15, 60 - i * 10, 20 + i * 15]
                              }}
                              transition={{ repeat: Infinity, duration: 4 }}
                              className="absolute w-4 h-4 bg-red-600 border border-red-800 rounded-full flex items-center justify-center shadow-xs"
                            >
                              <span className="text-[6px] font-bold text-white">جرثومة</span>
                            </motion.div>
                          ))}

                          {/* Antibodies (Y-shaped green indicators) */}
                          {variablesState.vaccination_status ? (
                            /* Numerous antibodies docking and attacking instantly */
                            Array.from({ length: 7 }).map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ x: 180, y: 10 + i * 15 }}
                                animate={{ 
                                  x: [180, 40 + (i % 3) * 45, 180],
                                  y: [10 + i * 15, 25 + (i % 2) * 20, 10 + i * 15]
                                }}
                                transition={{ repeat: Infinity, duration: 3, delay: i * 0.2 }}
                                className="absolute text-emerald-400 font-bold text-xs"
                              >
                                Y
                              </motion.div>
                            ))
                          ) : (
                            /* Slow emerging, sparse antibodies */
                            Array.from({ length: 2 }).map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ x: 180, y: 30 + i * 30, opacity: 0 }}
                                animate={{ 
                                  x: [180, 50, 180],
                                  opacity: [0, 1, 1, 0]
                                }}
                                transition={{ repeat: Infinity, duration: 5, delay: 2.5 }}
                                className="absolute text-emerald-400 font-bold text-[10px]"
                              >
                                Y
                              </motion.div>
                            ))
                          )}

                          <div className="absolute bottom-1 right-2 text-[6px] font-mono text-slate-400">
                            {variablesState.vaccination_status ? 'دفاعات الذاكرة نشطة ومكتملة' : 'دفاعات أولية بطيئة'}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center">
                          <span className="text-rose-500 font-black text-xs animate-pulse">الجسم مهدد بمسببات الأمراض</span>
                          <span className="text-[7px] text-slate-400 mt-1">انقر على زر "تشغيل التجربة" لتشغيل خط الدفاع اللمفاوي</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    اللقاح الافتراضي يدرب الخلايا البائية لإنشاء خلايا الذاكرة الجاهزة لإنتاج ترسانة أسلحة مضادة فورية.
                  </div>
                </div>
              )}

              {/* Lab 8: Yeast Respiration Render */}
              {selectedLabId === 'lab_u3_l1' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-amber-50/30 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      تركيز السكر المضاف: {variablesState.sugar_concentration}%
                    </span>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 py-1 px-2.5 rounded-full border border-amber-100">
                      حرارة الوسط: {variablesState.temp_celsius}°م
                    </span>
                  </div>

                  {/* Fermentation Flask & collection tube setup */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-end justify-between z-10 px-6 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {/* Yeast Flask (left) */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-14 h-20 border-2 border-slate-300/80 bg-white/20 rounded-b-xl relative overflow-hidden flex flex-col justify-end">
                        {/* Yeast Suspension */}
                        <motion.div 
                          animate={{ 
                            height: variablesState.sugar_concentration > 0 ? 30 : 15,
                            backgroundColor: isRunning && variablesState.temp_celsius < 50 && variablesState.sugar_concentration > 0 ? '#fef3c7' : '#e2e8f0'
                          }}
                          className="w-full relative"
                        >
                          {/* Active bubbles in yeast suspension */}
                          {isRunning && variablesState.temp_celsius < 50 && variablesState.sugar_concentration > 0 && (
                            <div className="absolute inset-0">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ y: 25, x: 5 + Math.random() * 30, opacity: 0 }}
                                  animate={{ y: 0, opacity: [0, 0.9, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                                  className="absolute w-1.5 h-1.5 rounded-full bg-white border border-amber-100"
                                />
                              ))}
                            </div>
                          )}
                        </motion.div>
                        <span className="absolute top-2 text-[6px] text-center w-full font-bold text-slate-500">محلول خميرة</span>
                      </div>
                      <span className="text-[7px] font-extrabold text-slate-600 mt-1">دورق التخمر</span>
                    </div>

                    {/* Delivery Hose Tube */}
                    <div className="flex-1 h-1 bg-slate-300 relative mx-1 mb-10">
                      {isRunning && activeSimulationResult.outputValue > 0 && (
                        <motion.div 
                          animate={{ x: [-50, 100] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          className="absolute w-4 h-0.5 bg-sky-400"
                        />
                      )}
                    </div>

                    {/* Inverted test tube measuring cylinder (right) */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-10 h-24 border-2 border-slate-300 bg-sky-100/30 rounded-t-full relative flex flex-col justify-start overflow-hidden">
                        {/* Displaced Water Column */}
                        <motion.div
                          animate={{ 
                            height: isRunning ? Math.min(65, 5 + activeSimulationResult.outputValue * 1.5) : 5
                          }}
                          className="w-full bg-sky-200/40 border-b border-sky-300 absolute bottom-0"
                        />
                        {/* CO2 gas collecting at the top of inverted tube */}
                        {isRunning && activeSimulationResult.outputValue > 0 && (
                          <div className="absolute top-1 inset-x-0 text-center text-[7px] font-black text-amber-900 animate-pulse bg-amber-50/50 py-0.5">
                            CO₂ غاز
                          </div>
                        )}
                        <div className="flex flex-col space-y-1.5 opacity-35 px-1.5 mt-2">
                          <div className="w-2 h-0.5 bg-slate-700" />
                          <div className="w-3 h-0.5 bg-slate-700" />
                          <div className="w-2 h-0.5 bg-slate-700" />
                          <div className="w-3 h-0.5 bg-slate-700" />
                        </div>
                      </div>
                      <span className="text-[7px] font-extrabold text-slate-600 mt-1">مخبار جمع الغاز</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    التخمر ينتج غاز CO₂ الذي يزيح الماء لأسفل، وكحولاً إيثيلياً وطاقة محدودة في غياب الأكسجين المنهجي.
                  </div>
                </div>
              )}

              {/* Lab 9: Lung Capacity and Pulse Render */}
              {selectedLabId === 'lab_u3_l2' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-700 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10 border-b border-slate-850 pb-2">
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-800/80 py-1 px-2.5 rounded-full border border-slate-700">
                      مستوى التدريب البدني: {variablesState.athlete_status ? 'رياضي محترف ✓' : 'غير رياضي (خمول)'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-400 font-mono tracking-widest uppercase">
                      LUNG-OS v3.5
                    </span>
                  </div>

                  {/* Graphical medical display screen */}
                  <div 
                    className="relative mx-auto w-full max-w-sm h-36 flex items-center justify-around z-10 mt-1.5 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'center'
                    }}
                  >
                    {/* Cardiac & Pulse board */}
                    <div className="flex flex-col items-center justify-center bg-slate-900/85 border border-slate-800 rounded-xl p-3 w-28 h-28 space-y-2">
                      <span className="text-[7px] text-slate-400 font-bold">ضربات القلب (ECG)</span>
                      <svg viewBox="0 0 50 30" className="w-16 h-8 text-rose-500">
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: variablesState.exercise_level === 'run' ? 0.7 : variablesState.exercise_level === 'walk' ? 1.2 : 2.0, 
                            ease: 'linear' 
                          }}
                          d="M 0 15 L 15 15 L 18 5 L 22 25 L 25 15 L 50 15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                      </svg>
                      <span className="text-xs font-black text-slate-100 font-mono animate-pulse">
                        {isRunning ? activeSimulationResult.outputValue : '--'} BPM
                      </span>
                    </div>

                    {/* Respiratory capacity curve */}
                    <div className="flex flex-col items-center justify-center bg-slate-900/85 border border-slate-800 rounded-xl p-3 w-44 h-28 space-y-1.5">
                      <span className="text-[7px] text-slate-400 font-bold">حجم هواء الشهيق والزفير الكلي (Spirorhythm)</span>
                      
                      {/* Sinusoidal breathing wave */}
                      <div className="w-36 h-10 border border-slate-800/60 rounded-md bg-black/40 relative overflow-hidden flex items-center">
                        {isRunning ? (
                          <motion.div
                            animate={{
                              x: [-120, 0]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: variablesState.exercise_level === 'run' ? 1.5 : 3.5,
                              ease: 'linear'
                            }}
                            className="absolute flex space-x-0.5"
                          >
                            {/* Repeating sine wave blocks */}
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <svg key={idx} viewBox="0 0 60 30" className="w-14 h-8 text-sky-400 shrink-0">
                                <path d="M 0 15 Q 15 0, 30 15 T 60 15" fill="none" stroke="currentColor" strokeWidth="2.2" />
                              </svg>
                            ))}
                          </motion.div>
                        ) : (
                          <div className="w-full text-center text-[7px] text-slate-600 font-bold">الرئة مستقرة وساكنة</div>
                        )}
                      </div>

                      <div className="flex justify-between w-full text-[6.5px] font-bold text-slate-400 font-mono">
                        <span>السعة الحيوية: {variablesState.athlete_status ? '5.8 L' : '4.2 L'}</span>
                        <span>معدل التنفس: {isRunning ? (variablesState.exercise_level === 'run' ? '42' : '14') : '--'} / د</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] text-center font-bold text-slate-400 bg-slate-900 border border-slate-850 py-1.5 px-3 rounded-lg leading-normal">
                    الرياضيون يمتلكون سعات حيوية رئوية أكبر وعضلات صدرية مرنة تزيد عمق التنفس وتبطئ التعب الفسيولوجي.
                  </div>
                </div>
              )}

              {/* Lab 10: Guttation & Transpiration Render */}
              {selectedLabId === 'lab_u4_l1' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      رطوبة التربة والري: {variablesState.soil_moisture}%
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 py-1 px-2.5 rounded-full border border-emerald-100">
                      رطوبة الجو المحيط: {variablesState.air_humidity_c}%
                    </span>
                  </div>

                  {/* Leaf detailed close up */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="relative w-44 h-32 flex items-center justify-center bg-white/50 border border-slate-200/80 rounded-2xl p-2 shadow-inner overflow-hidden">
                      {/* Central Leaf Vector */}
                      <svg viewBox="0 0 100 80" className="w-32 h-24 text-emerald-600">
                        {/* Leaf structure */}
                        <path d="M 50 10 C 10 30, 15 70, 50 78 C 85 70, 90 30, 50 10 Z" fill="currentColor" stroke="#047857" strokeWidth="2.5" />
                        {/* Leaf veins */}
                        <path d="M 50 10 L 50 78" stroke="#059669" strokeWidth="2" />
                        <path d="M 50 30 Q 30 25 25 35" stroke="#059669" strokeWidth="1.5" fill="none" />
                        <path d="M 50 30 Q 70 25 75 35" stroke="#059669" strokeWidth="1.5" fill="none" />
                        <path d="M 50 50 Q 30 45 20 55" stroke="#059669" strokeWidth="1.5" fill="none" />
                        <path d="M 50 50 Q 70 45 80 55" stroke="#059669" strokeWidth="1.5" fill="none" />
                      </svg>

                      {/* Guttation droplets at the tip and margins */}
                      {isRunning && variablesState.soil_moisture >= 90 && variablesState.air_humidity_c >= 90 && (
                        <>
                          {/* Top drop */}
                          <motion.div 
                            animate={{ scale: [1, 1.4, 1], y: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute top-10 w-2 h-2 bg-sky-400 rounded-full border border-white shadow-xs"
                          />
                          {/* Side drops */}
                          <div className="absolute top-16 left-12 w-1.5 h-1.5 bg-sky-300 rounded-full border border-white animate-pulse" />
                          <div className="absolute top-16 right-12 w-1.5 h-1.5 bg-sky-300 rounded-full border border-white animate-pulse" />
                          <div className="absolute top-22 left-10 w-1.5 h-1.5 bg-sky-300 rounded-full border border-white animate-pulse" />
                          <div className="absolute top-22 right-10 w-1.5 h-1.5 bg-sky-300 rounded-full border border-white animate-pulse" />
                        </>
                      )}

                      {/* Transpiration fine rising waves */}
                      {isRunning && variablesState.soil_moisture > 20 && (variablesState.soil_moisture < 90 || variablesState.air_humidity_c < 90) && (
                        <div className="absolute inset-0 flex justify-around items-start pointer-events-none pt-4">
                          <motion.div animate={{ y: [40, 5], opacity: [0, 0.7, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-10 bg-sky-200/40 rounded-full blur-3xs" />
                          <motion.div animate={{ y: [35, 0], opacity: [0, 0.7, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.7 }} className="w-1.5 h-10 bg-sky-200/40 rounded-full blur-3xs" />
                          <motion.div animate={{ y: [42, 8], opacity: [0, 0.7, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1.4 }} className="w-1.5 h-10 bg-sky-200/40 rounded-full blur-3xs" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    النضح يتم سائلًا من الثغور المائية صباحاً لارتفاع ضغط الجذور، أما النتح فيحدث غازيًا لتبخر الماء من الثغور المنهجية.
                  </div>
                </div>
              )}

              {/* Lab 11: Artificial Kidney Render */}
              {selectedLabId === 'lab_u4_l2' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-sky-50/40 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      مستوى اليوريا بالدم: {variablesState.blood_urea_level} مجم/دسل
                    </span>
                    <span className="text-[9px] font-bold text-sky-750 bg-sky-50 py-1 px-2.5 rounded-full border border-sky-100">
                      معدل تدفق جهاز الديلزة: {variablesState.dialysis_flow} مل/دقيقة
                    </span>
                  </div>

                  {/* Dialyzer machine tubing simulation */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-sm h-44 flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="w-60 h-32 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden p-2 shadow-inner">
                      {/* Counter-current flow lines */}
                      <div className="flex flex-col h-full justify-between relative">
                        
                        {/* Patient Blood line (Red - top) */}
                        <div className="h-10 bg-rose-950/95 border-b border-rose-800 rounded-t-md relative flex items-center justify-between px-3">
                          <span className="text-[7px] text-rose-300 font-extrabold">شريان المريض (دم محمل باليوريا)</span>
                          {isRunning && (
                            <div className="absolute inset-0 overflow-hidden flex items-center">
                              {/* Red blood corpuscles flow */}
                              <motion.div 
                                animate={{ x: [-200, 100] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                className="w-full flex justify-around"
                              >
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <div key={i} className="w-2.5 h-1.5 bg-red-600 rounded-full" />
                                ))}
                              </motion.div>

                              {/* Tiny yellow urea dots diffusing down */}
                              {Array.from({ length: 5 }).map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ y: 5, x: 20 + i * 35, opacity: 1 }}
                                  animate={{ y: 22, opacity: [1, 0.7, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                                  className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-xs"
                                />
                              ))}
                            </div>
                          )}
                          <span className="text-[7px] text-rose-400 font-black z-10 font-mono">دم وارد</span>
                        </div>

                        {/* Dialysis Semi-permeable Membrane indicator */}
                        <div className="h-1.5 bg-indigo-900 border-y border-indigo-700 flex justify-around items-center">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="w-1 h-0.5 bg-indigo-300/40 rounded-full" />
                          ))}
                        </div>

                        {/* Dialysate Washing fluid line (Blue - bottom, counter flow left to right) */}
                        <div className="h-10 bg-sky-950/90 border-t border-sky-800 rounded-b-md relative flex items-center justify-between px-3">
                          <span className="text-[7px] text-sky-300 font-extrabold">سائل غسيل الكلى (يسحب الفضلات)</span>
                          {isRunning && (
                            <div className="absolute inset-0 overflow-hidden flex items-center">
                              <motion.div 
                                animate={{ x: [100, -200] }}
                                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                                className="w-full flex justify-around"
                              >
                                {Array.from({ length: 3 }).map((_, i) => (
                                  <div key={i} className="w-2.5 h-1 bg-sky-500/30 rounded-full" />
                                ))}
                              </motion.div>
                              {/* Urea dots exiting with fluid to the left */}
                              {Array.from({ length: 4 }).map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ x: 200 - i * 40, y: 15, opacity: 0 }}
                                  animate={{ x: [200 - i * 40, -10], opacity: [0, 0.8, 0] }}
                                  transition={{ repeat: Infinity, duration: 3, ease: 'linear', delay: i * 0.5 }}
                                  className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                                />
                              ))}
                            </div>
                          )}
                          <span className="text-[7px] text-sky-400 font-black z-10 font-mono">سائل خارج</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    جزيئات اليوريا الصغيرة تنفذ بالانتشار البسيط لغشاء الديلزة بينما البروتينات والدم لا تنفذ لكبر حجمها المنهجي.
                  </div>
                </div>
              )}

              {/* Lab 12: Plant Tropisms Render */}
              {selectedLabId === 'lab_u5_l1' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-amber-50/20 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      نوع الانتحاء المطبق: {
                        variablesState.stimulus === 'light' ? 'الانتحاء الضوئي (Phototropism)' : 
                        variablesState.stimulus === 'gravity' ? 'الانتحاء الأرضي (Geotropism)' : 'الانتحاء المائي (Hydrotropism)'
                      }
                    </span>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 py-1 px-2.5 rounded-full border border-amber-100">
                      القمة النامية: {variablesState.auxin_status === 'normal' ? 'سليمة (أوكسين طبيعي)' : 'مقطوعة (لا أوكسين)'}
                    </span>
                  </div>

                  {/* Bending Seedling simulation */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-end justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {/* Environment elements like lateral light source or wet sponge */}
                    {variablesState.stimulus === 'light' && (
                      <div className="absolute right-6 top-8 flex flex-col items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping absolute" />
                        <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] text-white font-bold shadow-xs">💡</span>
                        <span className="text-[6px] text-amber-800 font-bold mt-1">ضوء جانبي</span>
                      </div>
                    )}

                    {variablesState.stimulus === 'water' && (
                      <div className="absolute right-4 bottom-4 flex flex-col items-center">
                        <div className="w-8 h-8 bg-sky-200 border border-sky-300 rounded-lg flex items-center justify-center text-sky-800 text-xs shadow-3xs font-bold font-sans">💧</div>
                        <span className="text-[6px] text-sky-800 font-bold mt-0.5">إسفنج مائي</span>
                      </div>
                    )}

                    {/* Plant pot and bending stem */}
                    <div className="relative flex flex-col items-center pb-2">
                      {/* Seedling Shoot Stem */}
                      <motion.div
                        animate={{ 
                          rotate: isRunning ? activeSimulationResult.visualState.curvatureAngle : 0 
                        }}
                        transition={{ duration: 1.5 }}
                        className="w-2.5 h-24 bg-emerald-500 rounded-t-full origin-bottom relative flex flex-col items-center"
                      >
                        {/* Glowing green auxin indicators on shaded/lower side */}
                        {isRunning && variablesState.auxin_status === 'normal' && (
                          <div className={`absolute inset-y-0 w-1 bg-green-300/60 rounded-full ${variablesState.stimulus === 'light' ? 'left-0' : 'right-0'}`} />
                        )}

                        {/* Leaves at the top */}
                        <div className="absolute -top-3 w-6 h-4 flex justify-between">
                          <div className="w-3.5 h-2.5 bg-emerald-400 rounded-full rotate-45" />
                          <div className="w-3.5 h-2.5 bg-emerald-400 rounded-full -rotate-45" />
                        </div>
                      </motion.div>

                      {/* Pot base */}
                      <div className="w-16 h-10 bg-amber-800 border-2 border-amber-950 rounded-b-xl rounded-t-sm shadow-inner flex items-center justify-center">
                        <span className="text-[7px] font-black text-amber-100">تربة مغذية</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    هرمون الأوكسين يهرب من الضوء فيتراكم في خلايا الجانب المظلم من الساق مسبباً استطالتها وانحناء الساق للضوء.
                  </div>
                </div>
              )}

              {/* Lab 13: Reflex Arc & Neural Impulse Render */}
              {selectedLabId === 'lab_u5_l2' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      مستوى التعب: {
                        variablesState.fatigue === 'alert' ? 'نشط ومركز (نوم كافٍ)' : 
                        variablesState.fatigue === 'tired' ? 'تعب متوسط (سهر ونعاس)' : 'إرهاق شديد وخمول حاد'
                      }
                    </span>
                    <span className="text-[10px] font-bold text-indigo-800 font-mono">
                      زمن الاستجابة: {isRunning ? activeSimulationResult.outputValue : '--'} ملي ثانية
                    </span>
                  </div>

                  {/* Neural arc path map */}
                  <div 
                    className="relative mx-auto mt-2 w-full max-w-xs h-44 flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      transform: `scale(${dynamicScale * 1.25})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="w-56 h-32 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden p-2 shadow-inner">
                      
                      {/* Reflex path vectors */}
                      <div className="absolute inset-0 flex flex-col justify-between p-3 select-none">
                        
                        {/* Spinal cord (center) */}
                        <div className="absolute left-4 top-10 w-12 h-12 bg-slate-800 border border-indigo-500/50 rounded-full flex flex-col items-center justify-center p-1 shadow-3xs">
                          <span className="text-[6px] font-black text-indigo-300">النخاع الشوكي</span>
                          <span className="text-[5px] text-slate-400">عصب بيني</span>
                        </div>

                        {/* Sensory neuron (upper blue path) */}
                        <svg className="absolute left-16 top-6 w-24 h-12 text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M 90 25 C 60 5, 40 5, 5 15" />
                        </svg>

                        {/* Motor neuron (lower red path) */}
                        <svg className="absolute left-16 top-16 w-24 h-12 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M 5 10 C 40 25, 60 25, 90 5" />
                        </svg>

                        {/* Skin receptor (top right) */}
                        <div className="absolute right-4 top-4 flex items-center space-x-1 space-x-reverse text-[6px] font-bold text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                          <span>مستقبل جلدي حسّي</span>
                        </div>

                        {/* Muscle effector (bottom right) */}
                        <div className="absolute right-4 bottom-4 flex items-center space-x-1 space-x-reverse text-[6px] font-bold text-slate-400">
                          <span className="w-2.5 h-2 bg-rose-500 rounded-sm" />
                          <span>العضلة المنفذة للحركة</span>
                        </div>

                        {/* Active nerve spark / action potential action */}
                        {isRunning && (
                          <>
                            {/* Sensory impulse spark */}
                            <motion.div
                              animate={{ 
                                x: [210, 140, 50],
                                y: [15, 10, 45],
                                opacity: [1, 1, 0]
                              }}
                              transition={{ 
                                duration: variablesState.fatigue === 'exhausted' ? 0.9 : 0.4, 
                                repeat: Infinity, 
                                ease: 'easeOut' 
                              }}
                              className="absolute w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-md z-20 blur-3xs"
                            />

                            {/* Motor impulse spark */}
                            <motion.div
                              animate={{ 
                                x: [50, 140, 210],
                                y: [50, 85, 95],
                                opacity: [0, 1, 1]
                              }}
                              transition={{ 
                                duration: variablesState.fatigue === 'exhausted' ? 0.9 : 0.4, 
                                repeat: Infinity, 
                                ease: 'easeIn',
                                delay: variablesState.fatigue === 'exhausted' ? 0.5 : 0.2
                              }}
                              className="absolute w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-md z-20 blur-3xs"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100">
                    أقواس الانعكاس تتم دون تدخل الدماغ المباشر لتوفير استجابة طوارئ سريعة تحمي نسيج الخلايا من التلف.
                  </div>
                </div>
              )}

              {/* Lab 14: Glucose Regulation Render */}
              {selectedLabId === 'lab_u5_l3' && (
                <div className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-50 to-indigo-50/20 rounded-2xl border border-slate-300 overflow-hidden shadow-md p-4 sm:p-5 flex flex-col justify-between text-right transition-all duration-300`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] sm:text-xs font-bold text-slate-500 bg-white/80 py-1 px-2.5 rounded-full border border-slate-200">
                      البنكرياس: {variablesState.pancreas_health === 'healthy' ? 'سليم تماماً' : 'خلل مناعي بالخلايا (سكري)'}
                    </span>
                    <span className="text-[9px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 py-1 px-2.5 rounded-full border border-indigo-100">
                      الحالة: {variablesState.meal_status === 'fasting' ? 'صائم 12 ساعة' : 'بعد الوجبة مباشرة'}
                    </span>
                  </div>

                  {/* Liver & glucose levels layout - expanded to take up full available container space */}
                  <div className="relative w-full flex-1 my-2 flex items-center justify-center z-10 min-h-0">
                    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden p-3.5 sm:p-5 shadow-inner flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-350 px-1">
                        <span>مخزن الجليكوجين بالكبد</span>
                        <span>شريان مجرى دم الجلوكوز</span>
                      </div>

                      {/* Blood Vessel with flowing glucose spheres */}
                      <div className="h-11 sm:h-14 bg-rose-950/80 border-y border-rose-900 rounded-lg relative overflow-hidden flex items-center my-1.5">
                        <div className="absolute inset-x-0 flex justify-around">
                          {/* Flowing Glucose spheres (yellow) */}
                          {isRunning && (
                            <motion.div
                              animate={{ x: isFullscreen ? [-360, 360] : [-240, 240] }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: variablesState.pancreas_health === 'diabetic' && variablesState.meal_status === 'after_meal' ? 1.5 : 4,
                                ease: 'linear' 
                              }}
                              className="w-full flex justify-around"
                            >
                              {/* If diabetic after meal, lots of yellow sugar spheres */}
                              {Array.from({ 
                                length: variablesState.pancreas_health === 'diabetic' && variablesState.meal_status === 'after_meal' ? 12 : 5 
                              }).map((_, i) => (
                                <div key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-yellow-400 rounded-full shadow-md shrink-0 border border-yellow-200/50" />
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Pancreas cells (beta/alpha islets) and Liver model */}
                      <div className="flex justify-between items-center px-1">
                        {/* Liver icon representation */}
                        <div className="w-28 h-12 sm:w-32 sm:h-14 bg-amber-850 border border-amber-900 rounded-xl flex flex-col items-center justify-center p-1 sm:p-1.5 shadow-sm">
                          <span className="text-[9px] sm:text-[11px] font-black text-amber-100">الكبد (Liver)</span>
                          <span className="text-[8px] sm:text-[10px] text-amber-300 font-bold">
                            {variablesState.meal_status === 'fasting' ? 'تحرير جلوكوز' : 'تخزين جليكوجين'}
                          </span>
                        </div>

                        {/* Hormone indicators */}
                        <div className="flex flex-col items-end space-y-1 sm:space-y-1.5">
                          <div className="flex items-center space-x-1.5 space-x-reverse text-[10px] sm:text-xs font-bold text-slate-250">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-sky-400 rounded-full shadow-xs" />
                            <span className="text-sky-300">أنسولين: {isRunning ? activeSimulationResult.visualState.insulinReleased : 0}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 space-x-reverse text-[10px] sm:text-xs font-bold text-slate-250">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-400 rounded-full shadow-xs" />
                            <span className="text-purple-300">جلوكاجون: {isRunning ? activeSimulationResult.visualState.glucagonReleased : 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] sm:text-[10px] text-center font-bold text-slate-500 bg-white/70 py-1.5 px-3 rounded-lg border border-slate-100 leading-relaxed">
                    البنكرياس يستشعر الجلوكوز كحسّاس ذكي، فيفرز الأنسولين لخفضه، والجلوكاجون لتحريره صائماً عند الحاجة.
                  </div>
                </div>
              )}
            </div>
            );

            const readoutElement = (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 shadow-2xs w-full text-right">
                <div className="flex-1 text-right">
                  <div className="text-xs font-bold text-emerald-800 mb-1">التقرير التحليلي الفوري:</div>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {isRunning ? activeSimulationResult.description : 'انقر على "تشغيل التجربة" لبدء تشغيل أجهزة معمل القياس ورؤية النواتج الكيميائية والفسيولوجية المتغيرة.'}
                  </p>
                </div>

                <div className="sm:mr-4 flex flex-col items-center justify-center bg-white border border-emerald-150 rounded-lg py-2 px-4 min-w-[120px] shadow-3xs">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mb-0.5">معدل القياس</span>
                  <span className="text-sm font-black text-slate-800 font-mono">
                    {isRunning ? activeSimulationResult.outputLabel : '0'}
                  </span>
                </div>
              </div>
            );

            if (isFullscreen) {
              const fullscreenContent = (
                <div 
                  className="fixed inset-0 z-[99999] bg-[#fcfaf4] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden text-right animate-fadeIn" 
                  id="fullscreen-lab-container"
                  style={{
                    width: '100vmax',
                    height: '100vmax',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                  }}
                >
                  {/* Fullscreen Close Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 mb-4 gap-4 shadow-xs shrink-0 w-full">
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="flex items-center space-x-1.5 space-x-reverse bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/15 shrink-0"
                    >
                      <Minimize2 className="w-4 h-4 ml-1.5" />
                      <span>إغلاق وضع ملء الشاشة</span>
                    </button>
                    <div className="text-center sm:text-right">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-250 mb-1 inline-block">عينة المختبر التفاعلي - وضع ملء الشاشة المباشر</span>
                      <h3 className="text-base sm:text-lg font-black text-slate-850">{currentLab.title}</h3>
                    </div>
                  </div>

                  {/* Main Split Grid */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0 w-full text-right pb-4 overflow-hidden">
                    {/* Left side (Visual screen & readout) */}
                    <div className="lg:col-span-8 bg-slate-50 border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden h-full">
                      <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                      
                      {/* inner header */}
                      <div className="flex items-center justify-between z-10 border-b border-slate-200/40 pb-3 mb-4 shrink-0">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => setIsFullscreen(false)}
                            className="flex items-center space-x-1.5 space-x-reverse bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-200 rounded-lg py-1 px-2.5 text-[10px] font-black transition-all shadow-3xs"
                            title="تصغير لعرض النافذة"
                          >
                            <Minimize2 className="w-3.5 h-3.5 ml-1 text-rose-600" />
                            <span>إنهاء ملء الشاشة</span>
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">Sim v2.0 - Active</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-500">مخرجات المختبر التفاعلي</h4>
                      </div>

                      <div className="flex-1 flex items-center justify-center relative w-full">
                        {canvasElement}
                      </div>
                      
                      <div className="mt-4">
                        {readoutElement}
                      </div>
                    </div>

                    {/* Right side (Control panel) */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                      {renderControlPanel(true)}
                    </div>
                  </div>
                </div>
              );

              return (
                <>
                  <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-5 flex flex-col justify-center items-center min-h-[300px] relative overflow-hidden shadow-inner">
                    <span className="text-xs font-bold text-slate-400">عينة المختبر التفاعلي - وضع ملء الشاشة نشط حالياً</span>
                  </div>
                  {createPortal(fullscreenContent, document.body)}
                </>
              );
            }

            const standardContent = (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between min-h-[300px] relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-white/10 pointer-events-none" />

                <div className="flex items-center justify-between z-10 border-b border-slate-200/40 pb-3 mb-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="flex items-center space-x-1 space-x-reverse bg-white hover:bg-slate-150 text-slate-650 border border-slate-200 rounded-lg py-1 px-2.5 text-[10px] font-black transition-all shadow-3xs"
                      title="تكبير لعرض ملء الشاشة"
                    >
                      <Maximize2 className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                      <span>ملء الشاشة</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Sim v2.0 - Active</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-500">مخرجات المختبر التفاعلي</h4>
                </div>

                {canvasElement}
                {readoutElement}
              </div>
            );

            return standardContent;
          })()}

          {/* Educational Step-by-Step logs and Materials Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Steps checklist card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">خطوات إجراء التجربة:</h5>
              <div className="space-y-2">
                {currentLab.steps.map((step, idx) => (
                  <button
                    key={step.stepNumber}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold flex items-start space-x-2 space-x-reverse transition-all ${
                      currentStep === idx
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-center flex items-center justify-center text-[10px] ml-2 shrink-0 font-bold">{step.stepNumber}</span>
                    <span className="leading-relaxed">{step.instruction}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Laboratory Materials card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">الأدوات والمواد المستخدمة:</h5>
              <div className="space-y-1.5">
                {currentLab.materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center space-x-2 space-x-reverse text-xs text-slate-700 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 ml-1.5 shrink-0" />
                    <span>{mat}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start space-x-1.5 space-x-reverse mt-2">
                <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5 ml-1.5" />
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  هذا المعمل يحاكي بدقة التجارب المنهجية لوزارة التربية والتعليم السودانية، مما يعزز الفهم والتجربة الذاتية للطلاب.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return labContent;
}
