import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const faqs = [
  // --- Membership (6) ---
  {
    question: "How do I become a GOYA member?",
    answer: "Visit our website and click 'Join Now'. Complete the registration form with your personal details, yoga background, and preferred membership tier. Once payment is processed, you'll receive a confirmation email with your Member Registration Number (MRN) and access to the member portal.",
    category: "Membership",
    status: "published"
  },
  {
    question: "What membership tiers does GOYA offer?",
    answer: "GOYA offers three membership tiers: Basic (access to community features and directory listing), Professional (includes credit hour tracking, event discounts, and enhanced profile), and Premium (all Professional benefits plus priority support, featured listing, and advanced analytics).",
    category: "Membership",
    status: "published"
  },
  {
    question: "How do I renew my GOYA membership?",
    answer: "Your membership renews automatically based on your billing cycle. You can view your renewal date and manage your subscription in the member portal under Settings > Subscription. If your payment method needs updating, you'll receive an email reminder 7 days before renewal.",
    category: "Membership",
    status: "published"
  },
  {
    question: "Can I upgrade or downgrade my membership tier?",
    answer: "Yes, you can change your membership tier at any time from Settings > Subscription in the member portal. Upgrades take effect immediately with a prorated charge. Downgrades take effect at the start of your next billing cycle.",
    category: "Membership",
    status: "published"
  },
  {
    question: "How do I cancel my GOYA membership?",
    answer: "You can cancel your membership from Settings > Subscription in the member portal. Your access continues until the end of your current billing period. We'd love to know your reason for leaving -- your feedback helps us improve. You can rejoin at any time.",
    category: "Membership",
    status: "published"
  },
  {
    question: "What is a Member Registration Number (MRN)?",
    answer: "Your MRN is a unique identifier assigned when you join GOYA. It's used for credential verification, event check-ins, and official GOYA communications. You can find your MRN on your profile page and in your welcome email. Keep it handy for any support requests.",
    category: "Membership",
    status: "published"
  },

  // --- Payment (5) ---
  {
    question: "What payment methods does GOYA accept?",
    answer: "GOYA accepts all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor. All transactions are encrypted and PCI-compliant.",
    category: "Payment",
    status: "published"
  },
  {
    question: "How do I update my payment method?",
    answer: "Go to Settings > Subscription in the member portal and click 'Update Payment Method'. Enter your new card details. The change takes effect immediately and will be used for your next billing cycle.",
    category: "Payment",
    status: "published"
  },
  {
    question: "Can I get a refund for my membership?",
    answer: "GOYA offers a 14-day money-back guarantee for new members. If you're not satisfied within the first 14 days, contact support for a full refund. After 14 days, refunds are reviewed on a case-by-case basis.",
    category: "Payment",
    status: "published"
  },
  {
    question: "Where can I find my payment receipts?",
    answer: "Payment receipts are automatically emailed to you after each transaction. You can also view your complete billing history in Settings > Subscription > Billing History in the member portal.",
    category: "Payment",
    status: "published"
  },
  {
    question: "Why was my payment declined?",
    answer: "Common reasons include insufficient funds, expired card, or bank security blocks. Try updating your payment method with current card details. If the issue persists, contact your bank to authorize the transaction, then try again. You can also reach out to GOYA support for assistance.",
    category: "Payment",
    status: "published"
  },

  // --- Teacher (6) ---
  {
    question: "How do I get listed in the GOYA teacher directory?",
    answer: "All GOYA members with Professional or Premium tiers are automatically listed in the teacher directory. Complete your profile with your teaching specialties, certifications, and bio to make your listing more discoverable. You can manage your visibility in Settings > Profile.",
    category: "Teacher",
    status: "published"
  },
  {
    question: "How do I add my yoga certifications to my profile?",
    answer: "Go to your Profile page and scroll to the Certifications section. Click 'Add Certification' and enter the certification name, issuing body, and date. You can upload supporting documents for verification. Verified certifications display a badge on your public profile.",
    category: "Teacher",
    status: "published"
  },
  {
    question: "Can I list my yoga classes and workshops on GOYA?",
    answer: "Yes! Professional and Premium members can create event listings for their classes, workshops, and retreats. Go to Events > Create Event in the member portal. Your events will appear in the GOYA events calendar and can be shared with the community.",
    category: "Teacher",
    status: "published"
  },
  {
    question: "How do I connect with other yoga teachers on GOYA?",
    answer: "Use the Member Directory to find teachers by location, specialty, or style. You can send connection requests to build your professional network. Join community discussions in the Feed to engage with fellow practitioners and share insights.",
    category: "Teacher",
    status: "published"
  },
  {
    question: "What are GOYA's requirements for yoga teacher credentials?",
    answer: "GOYA recognizes certifications from Yoga Alliance (RYT-200, RYT-500, E-RYT), as well as other internationally recognized yoga teacher training programs. We recommend listing all your relevant training and continuing education to strengthen your profile.",
    category: "Teacher",
    status: "published"
  },
  {
    question: "How do I update my teaching specialties?",
    answer: "Navigate to your Profile page and edit the 'Specialties' section. You can select from common yoga styles (Hatha, Vinyasa, Ashtanga, Yin, etc.) or add custom specialties. Your specialties help students find you in the directory.",
    category: "Teacher",
    status: "published"
  },

  // --- School (4) ---
  {
    question: "How do I register my yoga school with GOYA?",
    answer: "School registration is available for Professional and Premium members. Go to Schools > Register School in the member portal. Provide your school name, location, programs offered, and contact details. School listings are reviewed and approved within 48 hours.",
    category: "School",
    status: "published"
  },
  {
    question: "Can I manage multiple yoga school locations?",
    answer: "Yes, you can register multiple school locations under a single GOYA account. Each location gets its own listing in the school directory with separate contact details and program offerings.",
    category: "School",
    status: "published"
  },
  {
    question: "How do students find my yoga school on GOYA?",
    answer: "Your school appears in the GOYA School Directory, searchable by location, programs offered, and yoga styles. Ensure your school profile is complete with accurate details, photos, and program descriptions for better visibility.",
    category: "School",
    status: "published"
  },
  {
    question: "Can I post teacher training programs through my school listing?",
    answer: "Absolutely! Schools can list their teacher training programs (YTT 200, YTT 500, etc.) with details including curriculum, schedule, pricing, and certification outcomes. These appear both on your school page and in the events calendar.",
    category: "School",
    status: "published"
  },

  // --- Credit Hours (3) ---
  {
    question: "What are GOYA credit hours?",
    answer: "GOYA credit hours track your continuing education and professional development. You earn credits by attending approved workshops, trainings, and events. Credit hours help maintain your certifications and demonstrate your commitment to ongoing learning.",
    category: "Credit Hours",
    status: "published"
  },
  {
    question: "How do I log my continuing education credit hours?",
    answer: "Go to Credit Hours in the member portal. Click 'Log Hours' and enter the event name, provider, date, and number of hours. Attach any certificates of completion. Hours from GOYA-hosted events are logged automatically.",
    category: "Credit Hours",
    status: "published"
  },
  {
    question: "How many credit hours do I need annually?",
    answer: "GOYA recommends a minimum of 30 continuing education hours per year to maintain an active professional standing. Requirements may vary based on your certification level. Check your certification body's specific requirements for exact numbers.",
    category: "Credit Hours",
    status: "published"
  },

  // --- Technical (3) ---
  {
    question: "I forgot my password. How do I reset it?",
    answer: "Click 'Forgot Password' on the login page and enter your registered email address. You'll receive a password reset link within a few minutes. Check your spam folder if you don't see it. The link expires after 24 hours.",
    category: "Technical",
    status: "published"
  },
  {
    question: "Why can't I access the member portal?",
    answer: "Common access issues include: expired membership (check your subscription status), browser cache (try clearing cookies or using incognito mode), or temporary maintenance (check our status page). If none of these resolve the issue, contact support with your MRN.",
    category: "Technical",
    status: "published"
  },
  {
    question: "How do I update my email address or personal information?",
    answer: "Go to Settings > Profile in the member portal. You can update your name, email, phone number, and other personal details. Email changes require verification through a confirmation link sent to your new email address.",
    category: "Technical",
    status: "published"
  },

  // --- Community (3) ---
  {
    question: "How do I participate in the GOYA community feed?",
    answer: "The community Feed is accessible from the main navigation. You can create posts, share updates, comment on others' posts, and react to content. Share your teaching experiences, ask questions, or celebrate milestones with fellow GOYA members.",
    category: "Community",
    status: "published"
  },
  {
    question: "How do I find and attend GOYA events?",
    answer: "Browse upcoming events in the Events section. Filter by date, location, type, or yoga style. Click on any event for details and registration. GOYA members often receive discounted rates for community events.",
    category: "Community",
    status: "published"
  },
  {
    question: "Can I message other GOYA members directly?",
    answer: "Yes, connected members can exchange direct messages through the GOYA messaging system. Go to a member's profile and click 'Message' to start a conversation. You must be connected with a member before messaging them.",
    category: "Community",
    status: "published"
  },

  // --- General (3) ---
  {
    question: "What is GOYA?",
    answer: "GOYA (Global Online Yoga Association) is a professional platform for yoga teachers, schools, and practitioners worldwide. We provide membership management, credential tracking, continuing education logging, community networking, and a directory connecting yoga professionals globally.",
    category: "General",
    status: "published"
  },
  {
    question: "How do I contact GOYA support?",
    answer: "You can reach GOYA support through this chat assistant (Mattea), by emailing support@globalonlineyogaassociation.org, or by submitting a support ticket through the Help section in the member portal. Our team typically responds within 24 hours.",
    category: "General",
    status: "published"
  },
  {
    question: "Is my personal data safe with GOYA?",
    answer: "Yes, GOYA takes data security seriously. We use industry-standard encryption for all data in transit and at rest. Our platform is built on secure infrastructure with regular security audits. We never sell or share your personal data with third parties. Review our Privacy Policy for full details.",
    category: "General",
    status: "published"
  }
]

async function main() {
  console.log(`Seeding ${faqs.length} FAQ entries...`)

  const { data, error } = await supabase
    .from('faq_items')
    .insert(faqs)
    .select('id, question, category')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Successfully seeded ${data.length} FAQ entries:`)
  const byCategory: Record<string, number> = {}
  for (const row of data) {
    byCategory[row.category ?? 'Uncategorized'] = (byCategory[row.category ?? 'Uncategorized'] ?? 0) + 1
  }
  for (const [cat, count] of Object.entries(byCategory).sort()) {
    console.log(`  ${cat}: ${count}`)
  }
}

main()
