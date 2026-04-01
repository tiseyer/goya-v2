export type PriceType = 'free' | 'one-time' | 'recurring' | 'recurring-with-signup' | 'donation';
export type CtaType = 'ADD_TO_CART' | 'SELECT_OPTIONS';

export interface Addon {
  id: string;
  name: string;
  acronym: string;
  badgeLines: string[];
  fullName: string;
  price: number;
  priceType: PriceType;
  signupFee?: number;
  cta: CtaType;
  description: string[];
  bullets: Array<{ label: string; text: string }>;
  page: 1 | 2;
}

export const ADDONS: Addon[] = [
  {
    id: 'experience-years',
    name: 'Experience Years',
    acronym: 'YEARS',
    badgeLines: ['TEACHING', 'EXPERIENCE'],
    fullName: 'Teaching Experience',
    price: 0,
    priceType: 'free',
    cta: 'SELECT_OPTIONS',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Displays your verified years of teaching experience on your public GOYA profile.' },
      { label: 'No Recurring Fees:', text: 'This add-on is completely free and requires no subscription.' },
      { label: 'Document Verification:', text: 'Submit proof of teaching experience for official GOYA verification.' },
    ],
    description: [
      "Let the world know how long you've been guiding students on their yoga journey. The Experience Years add-on adds a verified badge to your GOYA profile reflecting your cumulative years of teaching experience.",
      "Whether you're celebrating 1 year or 30, this credential helps prospective students and schools understand the depth of your practice at a glance. All submissions are reviewed by the GOYA verification team.",
    ],
  },
  {
    id: 'giving-tree-donation',
    name: 'GOYA Giving Tree Donation',
    acronym: 'GTD',
    badgeLines: ['GIVING TREE'],
    fullName: 'Giving Tree Donation',
    price: 5,
    priceType: 'donation',
    cta: 'SELECT_OPTIONS',
    page: 1,
    bullets: [
      { label: 'Community Impact:', text: 'Your donation directly supports yoga education initiatives and scholarship programs.' },
      { label: 'Annual Contribution:', text: 'Choose your giving level — from $5/year to any amount you wish.' },
      { label: 'Recognition:', text: 'Donors are recognized with a Giving Tree badge on their GOYA profile.' },
    ],
    description: [
      'The GOYA Giving Tree is our community philanthropy program, dedicated to making yoga education accessible to all. Every dollar donated goes directly toward scholarships, subsidized memberships, and outreach programs.',
      'Select your contribution level and become part of the growing community of yoga practitioners giving back to the world of wellness.',
    ],
  },
  {
    id: 'goya-wp',
    name: 'GOYA-WP®',
    acronym: 'WP',
    badgeLines: ['WELLNESS', 'PRACTITIONER'],
    fullName: 'Wellness Practitioner',
    price: 10,
    priceType: 'one-time',
    cta: 'SELECT_OPTIONS',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-WP® designation badge to your member profile and public directory listing.' },
      { label: 'No Recurring Fees:', text: 'This is a one-time registration fee with no annual renewal required.' },
      { label: 'Document Verification:', text: 'Submit your wellness certification or training documentation for GOYA review.' },
    ],
    description: [
      "The GOYA Wellness Practitioner (WP) designation recognizes professionals who have completed accredited training in wellness disciplines beyond traditional yoga — including Reiki, Breathwork, Sound Healing, Ayurveda, and related modalities.",
      "Upon approval, your profile will display the GOYA-WP® badge, signaling to students and clients that your credentials have been reviewed and verified by GOYA's credentialing committee.",
    ],
  },
  {
    id: 'goya-cyt200',
    name: 'GOYA-CYT200®',
    acronym: 'CYT200',
    badgeLines: ['CERTIFIED YOGA', 'TEACHER 200'],
    fullName: 'Certified Yoga Teacher 200',
    price: 10,
    priceType: 'one-time',
    cta: 'SELECT_OPTIONS',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CYT200® designation badge to your public profile and member directory.' },
      { label: 'No Recurring Fees:', text: 'One-time registration fee. No annual renewal required to maintain this designation.' },
      { label: 'Document Verification:', text: 'Upload your 200-hour teacher training certificate from an accredited school.' },
    ],
    description: [
      'The GOYA Certified Yoga Teacher 200 (CYT200) designation is awarded to teachers who have successfully completed a minimum 200-hour yoga teacher training program from a recognized institution.',
      'This foundational credential demonstrates that you have met the baseline competencies expected of a professional yoga teacher, covering asana, pranayama, anatomy, teaching methodology, and yoga philosophy.',
    ],
  },
  {
    id: 'goya-cyt500',
    name: 'GOYA-CYT500®',
    acronym: 'CYT500',
    badgeLines: ['CERTIFIED YOGA', 'TEACHER 500'],
    fullName: 'Certified Yoga Teacher 500',
    price: 15,
    priceType: 'one-time',
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CYT500® designation badge to your public profile and member directory.' },
      { label: 'No Recurring Fees:', text: 'One-time registration fee. No annual renewal required to maintain this designation.' },
      { label: 'Document Verification:', text: 'Upload your 500-hour teacher training certificate from an accredited school.' },
    ],
    description: [
      'The GOYA Certified Yoga Teacher 500 (CYT500) designation represents an advanced level of yoga teacher training, requiring completion of a minimum 500-hour program or the combination of a 200-hour foundational training plus an advanced 300-hour program.',
      'This designation signals a deeper commitment to the craft, with comprehensive training in advanced asana, therapeutics, sequencing, mentorship, and specialized areas of yoga education.',
    ],
  },
  {
    id: 'goya-ecyt200',
    name: 'GOYA-ECYT200®',
    acronym: 'ECYT200',
    badgeLines: ['EXP. CERTIFIED', 'YOGA TEACHER'],
    fullName: 'Experienced Certified Yoga Teacher 200',
    price: 10,
    priceType: 'recurring-with-signup',
    signupFee: 15,
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-ECYT200® badge, reflecting both your 200hr certification and extensive teaching experience.' },
      { label: 'Annual Renewal:', text: '$10.00/year to maintain active ECYT200 status, plus a $15.00 one-time sign-up fee.' },
      { label: 'Document Verification:', text: 'Submit your CYT200 certificate and evidence of 2,000+ hours of professional teaching experience.' },
    ],
    description: [
      'The GOYA Experienced Certified Yoga Teacher 200 (ECYT200) designation is awarded to yoga teachers who hold a 200-hour certification AND have accumulated a minimum of 2,000 documented teaching hours.',
      "This credential recognizes that certification alone does not define mastery — the ECYT designation honors the invaluable depth that comes with years in the classroom, refining technique, building community, and shaping countless students' practices.",
    ],
  },
  {
    id: 'goya-ecyt500',
    name: 'GOYA-ECYT500®',
    acronym: 'ECYT500',
    badgeLines: ['EXP. CERTIFIED', 'YOGA TEACHER'],
    fullName: 'Experienced Certified Yoga Teacher 500',
    price: 10,
    priceType: 'recurring-with-signup',
    signupFee: 15,
    cta: 'SELECT_OPTIONS',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-ECYT500® badge, the highest teacher-level credential GOYA offers.' },
      { label: 'Annual Renewal:', text: '$10.00/year to maintain active ECYT500 status, plus a $15.00 one-time sign-up fee.' },
      { label: 'Document Verification:', text: 'Submit your CYT500 certificate and evidence of 2,000+ hours of professional teaching experience.' },
    ],
    description: [
      'The GOYA Experienced Certified Yoga Teacher 500 (ECYT500) is the pinnacle teacher-level designation offered by GOYA. It is awarded to teachers who hold a 500-hour certification AND can demonstrate a minimum of 2,000 documented teaching hours.',
      'Holding the ECYT500 distinguishes you as a master-level educator with both the formal advanced training and the real-world experience to guide students, train new teachers, and lead programs at the highest standard.',
    ],
  },
  {
    id: 'goya-ccyt',
    name: 'GOYA-CCYT®',
    acronym: 'CCYT',
    badgeLines: ["CHILDREN'S", 'YOGA TEACHER'],
    fullName: "Certified Children's Yoga Teacher",
    price: 10,
    priceType: 'one-time',
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: "Adds the GOYA-CCYT® badge to your profile, signaling your specialization in children's yoga." },
      { label: 'No Recurring Fees:', text: 'One-time registration fee with no annual renewal.' },
      { label: 'Document Verification:', text: "Submit your children's yoga teacher training certificate from an accredited program." },
    ],
    description: [
      "The GOYA Certified Children's Yoga Teacher (CCYT) designation is awarded to yoga teachers who have completed specialized training in teaching yoga to children ages 4–12. This includes age-appropriate sequencing, games, storytelling, mindfulness techniques, and child psychology fundamentals.",
      "Teaching yoga to children requires a unique skill set distinct from adult instruction. The CCYT designation communicates to schools, parents, and community organizations that you have the training and sensitivity to work effectively with young students.",
    ],
  },
  {
    id: 'goya-cpyt',
    name: 'GOYA-CPYT®',
    acronym: 'CPYT',
    badgeLines: ['PRENATAL', 'YOGA TEACHER'],
    fullName: 'Certified Prenatal Yoga Teacher',
    price: 10,
    priceType: 'one-time',
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CPYT® badge to your profile, highlighting your prenatal specialization.' },
      { label: 'No Recurring Fees:', text: 'One-time registration fee with no annual renewal.' },
      { label: 'Document Verification:', text: 'Submit your prenatal yoga teacher training certificate from an accredited program.' },
    ],
    description: [
      'The GOYA Certified Prenatal Yoga Teacher (CPYT) designation recognizes teachers who have completed specialized training in prenatal yoga. This includes safe adaptations for all trimesters, postnatal recovery, pelvic floor awareness, breathwork for labor support, and contraindications for pregnancy.',
      'As a CPYT, you are equipped to serve expecting mothers with the care and expertise they deserve. This designation is increasingly sought after by hospitals, birthing centers, prenatal fitness studios, and wellness practitioners.',
    ],
  },
  {
    id: 'goya-cyyt',
    name: 'GOYA-CYYT®',
    acronym: 'CYYT',
    badgeLines: ['YIN YOGA', 'TEACHER'],
    fullName: 'Certified Yin Yoga Teacher',
    price: 10,
    priceType: 'one-time',
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CYYT® badge to your profile, showcasing your expertise in Yin Yoga.' },
      { label: 'No Recurring Fees:', text: 'One-time registration fee with no annual renewal.' },
      { label: 'Document Verification:', text: 'Submit your Yin Yoga teacher training certificate from an accredited program.' },
    ],
    description: [
      'The GOYA Certified Yin Yoga Teacher (CYYT) designation is awarded to teachers who have completed specialized training in the Yin Yoga tradition. Yin Yoga training covers long-held passive postures, fascia and connective tissue anatomy, Traditional Chinese Medicine meridians, and the meditative aspects of the practice.',
      'With the growing popularity of Yin Yoga among practitioners seeking balance to more vigorous styles, the CYYT credential positions you as a specialist in this restorative and introspective discipline.',
    ],
  },
  {
    id: 'goya-cryt',
    name: 'GOYA-CRYT®',
    acronym: 'CRYT',
    badgeLines: ['RESTORATIVE', 'YOGA TEACHER'],
    fullName: 'Certified Restorative Yoga Teacher',
    price: 10,
    priceType: 'one-time',
    cta: 'SELECT_OPTIONS',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CRYT® badge to your profile, highlighting your restorative specialization.' },
      { label: 'No Recurring Fees:', text: 'One-time registration fee with no annual renewal.' },
      { label: 'Document Verification:', text: 'Submit your Restorative Yoga training certificate from an accredited program.' },
    ],
    description: [
      'The GOYA Certified Restorative Yoga Teacher (CRYT) designation recognizes teachers trained in the therapeutic art of Restorative Yoga. Training covers the use of props to fully support the body, nervous system regulation, trauma-informed teaching, and the science of deep relaxation.',
      'Restorative Yoga is increasingly prescribed by therapists, physicians, and wellness professionals for stress-related conditions. The CRYT credential demonstrates your ability to facilitate healing environments appropriate for diverse populations.',
    ],
  },
  {
    id: 'goya-cmt',
    name: 'GOYA-CMT®',
    acronym: 'CMT',
    badgeLines: ['MEDITATION', 'TEACHER'],
    fullName: 'Certified Meditation Teacher',
    price: 10,
    priceType: 'one-time',
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CMT® badge to your profile, showcasing your credentials in meditation instruction.' },
      { label: 'No Recurring Fees:', text: 'One-time registration fee with no annual renewal.' },
      { label: 'Document Verification:', text: 'Submit your meditation teacher training certificate from an accredited program.' },
    ],
    description: [
      'The GOYA Certified Meditation Teacher (CMT) designation is awarded to practitioners who have completed accredited training in meditation instruction. This includes mindfulness-based techniques, breathing practices, visualization, mantra, and the neuroscience of contemplative practice.',
      'As mindfulness and meditation move further into the mainstream — in corporate wellness, education, healthcare, and sports — the CMT designation establishes your credibility as a trained guide in these evidence-based practices.',
    ],
  },
  {
    id: 'goya-cayt',
    name: 'GOYA-CAYT®',
    acronym: 'CAYT',
    badgeLines: ['AYURVEDA', 'YOGA TEACHER'],
    fullName: 'Certified Ayurveda Yoga Teacher',
    price: 10,
    priceType: 'one-time',
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CAYT® badge to your profile, reflecting your expertise in Ayurveda-informed yoga.' },
      { label: 'No Recurring Fees:', text: 'One-time registration fee with no annual renewal.' },
      { label: 'Document Verification:', text: 'Submit your Ayurveda Yoga teacher training certificate from an accredited program.' },
    ],
    description: [
      'The GOYA Certified Ayurveda Yoga Teacher (CAYT) designation is for teachers who have integrated Ayurvedic principles into their yoga instruction. Training covers the three doshas (Vata, Pitta, Kapha), seasonal routines, diet and lifestyle recommendations, and how to tailor yoga practice to individual constitution.',
      'Bridging the sister sciences of Yoga and Ayurveda, the CAYT designation positions you as a holistic wellness educator capable of offering personalized, constitution-based guidance to students seeking a more integrated approach to health.',
    ],
  },
  {
    id: 'goya-ccep',
    name: 'GOYA-CCEP®',
    acronym: 'CCEP',
    badgeLines: ['CONTINUING ED.', 'PROVIDER'],
    fullName: 'Certified Continuing Education Provider',
    price: 10,
    priceType: 'recurring-with-signup',
    signupFee: 29,
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Adds the GOYA-CCEP® badge and lists your organization as an approved CE provider in the GOYA directory.' },
      { label: 'Annual Renewal:', text: '$10.00/year to maintain CCEP status, plus a $29.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your workshop curriculum, teacher credentials, and program outline for GOYA review.' },
    ],
    description: [
      'The GOYA Certified Continuing Education Provider (CCEP) designation is awarded to yoga teachers, schools, and organizations offering workshops, intensives, or training programs that qualify for GOYA Continuing Education credits.',
      'As a CCEP, your programs are listed in the GOYA CE directory and your students can officially log CE hours toward their GOYA member profiles. This designation adds credibility and visibility to your offerings and connects you with teachers actively seeking continuing education.',
    ],
  },
  {
    id: 'goya-cys200',
    name: 'GOYA-CYS200®',
    acronym: 'CYS200',
    badgeLines: ['CERTIFIED YOGA', 'SCHOOL 200'],
    fullName: 'Certified Yoga School 200',
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Lists your school in the GOYA Certified School directory with the CYS200® designation badge.' },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain school accreditation status, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your curriculum outline, faculty credentials, and program structure for GOYA accreditation review.' },
    ],
    description: [
      "The GOYA Certified Yoga School 200 (CYS200) designation recognizes yoga schools and training programs that offer accredited 200-hour teacher training programs meeting GOYA's curriculum standards.",
      "As a CYS200 school, your graduates are eligible to apply for the GOYA-CYT200® designation directly, creating a seamless pathway from your program to professional certification. Your school gains prominent placement in the GOYA school directory, connecting you with prospective students worldwide.",
    ],
  },
  {
    id: 'goya-cys300',
    name: 'GOYA-CYS300®',
    acronym: 'CYS300',
    badgeLines: ['CERTIFIED YOGA', 'SCHOOL 300'],
    fullName: 'Certified Yoga School 300',
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 1,
    bullets: [
      { label: 'Profile Addition:', text: 'Lists your school in the GOYA Certified School directory with the CYS300® designation badge.' },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain school accreditation status, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your advanced curriculum, faculty qualifications, and program materials for GOYA review.' },
    ],
    description: [
      "The GOYA Certified Yoga School 300 (CYS300) designation is awarded to schools offering accredited 300-hour advanced teacher training programs that meet GOYA's elevated curriculum standards for post-graduate instruction.",
      "CYS300 programs provide the advanced training that completes the 500-hour pathway when combined with an approved 200-hour program. Your school's listing in the GOYA directory connects you with credentialed teachers seeking to deepen their training.",
    ],
  },
  {
    id: 'goya-cys500',
    name: 'GOYA-CYS500®',
    acronym: 'CYS500',
    badgeLines: ['CERTIFIED YOGA', 'SCHOOL 500'],
    fullName: 'Certified Yoga School 500',
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 2,
    bullets: [
      { label: 'Profile Addition:', text: 'Lists your school in the GOYA Certified School directory with the CYS500® designation badge.' },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain school accreditation status, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your comprehensive 500-hour curriculum and faculty credentials for GOYA accreditation review.' },
    ],
    description: [
      'The GOYA Certified Yoga School 500 (CYS500) designation is the highest school-level certification offered by GOYA, recognizing institutions that deliver comprehensive 500-hour teacher training programs under one roof.',
      "Graduates of CYS500 programs are eligible to apply for the GOYA-CYT500® designation, the advanced teacher credential signaling completion of an integrated, comprehensive training. Your school benefits from premium placement in the GOYA directory.",
    ],
  },
  {
    id: 'goya-ccys',
    name: 'GOYA-CCYS®',
    acronym: 'CCYS',
    badgeLines: ["CHILDREN'S", 'YOGA SCHOOL'],
    fullName: "Certified Children's Yoga School",
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 2,
    bullets: [
      { label: 'Profile Addition:', text: "Lists your school as a GOYA-certified institution for children's yoga teacher training." },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain accreditation, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: "Submit your children's yoga curriculum, child safety policies, and faculty credentials." },
    ],
    description: [
      "The GOYA Certified Children's Yoga School (CCYS) designation is awarded to training programs that specialize in preparing teachers to instruct yoga for children ages 4–12.",
      "CCYS accreditation signals that your program covers age-appropriate sequencing, child psychology, inclusive teaching methods, and safeguarding protocols. Graduates of CCYS programs are eligible to apply for the GOYA-CCYT® designation.",
    ],
  },
  {
    id: 'goya-cpys',
    name: 'GOYA-CPYS®',
    acronym: 'CPYS',
    badgeLines: ['PRENATAL', 'YOGA SCHOOL'],
    fullName: 'Certified Prenatal Yoga School',
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 2,
    bullets: [
      { label: 'Profile Addition:', text: 'Lists your school as a GOYA-certified institution for prenatal yoga teacher training.' },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain accreditation, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your prenatal curriculum, safety protocols, and faculty credentials for review.' },
    ],
    description: [
      'The GOYA Certified Prenatal Yoga School (CPYS) designation is for training programs that specialize in preparing teachers to safely guide expecting and postnatal mothers through yoga practice.',
      'CPYS accreditation ensures your program covers all trimester adaptations, postnatal recovery, labor breathing techniques, and the necessary physiological and anatomical knowledge for safe prenatal instruction. Graduates may apply for the GOYA-CPYT® designation.',
    ],
  },
  {
    id: 'goya-cyys',
    name: 'GOYA-CYYS®',
    acronym: 'CYYS',
    badgeLines: ['YIN YOGA', 'SCHOOL'],
    fullName: 'Certified Yin Yoga School',
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 2,
    bullets: [
      { label: 'Profile Addition:', text: 'Lists your school as a GOYA-certified Yin Yoga teacher training institution.' },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain accreditation, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your Yin Yoga curriculum, teacher credentials, and training materials for review.' },
    ],
    description: [
      'The GOYA Certified Yin Yoga School (CYYS) designation is awarded to training programs specializing in the Yin Yoga tradition. Accredited programs must cover connective tissue and fascia anatomy, TCM meridian theory, long-hold sequencing methodology, and the philosophical underpinnings of Yin practice.',
      'As the demand for Yin Yoga continues to grow, CYYS accreditation positions your program as the go-to destination for teachers seeking specialized training in this discipline. Graduates may apply for the GOYA-CYYT® designation.',
    ],
  },
  {
    id: 'goya-crys',
    name: 'GOYA-CRYS®',
    acronym: 'CRYS',
    badgeLines: ['RESTORATIVE', 'YOGA SCHOOL'],
    fullName: 'Certified Restorative Yoga School',
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 2,
    bullets: [
      { label: 'Profile Addition:', text: 'Lists your school as a GOYA-certified Restorative Yoga teacher training institution.' },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain accreditation, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your Restorative Yoga curriculum, prop use guidelines, and trauma-informed teaching framework.' },
    ],
    description: [
      'The GOYA Certified Restorative Yoga School (CRYS) designation recognizes training programs that specialize in the therapeutic practice of Restorative Yoga. Accredited programs must address nervous system science, prop sequencing, trauma-informed facilitation, and clinical applications of deep relaxation.',
      'With growing referrals from healthcare professionals, CRYS accreditation signals that your program prepares teachers to work in therapeutic and wellness settings. Graduates may apply for the GOYA-CRYT® designation.',
    ],
  },
  {
    id: 'goya-cms',
    name: 'GOYA-CMS®',
    acronym: 'CMS',
    badgeLines: ['MEDITATION', 'SCHOOL'],
    fullName: 'Certified Meditation School',
    price: 40,
    priceType: 'recurring-with-signup',
    signupFee: 99,
    cta: 'ADD_TO_CART',
    page: 2,
    bullets: [
      { label: 'Profile Addition:', text: 'Lists your school as a GOYA-certified Meditation teacher training institution.' },
      { label: 'Annual Renewal:', text: '$40.00/year to maintain accreditation, plus a $99.00 one-time application fee.' },
      { label: 'Document Verification:', text: 'Submit your meditation curriculum, lineage information, and faculty qualifications for review.' },
    ],
    description: [
      'The GOYA Certified Meditation School (CMS) designation is awarded to programs that offer comprehensive meditation teacher training covering mindfulness techniques, contemplative traditions, neuroscience of meditation, and practical instruction skills.',
      'As corporate wellness, mental health care, and educational institutions increasingly integrate meditation, CMS accreditation positions your school at the forefront of this growing field. Graduates may apply for the GOYA-CMT® designation.',
    ],
  },
];

export function formatPrice(addon: Addon): string {
  switch (addon.priceType) {
    case 'free':   return 'Free';
    case 'donation': return `from $${addon.price.toFixed(2)}/year`;
    case 'one-time': return `$${addon.price.toFixed(2)}`;
    case 'recurring': return `$${addon.price.toFixed(2)}/year`;
    case 'recurring-with-signup':
      return `$${addon.price.toFixed(2)}/year + $${addon.signupFee!.toFixed(2)} sign-up fee`;
    default: return `$${addon.price.toFixed(2)}`;
  }
}

export const PAGE_SIZE = 16;
