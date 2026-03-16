export type MemberRole = 'Teacher' | 'Student' | 'School' | 'Wellness Practitioner';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  country: string;
  city: string;
  coordinates: [number, number]; // [lng, lat]
  bio: string;
  photo: string;
  designations: string[];
  teachingStyles: string[];
  specialties: string[];
  credits: {
    CE: number;
    Community: number;
    Karma: number;
    Practice: number;
  };
  social: {
    website?: string;
    instagram?: string;
    youtube?: string;
  };
  memberSince: string;
  featured?: boolean;
}

export const members: Member[] = [
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    role: 'Teacher',
    country: 'India',
    city: 'Mysore',
    coordinates: [76.6394, 12.2958],
    bio: 'A dedicated practitioner with over 15 years of experience in traditional Ashtanga Vinyasa. Priya studied under Sharath Jois at KPJAYI and brings an authentic, lineage-based approach to her teaching, helping students cultivate a sustainable daily practice rooted in the original methods.',
    photo: 'https://i.pravatar.cc/400?img=1',
    designations: ['E-RYT 500', 'YACEP'],
    teachingStyles: ['Ashtanga', 'Vinyasa', 'Pranayama'],
    specialties: ['Primary Series', 'Mysore Method', 'Breathwork'],
    credits: { CE: 240, Community: 85, Karma: 120, Practice: 1800 },
    social: { website: 'https://priyayoga.com', instagram: '@priya.yoga.mysore' },
    memberSince: '2019',
    featured: true,
  },
  {
    id: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    role: 'Teacher',
    country: 'United States',
    city: 'San Francisco',
    coordinates: [-122.4194, 37.7749],
    bio: 'Sarah brings mindfulness and movement together in her Hatha and Yin classes. A former physical therapist turned yoga teacher, she specializes in therapeutic applications of yoga for injury recovery and chronic stress management in a busy urban setting.',
    photo: 'https://i.pravatar.cc/400?img=5',
    designations: ['E-RYT 200', 'RPYT'],
    teachingStyles: ['Hatha', 'Yin', 'Therapeutic'],
    specialties: ['Injury Recovery', 'Prenatal Yoga', 'Stress Relief'],
    credits: { CE: 180, Community: 60, Karma: 95, Practice: 1200 },
    social: { website: 'https://sarahyoga.com', instagram: '@sarah.mitchell.yoga', youtube: 'SarahMitchellYoga' },
    memberSince: '2020',
    featured: true,
  },
  {
    id: 'kenji-nakamura',
    name: 'Kenji Nakamura',
    role: 'Teacher',
    country: 'Japan',
    city: 'Tokyo',
    coordinates: [139.6917, 35.6895],
    bio: 'Kenji blends traditional Japanese Zen philosophy with modern Kundalini practice. His classes are meditative journeys that integrate breathwork, mantra, and movement to awaken inner awareness and quiet the relentless pace of modern city life.',
    photo: 'https://i.pravatar.cc/400?img=12',
    designations: ['E-RYT 500', 'YACEP'],
    teachingStyles: ['Kundalini', 'Meditation', 'Yoga Nidra'],
    specialties: ['Mantra Practice', 'Breathwork', 'Sound Healing'],
    credits: { CE: 310, Community: 100, Karma: 200, Practice: 2400 },
    social: { instagram: '@kenji.kundalini', youtube: 'KenjiNakamuraYoga' },
    memberSince: '2018',
    featured: true,
  },
  {
    id: 'freya-andersen',
    name: 'Freya Andersen',
    role: 'Teacher',
    country: 'Denmark',
    city: 'Copenhagen',
    coordinates: [12.5683, 55.6761],
    bio: "Freya is passionate about making yoga accessible to all bodies and abilities. Her Restorative and Gentle Yoga classes are havens of calm in Copenhagen's busy urban landscape, welcoming seniors, beginners, and those with mobility limitations.",
    photo: 'https://i.pravatar.cc/400?img=9',
    designations: ['RYT 200', 'RCYT'],
    teachingStyles: ['Restorative', 'Gentle Yoga', 'Kids Yoga'],
    specialties: ['Adaptive Yoga', 'Yoga for Seniors', "Children's Yoga"],
    credits: { CE: 120, Community: 150, Karma: 80, Practice: 900 },
    social: { instagram: '@freya.yoga.cph', website: 'https://freyayoga.dk' },
    memberSince: '2021',
  },
  {
    id: 'marco-rossini',
    name: 'Marco Rossini',
    role: 'Student',
    country: 'Italy',
    city: 'Florence',
    coordinates: [11.2558, 43.7696],
    bio: "Marco discovered yoga during a challenging period in his life and has been a devoted student for three years. Currently preparing for his 200-hour teacher training, he practices Vinyasa and Ashtanga daily at sunrise before heading to his architecture studio.",
    photo: 'https://i.pravatar.cc/400?img=67',
    designations: ['GOYA Member'],
    teachingStyles: ['Vinyasa', 'Ashtanga'],
    specialties: [],
    credits: { CE: 40, Community: 20, Karma: 35, Practice: 480 },
    social: { instagram: '@marco.yoga.florence' },
    memberSince: '2023',
  },
  {
    id: 'ji-yeon-park',
    name: 'Ji-Yeon Park',
    role: 'Student',
    country: 'South Korea',
    city: 'Seoul',
    coordinates: [126.9780, 37.5665],
    bio: 'Ji-Yeon is a graduate student in kinesiology who practices yoga as both a movement discipline and a research subject. She is exploring the intersection of traditional yoga and modern sports science for her doctoral thesis.',
    photo: 'https://i.pravatar.cc/400?img=44',
    designations: ['GOYA Member'],
    teachingStyles: ['Power Yoga', 'Hatha'],
    specialties: ['Sports Science', 'Anatomy'],
    credits: { CE: 55, Community: 10, Karma: 15, Practice: 360 },
    social: { instagram: '@jiyeon.yoga' },
    memberSince: '2022',
  },
  {
    id: 'lucas-ferreira',
    name: 'Lucas Ferreira',
    role: 'Student',
    country: 'Brazil',
    city: 'São Paulo',
    coordinates: [-46.6333, -23.5505],
    bio: "Lucas began his yoga journey through surf culture and quickly fell in love with the deeper practices of pranayama and meditation. He trains under multiple teachers across São Paulo's vibrant yoga community and dreams of teaching one day.",
    photo: 'https://i.pravatar.cc/400?img=56',
    designations: ['GOYA Member'],
    teachingStyles: ['Vinyasa', 'Yin'],
    specialties: [],
    credits: { CE: 25, Community: 30, Karma: 20, Practice: 290 },
    social: { instagram: '@lucas.yoga.sp' },
    memberSince: '2024',
  },
  {
    id: 'ananda-yoga-academy',
    name: 'Ananda Yoga Academy',
    role: 'School',
    country: 'India',
    city: 'Rishikesh',
    coordinates: [78.2676, 30.0869],
    bio: "One of Rishikesh's most respected yoga schools, offering immersive 200 and 500-hour teacher trainings rooted in classical Hatha and Raja Yoga. With over 2,000 graduates worldwide, we are committed to upholding the integrity of the yogic tradition.",
    photo: 'https://i.pravatar.cc/400?img=28',
    designations: ['RYS 500', 'RYS 300', 'RYS 200'],
    teachingStyles: ['Hatha', 'Raja Yoga', 'Meditation'],
    specialties: ['Teacher Training', 'Ayurveda Integration', 'Sanskrit Studies'],
    credits: { CE: 0, Community: 400, Karma: 600, Practice: 0 },
    social: { website: 'https://anandayogaacademy.com', instagram: '@anandayoga.rishikesh', youtube: 'AnandaYogaAcademy' },
    memberSince: '2017',
    featured: true,
  },
  {
    id: 'harmony-yoga-studio',
    name: 'Harmony Yoga Studio',
    role: 'School',
    country: 'United Kingdom',
    city: 'London',
    coordinates: [-0.1276, 51.5074],
    bio: 'A welcoming community studio in East London offering yoga teacher training and continuing education workshops. Harmony specializes in trauma-sensitive yoga and inclusivity practices, training teachers to work with diverse and underserved populations.',
    photo: 'https://i.pravatar.cc/400?img=25',
    designations: ['RYS 200', 'YACEP'],
    teachingStyles: ['Trauma-Sensitive Yoga', 'Inclusive Yoga', 'Hatha'],
    specialties: ['Trauma-Informed Teaching', 'Mental Health', 'Community Yoga'],
    credits: { CE: 0, Community: 520, Karma: 380, Practice: 0 },
    social: { website: 'https://harmonyyogalondon.co.uk', instagram: '@harmony.yoga.london' },
    memberSince: '2019',
  },
  {
    id: 'amara-osei',
    name: 'Amara Osei',
    role: 'Wellness Practitioner',
    country: 'Ghana',
    city: 'Accra',
    coordinates: [-0.1870, 5.5600],
    bio: 'Amara is a holistic wellness practitioner combining yoga, traditional Ghanaian healing practices, and Ayurveda. She runs community wellness programs in Accra and trains practitioners in Africa-centered approaches to wellbeing.',
    photo: 'https://i.pravatar.cc/400?img=32',
    designations: ['RYT 200', 'YACEP'],
    teachingStyles: ['Hatha', 'Meditation', 'Ayurveda'],
    specialties: ['Holistic Wellness', 'Traditional Healing', 'Community Health'],
    credits: { CE: 95, Community: 280, Karma: 150, Practice: 750 },
    social: { instagram: '@amara.wellness.accra', website: 'https://amaraosei.com' },
    memberSince: '2020',
    featured: true,
  },
  {
    id: 'elena-vasquez',
    name: 'Elena Vasquez',
    role: 'Wellness Practitioner',
    country: 'Spain',
    city: 'Barcelona',
    coordinates: [2.1734, 41.3851],
    bio: 'Elena integrates yoga, somatic movement, and nutrition coaching in her Barcelona-based practice. She works with corporate clients and individuals on burnout recovery and sustainable wellbeing, blending modern science with ancient wisdom.',
    photo: 'https://i.pravatar.cc/400?img=47',
    designations: ['RYT 200'],
    teachingStyles: ['Somatic Movement', 'Yin', 'Restorative'],
    specialties: ['Corporate Wellness', 'Burnout Recovery', 'Nutrition Coaching'],
    credits: { CE: 75, Community: 45, Karma: 60, Practice: 620 },
    social: { instagram: '@elena.wellness.bcn', website: 'https://elenavasquez.es' },
    memberSince: '2021',
  },
  {
    id: 'sophie-van-berg',
    name: 'Sophie van Berg',
    role: 'Wellness Practitioner',
    country: 'Netherlands',
    city: 'Amsterdam',
    coordinates: [4.9041, 52.3676],
    bio: 'Sophie combines mindfulness-based stress reduction (MBSR) with yoga for her clients in Amsterdam. A certified mindfulness teacher and yoga instructor, she specializes in working with anxiety, depression, and chronic pain using evidence-based approaches.',
    photo: 'https://i.pravatar.cc/400?img=49',
    designations: ['RYT 200', 'MBSR Certified'],
    teachingStyles: ['Mindfulness', 'Yin Yoga', 'Yoga Nidra'],
    specialties: ['Mental Health', 'Chronic Pain', 'MBSR Programs'],
    credits: { CE: 110, Community: 65, Karma: 45, Practice: 880 },
    social: { instagram: '@sophie.mindful.yoga', website: 'https://sophievanberg.nl' },
    memberSince: '2020',
  },
];

export const allCountries = ['All', ...Array.from(new Set(members.map(m => m.country))).sort()];
export const allDesignations = Array.from(new Set(members.flatMap(m => m.designations))).filter(d => d !== 'GOYA Member').sort();
export const allTeachingStyles = Array.from(new Set(members.flatMap(m => m.teachingStyles))).sort();
