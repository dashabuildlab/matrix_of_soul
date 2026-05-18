/**
 * Drop-in Ionicons wrapper backed by lucide-react-native (SVG icons).
 * No font loading, no Font.isLoaded gate, renders on first frame always.
 */
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import {
  Activity, AlertCircle, AlertTriangle, ArrowDown, ArrowDownCircle,
  ArrowLeft, ArrowRight, ArrowRightCircle, ArrowUpCircle, BarChart2,
  Bell, BookOpen, Banknote, Briefcase, Calendar, Check, CheckCircle,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, CircleDot,
  Clock, CloudLightning, CloudOff, CloudSun, Compass, Copy, Cpu,
  Diamond, Download, Droplets, Dumbbell, ExternalLink, Eye, EyeOff,
  FileText, Fish, Flag, Flame, Flower2, Gift, Globe, GraduationCap,
  Hand, Headphones, Heart, HelpCircle, Home, Info, Key, LayersIcon,
  Leaf, Library, List, Lock, LogOut, LucideIcon, Mail, Mars, MessageCircle,
  MessageCircleMore, MessagesSquare, Mic, Moon, Music, Navigation2,
  Infinity, Plus, PlusCircle, Play, RefreshCw, Save, Scale, Search,
  Send, Share2, Shield, ShieldCheck, Shuffle, Skull, Sparkles, Star,
  Sun, SunMoon, Timer, Trash2, TrendingUp, Trophy, User, UserCircle,
  UserPlus, Users, Venus, Volume2, VolumeX, Wrench, X, XCircle, Zap,
  Lightbulb, LayoutGrid, SkipBack, SkipForward,
} from 'lucide-react-native';
import Svg, { Path, G } from 'react-native-svg';

// ── Brand icon SVGs (Apple & Google — not in Lucide) ──────────────────────────

