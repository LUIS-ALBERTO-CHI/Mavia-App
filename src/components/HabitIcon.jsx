/**
 * HabitIcon
 * Centralizes all 27 habit icons.
 * Uses lucide-react where a good match exists, otherwise custom inline SVGs.
 * All icons: stroke 1.75, rounded linecap/linejoin — per Serene Marketing PWA spec.
 */
import {
  Dumbbell, Bike, Moon, Sunrise, Droplets, Leaf, Target, BookOpen,
  Heart, Wind, PhoneOff, MessageCircle, Users, ClipboardList, WifiOff,
  Activity, Brain, PenLine, Ban, Bed, Apple, TreePine, Maximize2,
  Star, Footprints, PersonStanding,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Custom SVGs (no perfect lucide equivalent)
───────────────────────────────────────────────────────────── */

/** Yoga — seated lotus posture */
const YogaIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4.5" r="1.5" />
    {/* torso */}
    <path d="M12 6.5v4" />
    {/* arms out */}
    <path d="M6 11l6 1.5 6-1.5" />
    {/* crossed legs / lotus base */}
    <path d="M8 16c1-2 2-2.5 4-2.5s3 .5 4 2.5" />
    <path d="M5 19h14" />
  </svg>
);

/** Stretch — arms & legs spread wide */
const StretchIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4.5" r="1.5" />
    {/* body */}
    <path d="M12 6.5v5" />
    {/* arms horizontal */}
    <path d="M4 9.5h16" />
    {/* legs spread */}
    <path d="M12 11.5l-4 6M12 11.5l4 6" />
  </svg>
);

/** Prayer / Oración — two hands joined */
const PrayerIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {/* left hand */}
    <path d="M12 3c-1 1-2.5 3-2.5 7v3" />
    <path d="M9.5 13c0 2 .5 4 2.5 5" />
    {/* right hand */}
    <path d="M12 3c1 1 2.5 3 2.5 7v3" />
    <path d="M14.5 13c0 2-.5 4-2.5 5" />
    {/* center crease */}
    <path d="M12 3v15" />
    {/* base */}
    <path d="M9 18h6" />
  </svg>
);

/** Pill — medicine / vitamins */
const PillIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 3.5a5 5 0 0 1 7.07 7.07l-8 8a5 5 0 0 1-7.07-7.07z" />
    <path d="M7 7l10 10" />
  </svg>
);

/** Run — person mid-stride */
const RunIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="15" cy="4" r="1.5" />
    {/* body */}
    <path d="M13.5 7l-3 4" />
    {/* arm swing */}
    <path d="M10.5 11l-3-1.5" />
    <path d="M13.5 7l3-2" />
    {/* legs */}
    <path d="M10.5 11l1.5 4-2.5 4" />
    <path d="M10.5 11l3 2 2 4" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Icon map: habit id → component
───────────────────────────────────────────────────────────── */
const ICON_MAP = {
  /* Ejercicio */
  run:         RunIcon,
  gym:         Dumbbell,
  walk:        Footprints,
  yoga:        YogaIcon,
  stretch:     StretchIcon,
  bike:        Bike,

  /* Mente */
  meditation:  Brain,
  journal:     PenLine,
  gratitude:   Heart,
  breathe:     Wind,
  no_phone:    PhoneOff,
  affirmation: MessageCircle,

  /* Sueño */
  sleep:       Moon,
  nap:         Bed,
  early_rise:  Sunrise,

  /* Nutrición */
  water:       Droplets,
  healthy_eat: Apple,
  no_sugar:    Ban,
  vitamins:    PillIcon,

  /* Productividad */
  deep_work:   Target,
  book:        BookOpen,
  planning:    ClipboardList,
  no_social:   WifiOff,

  /* Espiritual */
  prayer:      PrayerIcon,
  connect:     Users,
  nature:      TreePine,
};

/* ─────────────────────────────────────────────────────────────
   Exported component
───────────────────────────────────────────────────────────── */
export default function HabitIcon({ id, size = 22, color = 'currentColor' }) {
  const Icon = ICON_MAP[id] || Star;
  return <Icon size={size} color={color} strokeWidth={1.75} />;
}

/** Convenience: full catalogue for CreateHabitScreen pickers */
export const HABIT_CATALOGUE = [
  // Ejercicio
  { id: 'run',         label: 'Correr',        category: 'Ejercicio' },
  { id: 'gym',         label: 'Gym',           category: 'Ejercicio' },
  { id: 'walk',        label: 'Caminar',       category: 'Ejercicio' },
  { id: 'yoga',        label: 'Yoga',          category: 'Ejercicio' },
  { id: 'stretch',     label: 'Estirar',       category: 'Ejercicio' },
  { id: 'bike',        label: 'Bicicleta',     category: 'Ejercicio' },
  // Mente
  { id: 'meditation',  label: 'Meditar',       category: 'Mente' },
  { id: 'journal',     label: 'Journaling',    category: 'Mente' },
  { id: 'gratitude',   label: 'Gratitud',      category: 'Mente' },
  { id: 'breathe',     label: 'Respirar',      category: 'Mente' },
  { id: 'no_phone',    label: 'Sin pantallas', category: 'Mente' },
  { id: 'affirmation', label: 'Afirmaciones',  category: 'Mente' },
  // Sueño
  { id: 'sleep',       label: 'Dormir 8h',     category: 'Sueño' },
  { id: 'nap',         label: 'Siesta',        category: 'Sueño' },
  { id: 'early_rise',  label: 'Madrugar',      category: 'Sueño' },
  // Nutrición
  { id: 'water',       label: 'Agua',          category: 'Nutrición' },
  { id: 'healthy_eat', label: 'Comer sano',    category: 'Nutrición' },
  { id: 'no_sugar',    label: 'Sin azúcar',    category: 'Nutrición' },
  { id: 'vitamins',    label: 'Vitaminas',     category: 'Nutrición' },
  // Productividad
  { id: 'deep_work',   label: 'Deep work',     category: 'Productividad' },
  { id: 'book',        label: 'Leer',          category: 'Productividad' },
  { id: 'planning',    label: 'Planificar',    category: 'Productividad' },
  { id: 'no_social',   label: 'Sin redes',     category: 'Productividad' },
  // Espiritual
  { id: 'prayer',      label: 'Oración',       category: 'Espiritual' },
  { id: 'connect',     label: 'Conectar',      category: 'Espiritual' },
  { id: 'nature',      label: 'Naturaleza',    category: 'Espiritual' },
];
