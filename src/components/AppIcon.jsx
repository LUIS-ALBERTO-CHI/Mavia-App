/**
 * AppIcon — Wrapper centralizado de iconos SVG de lucide-react
 * Mapea nombres semánticos a iconos consistentes con el diseño de Mavia.
 *
 * Uso: <AppIcon name="meditation" size={20} color="var(--primary)" />
 */
import {
  Brain, BookOpen, Droplets, Activity, Moon, Target,
  Heart, Flame, Sun, Leaf, Music, Coffee, Dumbbell,
  Star, Sparkles, Flower2, Wind, Zap, Clock,
  Bell, Calendar, CheckCircle, Smile, Frown,
  Meh, TrendingUp, Award, Gift, Mail,
  ChevronRight, Plus, Edit3, Trash2,
  User, Settings, LogOut, Search,
} from 'lucide-react';

const ICON_MAP = {
  /* ---- Hábitos / Wellness ---- */
  meditation:     Brain,
  meditate:       Brain,
  book:           BookOpen,
  read:           BookOpen,
  water:          Droplets,
  hydration:      Droplets,
  exercise:       Activity,
  run:            Activity,
  gym:            Dumbbell,
  sleep:          Moon,
  rest:           Moon,
  gratitude:      Heart,
  love:           Heart,
  nutrition:      Coffee,
  food:           Coffee,
  music:          Music,
  nature:         Leaf,
  breathe:        Wind,
  energy:         Zap,
  focus:          Target,
  sun:            Sun,
  morning:        Sun,
  flame:          Flame,
  streak:         Flame,
  flower:         Flower2,

  /* ---- Acciones ---- */
  star:           Star,
  sparkle:        Sparkles,
  sparkles:       Sparkles,
  award:          Award,
  gift:           Gift,
  trending:       TrendingUp,
  clock:          Clock,
  timer:          Clock,

  /* ---- UI ---- */
  bell:           Bell,
  notification:   Bell,
  calendar:       Calendar,
  check:          CheckCircle,
  smile:          Smile,
  happy:          Smile,
  sad:            Frown,
  neutral:        Meh,
  mail:           Mail,
  next:           ChevronRight,
  add:            Plus,
  edit:           Edit3,
  delete:         Trash2,
  user:           User,
  settings:       Settings,
  logout:         LogOut,
  search:         Search,
};

export default function AppIcon({
  name = 'star',
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.75,
  className = '',
  style = {},
}) {
  const Icon = ICON_MAP[name] || Star;
  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}
