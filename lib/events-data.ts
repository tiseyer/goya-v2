export type EventCategory = 'Workshop' | 'Teacher Training' | 'Dharma Talk' | 'Conference';

export interface YogaEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // ISO YYYY-MM-DD
  time: string;
  endTime: string;
  location: string;
  isOnline: boolean;
  price: number | 'Free';
  description: string;
  instructor: string;
  spots: number | null;
}

export const events: YogaEvent[] = [
  {
    id: 'vinyasa-flow-workshop',
    title: 'Vinyasa Flow Masterclass',
    category: 'Workshop',
    date: '2026-03-20',
    time: '10:00',
    endTime: '12:30',
    location: 'Online (Zoom)',
    isOnline: true,
    price: 25,
    description: 'A deep dive into the art of sequencing in Vinyasa yoga. Learn how to build intelligent, creative flows that honor anatomy and serve diverse bodies. Suitable for teachers and advanced students.',
    instructor: 'Priya Sharma',
    spots: 40,
  },
  {
    id: 'teacher-training-info',
    title: '200-Hour Teacher Training: Info Session',
    category: 'Teacher Training',
    date: '2026-03-22',
    time: '18:00',
    endTime: '19:30',
    location: 'Online (Zoom)',
    isOnline: true,
    price: 'Free',
    description: 'Join us for an open information session about GOYA-accredited 200-hour teacher training programs. Ask questions, meet lead trainers, and learn about the application process.',
    instructor: 'GOYA Team',
    spots: null,
  },
  {
    id: 'dharma-eight-limbs',
    title: 'Dharma Talk: The Eight Limbs of Yoga',
    category: 'Dharma Talk',
    date: '2026-03-25',
    time: '19:00',
    endTime: '20:30',
    location: 'Online (YouTube Live)',
    isOnline: true,
    price: 'Free',
    description: 'An accessible and inspiring journey through Patanjali\'s Ashtanga — the eight-limbed path of yoga. Open to all levels. No prior philosophy background required.',
    instructor: 'Kenji Nakamura',
    spots: null,
  },
  {
    id: 'yin-yoga-masterclass',
    title: 'Yin Yoga & Meridian Theory Immersion',
    category: 'Workshop',
    date: '2026-03-28',
    time: '09:00',
    endTime: '17:00',
    location: 'London, United Kingdom',
    isOnline: false,
    price: 95,
    description: 'A full-day immersion exploring Yin Yoga through the lens of Traditional Chinese Medicine. Learn how meridian theory can inform your practice and teaching. Includes lunch and course materials.',
    instructor: 'Freya Andersen',
    spots: 20,
  },
  {
    id: 'goya-conference-2026',
    title: 'GOYA Annual Conference 2026',
    category: 'Conference',
    date: '2026-04-05',
    time: '08:00',
    endTime: '18:00',
    location: 'Bali, Indonesia',
    isOnline: false,
    price: 195,
    description: 'The flagship annual gathering of the GOYA community. Three days of keynotes, workshops, networking, and community practice. Early bird pricing available until March 31.',
    instructor: 'Various Speakers',
    spots: 300,
  },
  {
    id: 'pranayama-workshop',
    title: 'Pranayama & Breathwork Workshop',
    category: 'Workshop',
    date: '2026-04-08',
    time: '18:30',
    endTime: '20:30',
    location: 'Online (Zoom)',
    isOnline: true,
    price: 30,
    description: 'An evidence-based exploration of breathwork techniques — from classical pranayama to contemporary breath science. Participants will leave with a practical toolkit for daily practice.',
    instructor: 'Sarah Mitchell',
    spots: 35,
  },
  {
    id: '500hr-orientation',
    title: '500-Hour Advanced Training: Orientation',
    category: 'Teacher Training',
    date: '2026-04-12',
    time: '17:00',
    endTime: '18:30',
    location: 'Online (Zoom)',
    isOnline: true,
    price: 'Free',
    description: 'Explore pathways to your 500-hour certification through GOYA-accredited schools. Hear from alumni, lead trainers, and the GOYA standards committee.',
    instructor: 'GOYA Academy',
    spots: null,
  },
  {
    id: 'dharma-yoga-sutras',
    title: 'Dharma Talk: Yoga Sutras for Modern Life',
    category: 'Dharma Talk',
    date: '2026-04-15',
    time: '19:30',
    endTime: '21:00',
    location: 'Online (YouTube Live)',
    isOnline: true,
    price: 'Free',
    description: 'What do Patanjali\'s Yoga Sutras have to teach us about navigating modern challenges? A practical and philosophical discussion open to all.',
    instructor: 'Amara Osei',
    spots: null,
  },
  {
    id: 'restorative-immersion',
    title: 'Restorative Yoga Weekend Immersion',
    category: 'Workshop',
    date: '2026-04-20',
    time: '10:00',
    endTime: '17:00',
    location: 'Barcelona, Spain',
    isOnline: false,
    price: 140,
    description: 'Two days of deep rest, nervous system regulation, and restorative yoga practice. Suitable for practitioners seeking burnout recovery and for teachers wishing to add restorative skills to their offerings.',
    instructor: 'Elena Vasquez',
    spots: 15,
  },
  {
    id: 'kids-yoga-training',
    title: 'Children\'s Yoga Teacher Training',
    category: 'Teacher Training',
    date: '2026-05-03',
    time: '09:00',
    endTime: '17:00',
    location: 'Online (Zoom)',
    isOnline: true,
    price: 350,
    description: 'A GOYA-accredited 30-hour children\'s yoga training. Learn age-appropriate sequencing, classroom management, storytelling techniques, and ethical considerations when working with minors.',
    instructor: 'Freya Andersen',
    spots: 25,
  },
];

export const allCategories: Array<'All' | EventCategory> = [
  'All', 'Workshop', 'Teacher Training', 'Dharma Talk', 'Conference',
];
