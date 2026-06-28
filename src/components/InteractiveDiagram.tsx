/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DIAGRAMS, DiagramPart } from '../data/curriculum';
import { motion, AnimatePresence } from 'motion/react';
import { Info, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';

interface InteractiveDiagramProps {
  diagramId: string;
}

export default function InteractiveDiagram({ diagramId }: InteractiveDiagramProps) {
  const diagram = DIAGRAMS[diagramId];
  const [selectedPart, setSelectedPart] = useState<DiagramPart | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!diagram) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl" id="diagram-error">
        <HelpCircle className="w-12 h-12 text-gray-400 mb-2" id="icon-error" />
        <p className="text-gray-600 font-medium">الرسم التوضيحي التفاعلي غير متوفر لهذا الدرس.</p>
      </div>
    );
  }

  // Custom inline SVG rendering according to diagramId
  const renderSVG = () => {
    switch (diagramId) {
      case 'leaf_anatomy':
        return (
          <svg viewBox="0 0 500 270" className="w-full h-auto bg-slate-900 rounded-lg shadow-inner border border-slate-800" id="svg-leaf">
            {/* Background grids */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Cuticle (الكيوتيكل) */}
            <g
              className="cursor-pointer transition-opacity duration-200"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'cuticle') || null)}
              onMouseEnter={() => setHoveredPartId('cuticle')}
              onMouseLeave={() => setHoveredPartId(null)}
              opacity={hoveredPartId === 'cuticle' ? 0.9 : 0.7}
            >
              <rect x="50" y="15" width="400" height="8" rx="2" fill="#38bdf8" />
              <text x="250" y="12" fill="#e2e8f0" fontSize="8" textAnchor="middle" className="font-mono">الكيوتيني (الكيوتيكل)</text>
            </g>

            {/* Upper Epidermis (البشرة العليا) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'upper_epidermis') || null)}
              onMouseEnter={() => setHoveredPartId('upper_epidermis')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              {/* Row of cells */}
              {Array.from({ length: 16 }).map((_, i) => (
                <rect
                  key={`ue-${i}`}
                  x={50 + i * 25}
                  y="23"
                  width="24"
                  height="16"
                  rx="3"
                  fill={hoveredPartId === 'upper_epidermis' ? '#059669' : '#10b981'}
                  stroke="#047857"
                  strokeWidth="1"
                />
              ))}
              <text x="250" y="34" fill="#ffffff" fontSize="8" textAnchor="middle" pointerEvents="none" className="font-medium select-none">البشرة العليا</text>
            </g>

            {/* Palisade Tissue (النسيج العمادي) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'palisade_tissue') || null)}
              onMouseEnter={() => setHoveredPartId('palisade_tissue')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              {Array.from({ length: 32 }).map((_, i) => (
                <rect
                  key={`pt-${i}`}
                  x={52 + i * 12.5}
                  y="43"
                  width="10.5"
                  height="55"
                  rx="2"
                  fill={hoveredPartId === 'palisade_tissue' ? '#047857' : '#065f46'}
                  stroke="#064e3b"
                  strokeWidth="0.5"
                >
                  {/* Chloroplast dots inside */}
                  <circle cx={57 + i * 12.5} cy="50" r="1.5" fill="#34d399" />
                  <circle cx={57 + i * 12.5} cy="65" r="1.5" fill="#34d399" />
                  <circle cx={57 + i * 12.5} cy="80" r="1.5" fill="#34d399" />
                </rect>
              ))}
              <rect x="52" y="43" width="396" height="55" fill="transparent" />
              <text x="250" y="75" fill="#a7f3d0" fontSize="11" textAnchor="middle" pointerEvents="none" className="font-bold tracking-wider select-none">النسيج العمادي (Palisade)</text>
            </g>

            {/* Spongy Tissue (النسيج الإسفنجي) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'spongy_tissue') || null)}
              onMouseEnter={() => setHoveredPartId('spongy_tissue')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              {/* Irregular cell nodes */}
              {[
                { x: 80, y: 120, r: 12 }, { x: 120, y: 130, r: 10 }, { x: 70, y: 150, r: 11 },
                { x: 105, y: 165, r: 13 }, { x: 140, y: 150, r: 11 }, { x: 80, y: 190, r: 12 },
                { x: 125, y: 195, r: 10 }, { x: 180, y: 130, r: 13 }, { x: 210, y: 160, r: 12 },
                { x: 180, y: 180, r: 11 }, { x: 240, y: 130, r: 10 }, { x: 245, y: 185, r: 12 }
              ].map((c, i) => (
                <circle
                  key={`st-${i}`}
                  cx={c.x}
                  cy={c.y}
                  r={c.r}
                  fill={hoveredPartId === 'spongy_tissue' ? '#065f46' : '#0f172a'}
                  stroke="#047857"
                  strokeWidth="1.5"
                />
              ))}
              <text x="150" y="160" fill="#6ee7b7" fontSize="10" textAnchor="middle" pointerEvents="none" className="font-semibold select-none">النسيج الإسفنجي</text>
            </g>

            {/* Vascular Bundle (العرق الوسطي) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'vascular_bundle') || null)}
              onMouseEnter={() => setHoveredPartId('vascular_bundle')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              {/* Outer Bundle Sheath */}
              <rect x="290" y="110" width="130" height="90" rx="45" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeDasharray="3 3" />
              {/* Xylem (الخشب) - Upper side of bundle */}
              <circle cx="330" cy="140" r="12" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
              <circle cx="355" cy="140" r="12" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
              <circle cx="380" cy="140" r="12" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
              {/* Phloem (اللحاء) - Lower side of bundle */}
              <circle cx="330" cy="170" r="9" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
              <circle cx="355" cy="170" r="9" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
              <circle cx="380" cy="170" r="9" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />

              <text x="355" y="125" fill="#f87171" fontSize="8" textAnchor="middle" className="font-bold">الخشب</text>
              <text x="355" y="193" fill="#60a5fa" fontSize="8" textAnchor="middle" className="font-bold">اللحاء</text>
            </g>

            {/* Stomata (الثغور) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'stomata') || null)}
              onMouseEnter={() => setHoveredPartId('stomata')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              {/* Guard cells */}
              <rect x="145" y="215" width="22" height="10" rx="5" fill="#10b981" stroke="#047857" />
              <circle cx="150" cy="220" r="2" fill="#34d399" />
              <circle cx="162" cy="220" r="2" fill="#34d399" />
              {/* Thugoor aperture */}
              <ellipse cx="156" cy="220" rx="2" ry="4" fill="#020617" />
              
              <path d="M 156 225 L 156 250" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
              <text x="156" y="260" fill="#f43f5e" fontSize="8" textAnchor="middle">الثغور الحارسة</text>
            </g>

            {/* Lower Epidermis (البشرة السفلى) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'lower_epidermis') || null)}
              onMouseEnter={() => setHoveredPartId('lower_epidermis')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              {Array.from({ length: 16 }).map((_, i) => {
                // skip index 4 for Stomata opening
                if (i === 4) return null;
                return (
                  <rect
                    key={`le-${i}`}
                    x={50 + i * 25}
                    y="205"
                    width="24"
                    height="12"
                    rx="2"
                    fill={hoveredPartId === 'lower_epidermis' ? '#047857' : '#065f46'}
                    stroke="#064e3b"
                    strokeWidth="0.5"
                  />
                );
              })}
              <text x="350" y="214" fill="#94a3b8" fontSize="8" textAnchor="middle" className="font-semibold select-none">البشرة السفلى</text>
            </g>
          </svg>
        );

      case 'digestive_system':
        return (
          <svg viewBox="0 0 500 400" className="w-full h-auto bg-slate-900 rounded-lg shadow-inner border border-slate-800" id="svg-digestive">
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Outline body mockup */}
            <path d="M 250 15 C 290 15, 310 40, 310 80 C 310 110, 270 120, 270 140 L 270 380 L 230 380 L 230 140 C 230 120, 190 110, 190 80 C 190 40, 210 15, 250 15 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

            {/* Mouth (الفم) */}
            <circle
              cx="250"
              cy="45"
              r="14"
              fill={hoveredPartId === 'mouth' ? '#3b82f6' : '#1d4ed8'}
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'mouth') || null)}
              onMouseEnter={() => setHoveredPartId('mouth')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="250" y="48" fill="#ffffff" fontSize="8" textAnchor="middle" pointerEvents="none" className="font-bold">الفم</text>

            {/* Salivary Glands (الغدد اللعابية) */}
            <ellipse
              cx="275"
              cy="50"
              rx="10"
              ry="6"
              fill={hoveredPartId === 'salivary_glands' ? '#fbbf24' : '#d97706'}
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'salivary_glands') || null)}
              onMouseEnter={() => setHoveredPartId('salivary_glands')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="315" y="53" fill="#fbbf24" fontSize="8" textAnchor="start">الغدد اللعابية</text>

            {/* Esophagus (المريء) */}
            <rect
              x="246"
              y="60"
              width="8"
              height="100"
              fill={hoveredPartId === 'esophagus' ? '#ec4899' : '#db2777'}
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'esophagus') || null)}
              onMouseEnter={() => setHoveredPartId('esophagus')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="290" y="110" fill="#f472b6" fontSize="9" textAnchor="start">المريء (Esophagus)</text>

            {/* Liver (الكبد) */}
            <path
              d="M 190 170 L 255 170 L 245 205 L 180 200 Z"
              fill={hoveredPartId === 'liver' ? '#ea580c' : '#9a3412'}
              stroke="#ea580c"
              strokeWidth="1"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'liver') || null)}
              onMouseEnter={() => setHoveredPartId('liver')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="160" y="185" fill="#f97316" fontSize="9" textAnchor="middle" pointerEvents="none" className="font-bold">الكبد</text>

            {/* Stomach (المعدة) */}
            <path
              d="M 250 160 C 270 160, 305 170, 305 200 C 305 230, 275 230, 250 220 C 235 210, 240 180, 250 160 Z"
              fill={hoveredPartId === 'stomach' ? '#e11d48' : '#9f1239'}
              stroke="#fb7185"
              strokeWidth="1"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'stomach') || null)}
              onMouseEnter={() => setHoveredPartId('stomach')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="280" y="195" fill="#fda4af" fontSize="9" textAnchor="middle" pointerEvents="none" className="font-bold">المعدة</text>

            {/* Pancreas (البنكرياس) */}
            <rect
              x="235"
              y="225"
              width="50"
              height="14"
              rx="7"
              fill={hoveredPartId === 'pancreas' ? '#84cc16' : '#3f6212'}
              stroke="#a3e635"
              strokeWidth="0.5"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'pancreas') || null)}
              onMouseEnter={() => setHoveredPartId('pancreas')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="260" y="235" fill="#ffffff" fontSize="8" textAnchor="middle" pointerEvents="none">البنكرياس</text>

            {/* Small Intestine (الأمعاء الدقيقة) */}
            <rect
              x="210"
              y="255"
              width="80"
              height="70"
              rx="20"
              fill={hoveredPartId === 'small_intestine' ? '#a855f7' : '#6b21a8'}
              stroke="#c084fc"
              strokeWidth="1.5"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'small_intestine') || null)}
              onMouseEnter={() => setHoveredPartId('small_intestine')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="250" y="295" fill="#ffffff" fontSize="9" textAnchor="middle" pointerEvents="none" className="font-bold">الأمعاء الدقيقة</text>

            {/* Large Intestine (الأمعاء الغليظة) */}
            <rect
              x="190"
              y="245"
              width="120"
              height="90"
              rx="15"
              fill="none"
              stroke={hoveredPartId === 'large_intestine' ? '#06b6d4' : '#0369a1'}
              strokeWidth="12"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'large_intestine') || null)}
              onMouseEnter={() => setHoveredPartId('large_intestine')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="330" y="270" fill="#22d3ee" fontSize="9" textAnchor="start">الأمعاء الغليظة</text>
          </svg>
        );

      case 'human_heart':
        return (
          <svg viewBox="0 0 500 300" className="w-full h-auto bg-slate-900 rounded-lg shadow-inner border border-slate-800" id="svg-heart">
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Right Atrium (الأذين الأيمن) */}
            <ellipse
              cx="170"
              cy="110"
              rx="30"
              ry="25"
              fill={hoveredPartId === 'right_atrium' ? '#2563eb' : '#1e3a8a'}
              stroke="#3b82f6"
              strokeWidth="2"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'right_atrium') || null)}
              onMouseEnter={() => setHoveredPartId('right_atrium')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="170" y="113" fill="#ffffff" fontSize="9" textAnchor="middle" pointerEvents="none" className="font-bold">الأذين الأيمن</text>

            {/* Left Atrium (الأذين الأيسر) */}
            <ellipse
              cx="330"
              cy="110"
              rx="30"
              ry="25"
              fill={hoveredPartId === 'left_atrium' ? '#dc2626' : '#7f1d1d'}
              stroke="#ef4444"
              strokeWidth="2"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'left_atrium') || null)}
              onMouseEnter={() => setHoveredPartId('left_atrium')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="330" y="113" fill="#ffffff" fontSize="9" textAnchor="middle" pointerEvents="none" className="font-bold">الأذين الأيسر</text>

            {/* Right Ventricle (البطين الأيمن) */}
            <path
              d="M 150 150 C 150 220, 220 250, 240 250 L 240 150 Z"
              fill={hoveredPartId === 'right_ventricle' ? '#1d4ed8' : '#172554'}
              stroke="#3b82f6"
              strokeWidth="2"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'right_ventricle') || null)}
              onMouseEnter={() => setHoveredPartId('right_ventricle')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="195" y="195" fill="#93c5fd" fontSize="9" textAnchor="middle" pointerEvents="none" className="font-bold">البطين الأيمن</text>

            {/* Left Ventricle (البطين الأيسر) */}
            <path
              d="M 350 150 C 350 220, 260 250, 240 250 L 240 150 Z"
              fill={hoveredPartId === 'left_ventricle' ? '#b91c1c' : '#450a0a'}
              stroke="#f87171"
              strokeWidth="3" // thicker wall
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'left_ventricle') || null)}
              onMouseEnter={() => setHoveredPartId('left_ventricle')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="290" y="195" fill="#fca5a5" fontSize="9" textAnchor="middle" pointerEvents="none" className="font-bold">البطين الأيسر</text>

            {/* Tricuspid Valve (الصمام ثلاثي الشرفات) */}
            <g
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'tricuspid_valve') || null)}
              onMouseEnter={() => setHoveredPartId('tricuspid_valve')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              <line x1="165" y1="135" x2="195" y2="155" stroke={hoveredPartId === 'tricuspid_valve' ? '#fbbf24' : '#e2e8f0'} strokeWidth="3" />
              <text x="145" y="150" fill="#cbd5e1" fontSize="7" textAnchor="end">صمام ثلاثي الشرفات</text>
            </g>

            {/* Bicuspid Valve (الصمام ثنائي الشرفات) */}
            <g
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'bicuspid_valve') || null)}
              onMouseEnter={() => setHoveredPartId('bicuspid_valve')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              <line x1="335" y1="135" x2="305" y2="155" stroke={hoveredPartId === 'bicuspid_valve' ? '#fbbf24' : '#e2e8f0'} strokeWidth="3" />
              <text x="355" y="150" fill="#cbd5e1" fontSize="7" textAnchor="start">صمام ثنائي الشرفات</text>
            </g>

            {/* Aorta Arch (الأبهر) */}
            <path
              d="M 230 110 C 230 40, 270 40, 270 110"
              fill="none"
              stroke={hoveredPartId === 'aorta' ? '#dc2626' : '#991b1b'}
              strokeWidth="16"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'aorta') || null)}
              onMouseEnter={() => setHoveredPartId('aorta')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="250" y="32" fill="#ef4444" fontSize="9" textAnchor="middle" className="font-extrabold">الشريان الأبهر (Aorta)</text>
          </svg>
        );

      case 'nephron':
        return (
          <svg viewBox="0 0 500 300" className="w-full h-auto bg-slate-900 rounded-lg shadow-inner border border-slate-800" id="svg-nephron">
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Glomerulus and Bowman (الكبة ومحفظة بومان) */}
            <g
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'bowmans_capsule') || null)}
              onMouseEnter={() => setHoveredPartId('bowmans_capsule')}
              onMouseLeave={() => setHoveredPartId(null)}
            >
              <circle cx="120" cy="110" r="30" fill="none" stroke="#eab308" strokeWidth="6" />
              <circle cx="120" cy="110" r="18" fill={hoveredPartId === 'bowmans_capsule' ? '#dc2626' : '#991b1b'} />
              <text x="120" y="113" fill="#ffffff" fontSize="8" textAnchor="middle" pointerEvents="none">محفظة بومان</text>
            </g>

            {/* Proximal Tubule (الأنبوبة الملتوية القريبة) */}
            <path
              d="M 150 110 C 180 80, 200 130, 230 100"
              fill="none"
              stroke={hoveredPartId === 'proximal_tubule' ? '#10b981' : '#047857'}
              strokeWidth="8"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'proximal_tubule') || null)}
              onMouseEnter={() => setHoveredPartId('proximal_tubule')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="190" y="80" fill="#34d399" fontSize="8" textAnchor="middle">الأنبوبة القريبة</text>

            {/* Loop of Henle (التواء هنلي) */}
            <path
              d="M 230 104 L 230 220 C 230 250, 270 250, 270 220 L 270 120"
              fill="none"
              stroke={hoveredPartId === 'loop_of_henle' ? '#6366f1' : '#4338ca'}
              strokeWidth="8"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'loop_of_henle') || null)}
              onMouseEnter={() => setHoveredPartId('loop_of_henle')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="250" y="260" fill="#818cf8" fontSize="9" textAnchor="middle" className="font-bold">التواء هنلي (Henle Loop)</text>

            {/* Distal Tubule (الأنبوبة الملتوية البعيدة) */}
            <path
              d="M 270 120 C 285 90, 310 140, 340 110"
              fill="none"
              stroke={hoveredPartId === 'distal_tubule' ? '#10b981' : '#047857'}
              strokeWidth="8"
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'distal_tubule') || null)}
              onMouseEnter={() => setHoveredPartId('distal_tubule')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="310" y="80" fill="#34d399" fontSize="8" textAnchor="middle">الأنبوبة البعيدة</text>

            {/* Collecting Duct (القناة الجامعة) */}
            <rect
              x="340"
              y="60"
              width="15"
              height="180"
              rx="5"
              fill={hoveredPartId === 'collecting_duct' ? '#f59e0b' : '#b45309'}
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPart(diagram.parts.find(p => p.id === 'collecting_duct') || null)}
              onMouseEnter={() => setHoveredPartId('collecting_duct')}
              onMouseLeave={() => setHoveredPartId(null)}
            />
            <text x="365" y="150" fill="#fbbf24" fontSize="9" textAnchor="start" className="font-bold">القناة الجامعة</text>
          </svg>
        );

      default:
        return null;
    }
  };

  const content = (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${isFullScreen ? 'bg-white p-6 rounded-3xl max-w-6xl w-full shadow-2xl relative' : 'bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs'} text-right`} id="diagram-container">
      {isFullScreen && (
        <button
          onClick={() => setIsFullScreen(false)}
          className="absolute top-4 left-4 bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-full transition-all border border-rose-200"
          title="إغلاق ملء الشاشة"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}
      {/* Visual Canvas Area */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg border border-slate-200 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isFullScreen ? 'تصغير الشاشة' : 'ملء الشاشة'}</span>
            </button>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">رسم توضيحي تفاعلي</span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-800">{diagram.title}</h4>
        </div>
        
        <div className="w-full relative">
          {renderSVG()}
        </div>

        <p className="text-xs text-slate-500 mt-3 flex items-center justify-center font-semibold">
          <Info className="w-3.5 h-3.5 ml-1 text-slate-400" />
          انقر فوق أي جزء من الرسم ملون لمعرفة وظيفته وعمله الفسيولوجي بالتفصيل.
        </p>
      </div>

      {/* Explanatory Sidebar Area */}
      <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 min-h-[160px] flex flex-col justify-between shadow-2xs">
          <AnimatePresence mode="wait">
            {selectedPart ? (
              <motion.div
                key={selectedPart.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h4 className="text-lg font-extrabold text-emerald-800">{selectedPart.name}</h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                  {selectedPart.description}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-500 space-y-3"
              >
                <HelpCircle className="w-10 h-10 text-emerald-600/40 animate-pulse" />
                <h5 className="font-bold text-slate-700">استكشف مكونات الرسم</h5>
                <p className="text-xs max-w-xs leading-relaxed text-slate-600 font-medium">
                  انقر على أي خلية أو عضو أو وعاء في المخطط المقابل لعرض وظيفته وعلاقته بالمنهج السوداني المقرر.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Diagnostic Checklist */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">المصطلحات القابلة للاستكشاف:</h5>
          <div className="flex flex-wrap gap-1.5">
            {diagram.parts.map(part => (
              <button
                key={part.id}
                onClick={() => setSelectedPart(part)}
                onMouseEnter={() => setHoveredPartId(part.id)}
                onMouseLeave={() => setHoveredPartId(null)}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition-all ${
                  selectedPart?.id === part.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {part.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10 overflow-y-auto">
        {content}
      </div>
    );
  }

  return content;
}