function AppleIcon({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.29.06 2.18.71 3.01.75.84.03 2.28-.93 3.63-.73 1.57.24 2.74 1.05 3.44 2.3-3.13 1.87-2.58 5.97.37 7.48-.63 1.63-1.46 3.23-2.45 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

function GoogleIcon({ size = 24, color = '#A78BFA' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        <Path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 3.1-4.3 3.1-7.1z" />
        <Path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.4c-.9.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.8-4.2H2.9v2.5C4.6 19.9 8.1 22 12 22z" />
        <Path fill="#FBBC05" d="M6.2 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.3-2.5z" />
        <Path fill="#EA4335" d="M12 5.8c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 2.8 14.7 2 12 2 8.1 2 4.6 4.1 2.9 7.6l3.3 2.5C7.1 7.6 9.3 5.8 12 5.8z" />
      </G>
    </Svg>
  );
}

// ── Ionicons → Lucide mapping ─────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  'add':                           Plus,
  'add-circle-outline':            PlusCircle,
  'alert-circle':                  AlertCircle,
  'alert-circle-outline':          AlertCircle,
  'analytics-outline':             BarChart2,
  'apps-outline':                  LayoutGrid,
  'arrow-back':                    ArrowLeft,
  'arrow-down':                    ArrowDown,
  'arrow-down-circle':             ArrowDownCircle,
  'arrow-forward':                 ArrowRight,
  'arrow-forward-circle':          ArrowRightCircle,
  'arrow-forward-circle-outline':  ArrowRightCircle,
  'arrow-up-circle':               ArrowUpCircle,
  'arrow-up-circle-outline':       ArrowUpCircle,
  'book-outline':                  BookOpen,
  'briefcase-outline':             Briefcase,
  'bulb-outline':                  Lightbulb,
  'calendar-outline':              Calendar,
  'cash-outline':                  Banknote,
  'chatbubble-ellipses':           MessageCircleMore,
  'chatbubble-ellipses-outline':   MessageCircleMore,
  'chatbubble-outline':            MessageCircle,
  'chatbubbles-outline':           MessagesSquare,
  'checkmark':                     Check,
  'checkmark-circle':              CheckCircle,
  'checkmark-circle-outline':      CheckCircle,
  'chevron-back':                  ChevronLeft,
  'chevron-down':                  ChevronDown,
  'chevron-forward':               ChevronRight,
  'chevron-up':                    ChevronUp,
  'close':                         X,
  'close-circle':                  XCircle,
  'close-circle-outline':          XCircle,
  'cloud-offline-outline':         CloudOff,
  'color-wand-outline':            Sparkles,
  'compass-outline':               Compass,
  'construct-outline':             Wrench,
  'contrast-outline':              SunMoon,
  'copy-outline':                  Copy,
  'diamond':                       Diamond,
  'diamond-outline':               Diamond,
  'document-text-outline':         FileText,
  'download-outline':              Download,
  'ellipse-outline':               Circle,
  'eye':                           Eye,
  'eye-outline':                   Eye,
  'eye-off-outline':               EyeOff,
  'female-outline':                Venus,
  'fish-outline':                  Fish,
  'fitness-outline':               Activity,
  'flag-outline':                  Flag,
  'flame':                         Flame,
  'flame-outline':                 Flame,
  'flash':                         Zap,
  'flash-outline':                 Zap,
  'flower-outline':                Flower2,
  'gift-outline':                  Gift,
  'grid-outline':                  LayoutGrid,
  'hand-left-outline':             Hand,
  'hardware-chip-outline':         Cpu,
  'headset-outline':               Headphones,
  'heart':                         Heart,
  'heart-circle-outline':          Heart,
  'heart-outline':                 Heart,
  'help':                          HelpCircle,
  'help-circle':                   HelpCircle,
  'help-circle-outline':           HelpCircle,
  'help-outline':                  HelpCircle,
  'home-outline':                  Home,
  'infinite-outline':              Infinity,
  'information-circle-outline':    Info,
  'key-outline':                   Key,
  'language-outline':              Globe,
  'layers':                        LayersIcon,
  'layers-outline':                LayersIcon,
  'leaf':                          Leaf,
  'leaf-outline':                  Leaf,
  'library-outline':               Library,
  'list-outline':                  List,
  'lock-closed':                   Lock,
  'lock-closed-outline':           Lock,
  'log-out-outline':               LogOut,
  'mail-outline':                  Mail,
  'male-outline':                  Mars,
  'mic-outline':                   Mic,
  'moon':                          Moon,
  'moon-outline':                  Moon,
  'musical-notes-outline':         Music,
  'navigate-outline':              Navigation2,
  'notifications-outline':         Bell,
  'open-outline':                  ExternalLink,
  'partly-sunny-outline':          CloudSun,
  'people-outline':                Users,
  'person':                        User,
  'person-add-outline':            UserPlus,
  'person-circle-outline':         UserCircle,
  'person-outline':                User,
  'planet-outline':                Globe,
  'play-back-outline':             SkipBack,
  'play-forward-outline':          SkipForward,
  'play-outline':                  Play,
  'radio-button-on-outline':       CircleDot,
  'refresh':                       RefreshCw,
  'refresh-outline':               RefreshCw,
  'reload':                        RefreshCw,
  'save-outline':                  Save,
  'scale-outline':                 Scale,
  'school-outline':                GraduationCap,
  'search-outline':                Search,
  'send':                          Send,
  'share-social-outline':          Share2,
  'shield-checkmark-outline':      ShieldCheck,
  'shield-outline':                Shield,
  'shuffle-outline':               Shuffle,
  'skull-outline':                 Skull,
  'sparkles':                      Sparkles,
  'sparkles-outline':              Sparkles,
  'star':                          Star,
  'star-outline':                  Star,
  'sunny':                         Sun,
  'sunny-outline':                 Sun,
  'sync-outline':                  RefreshCw,
  'thunderstorm-outline':          CloudLightning,
  'time':                          Clock,
  'time-outline':                  Clock,
  'timer-outline':                 Timer,
  'trash-outline':                 Trash2,
  'trending-up':                   TrendingUp,
  'trending-up-outline':           TrendingUp,
  'trophy':                        Trophy,
  'trophy-outline':                Trophy,
  'volume-medium-outline':         Volume2,
  'volume-mute-outline':           VolumeX,
  'warning-outline':               AlertTriangle,
  'water-outline':                 Droplets,
};

// Brand icons that need special handling
const BRAND_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'logo-apple':  AppleIcon,
  'logo-google': GoogleIcon,
};

// ── Component ────────────────────────────────────────────────────────────────

export type IoniconsGlyphs = keyof typeof ICON_MAP | keyof typeof BRAND_ICONS;

interface IoniconsProps {
  name: IoniconsGlyphs;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  testID?: string;
}

const Ionicons = Object.assign(
  function Ionicons({ name, size = 24, color = '#fff', testID }: IoniconsProps) {
    const BrandComponent = BRAND_ICONS[name as string];
    if (BrandComponent) {
      return <BrandComponent size={size} color={color} />;
    }

    const LucideComponent = ICON_MAP[name as string];
    if (!LucideComponent) {
      if (__DEV__) console.warn(`[Ionicons] unknown icon: ${String(name)}`);
      return null;
    }

    return <LucideComponent size={size} color={color} strokeWidth={1.75} />;
  },
  // keep glyphMap shim so any `keyof typeof Ionicons.glyphMap` type checks compile
  { glyphMap: ICON_MAP as Record<string, unknown> },
);

export default Ionicons;
