export type CourseCategory = 'Workshop' | 'Yoga Sequence' | 'Dharma Talk' | 'Music Playlist' | 'Research';
export type AccessLevel = 'Free' | 'Members Only';

export interface Course {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  category: CourseCategory;
  access: AccessLevel;
  description: string;
  gradient: string;
  iconColor: string;
  lessons: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  userProgress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  lastAccessed?: string;
}

export const courses: Course[] = [
  {
    id: 'foundations-of-vinyasa',
    title: 'Foundations of Vinyasa',
    instructor: 'Priya Sharma',
    duration: '4h 30m',
    category: 'Workshop',
    access: 'Members Only',
    description: 'A comprehensive breakdown of Vinyasa yoga fundamentals — from breath-movement synchronization to intelligent sequencing principles for diverse student populations.',
    gradient: 'from-teal-500 to-teal-700',
    iconColor: 'text-teal-200',
    lessons: 12,
    level: 'Intermediate',
    status: 'in_progress',
    userProgress: 42,
    lastAccessed: '2026-03-15T08:30:00Z',
  },
  {
    id: 'intro-to-yoga-nidra',
    title: 'Introduction to Yoga Nidra',
    instructor: 'Kenji Nakamura',
    duration: '2h 15m',
    category: 'Yoga Sequence',
    access: 'Free',
    description: 'Discover the ancient practice of yogic sleep. This guided course walks you through the five layers of consciousness and teaches you to lead powerful Yoga Nidra sessions.',
    gradient: 'from-purple-500 to-purple-700',
    iconColor: 'text-purple-200',
    lessons: 6,
    level: 'All Levels',
    status: 'in_progress',
    userProgress: 67,
    lastAccessed: '2026-03-14T19:00:00Z',
  },
  {
    id: 'yoga-sutras-philosophy',
    title: 'The Yoga Sutras: A Living Philosophy',
    instructor: 'Dr. Anand Mehta',
    duration: '6h 00m',
    category: 'Dharma Talk',
    access: 'Members Only',
    description: 'An in-depth, accessible reading of Patanjali\'s Yoga Sutras in the context of modern life. Each chapter is paired with practical reflections and journaling prompts.',
    gradient: 'from-blue-500 to-blue-700',
    iconColor: 'text-blue-200',
    lessons: 18,
    level: 'All Levels',
    status: 'in_progress',
    userProgress: 25,
    lastAccessed: '2026-03-10T11:00:00Z',
  },
  {
    id: 'yin-yoga-beginners',
    title: 'Yin Yoga for Beginners',
    instructor: 'Freya Andersen',
    duration: '3h 00m',
    category: 'Yoga Sequence',
    access: 'Free',
    description: 'A gentle, grounding introduction to Yin Yoga. Learn the key poses, how to use props, and how to safely hold postures to target the connective tissues of the body.',
    gradient: 'from-emerald-500 to-emerald-700',
    iconColor: 'text-emerald-200',
    lessons: 8,
    level: 'Beginner',
    status: 'completed',
    userProgress: 100,
    lastAccessed: '2026-03-01T16:00:00Z',
  },
  {
    id: 'healing-mantras',
    title: 'Healing Mantras & Sacred Music',
    instructor: 'Various Artists',
    duration: '1h 20m',
    category: 'Music Playlist',
    access: 'Members Only',
    description: 'A curated collection of traditional Sanskrit mantras, kirtan recordings, and ambient soundscapes for use in yoga classes, meditation, and personal practice.',
    gradient: 'from-amber-500 to-orange-600',
    iconColor: 'text-amber-200',
    lessons: 15,
    level: 'All Levels',
    status: 'completed',
    userProgress: 100,
    lastAccessed: '2026-02-20T09:00:00Z',
  },
  {
    id: 'science-of-breathwork',
    title: 'The Science of Breathwork',
    instructor: 'Sarah Mitchell',
    duration: '2h 45m',
    category: 'Research',
    access: 'Members Only',
    description: 'Explore the neuroscience and physiology behind pranayama and modern breathwork. Includes current research on the vagus nerve, HRV, and stress response modulation.',
    gradient: 'from-indigo-500 to-indigo-700',
    iconColor: 'text-indigo-200',
    lessons: 9,
    level: 'Advanced',
  },
  {
    id: 'advanced-pranayama',
    title: 'Advanced Pranayama Techniques',
    instructor: 'Priya Sharma',
    duration: '5h 00m',
    category: 'Workshop',
    access: 'Members Only',
    description: 'A deep practice-focused journey through Nadi Shodhana, Kapalabhati, Bhramari, and advanced kumbhaka (breath retention) practices. Prerequisites: RYT 200 or equivalent.',
    gradient: 'from-teal-600 to-cyan-700',
    iconColor: 'text-cyan-200',
    lessons: 14,
    level: 'Advanced',
  },
  {
    id: 'yoga-mental-health',
    title: 'Yoga & Mental Health: Research Overview',
    instructor: 'Sophie van Berg',
    duration: '3h 30m',
    category: 'Research',
    access: 'Free',
    description: 'A thorough review of current research on yoga\'s applications for anxiety, depression, PTSD, and chronic pain. Presented in accessible language for teachers and practitioners.',
    gradient: 'from-rose-500 to-pink-700',
    iconColor: 'text-rose-200',
    lessons: 10,
    level: 'All Levels',
  },
];

export const allCourseCategories: Array<'All' | CourseCategory | 'In Progress' | 'Completed'> = [
  'All', 'In Progress', 'Completed', 'Workshop', 'Yoga Sequence', 'Dharma Talk', 'Music Playlist', 'Research',
];

export function getInProgressCourses() {
  return courses.filter(c => c.status === 'in_progress')
    .sort((a, b) => new Date(b.lastAccessed!).getTime() - new Date(a.lastAccessed!).getTime());
}

export function getCompletedCourses() {
  return courses.filter(c => c.status === 'completed');
}
