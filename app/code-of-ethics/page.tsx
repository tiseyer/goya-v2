import PageContainer from '@/app/components/ui/PageContainer'

export default function CodeOfEthicsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-primary-dark pt-24 pb-14">
        <PageContainer>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Code of Ethics</h1>
          <p className="text-primary-200 text-lg">The ethical principles that guide GOYA teachers and practitioners.</p>
        </PageContainer>
      </div>

      {/* Content */}
      <PageContainer className="py-14 pb-24">
        <div className="max-w-3xl mx-auto">
        <div className="space-y-10">

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Introduction</h2>
            <p className="text-slate-700 leading-relaxed">
              Teaching yoga is a position of trust. Students come to their teachers seeking guidance,
              healing, and growth — often at vulnerable moments in their lives. GOYA&rsquo;s Code of
              Ethics outlines the principles we expect all registered teachers and wellness
              practitioners to embody. These are not merely rules, but a framework for ethical
              practice that reflects the deeper values of yoga itself: ahimsa (non-harming),
              satya (truthfulness), and seva (service).
            </p>
            <p className="text-slate-700 leading-relaxed">
              Adherence to this Code is a condition of maintaining a teacher or practitioner listing
              on GOYA. We review all credible reports of ethical violations and act accordingly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Integrity in Teaching</h2>
            <p className="text-slate-700 leading-relaxed">
              Teachers must act with honesty and transparency in all aspects of their professional
              practice. This includes being clear about the style and level of class being offered,
              pricing and cancellation policies, and any potential contraindications for specific
              practices or techniques.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Teachers should not make unfounded medical claims about yoga, promise specific health
              outcomes, or present personal beliefs as universally applicable truths. Intellectual
              humility — acknowledging what you do not know — is itself an expression of integrity.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Student Safety and Boundaries</h2>
            <p className="text-slate-700 leading-relaxed">
              The physical and psychological safety of students is paramount. Teachers must obtain
              informed consent before offering hands-on adjustments, create environments where
              students feel comfortable declining touch, and never use physical contact as a means
              of control, discipline, or personal gratification.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Romantic or sexual relationships between teachers and current students are a serious
              ethical violation due to the inherent power imbalance. Teachers are also expected to
              maintain appropriate boundaries in digital communications and on social media.
              Exploitation of the teacher-student relationship in any form will result in removal
              from the GOYA directory.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Honest Representation of Credentials</h2>
            <p className="text-slate-700 leading-relaxed">
              Teachers must accurately represent their training hours, certifications, designations,
              and areas of specialisation at all times. This includes the name and accreditation
              status of the schools from which they trained.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Falsification or exaggeration of credentials is a fundamental breach of trust with
              prospective students and with the broader yoga community. GOYA verifies credentials
              where possible and will remove members found to be misrepresenting their qualifications.
              If your credentials change — for example, a certification lapses or a designation is
              revoked — you are obligated to update your profile promptly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Continuing Education Commitment</h2>
            <p className="text-slate-700 leading-relaxed">
              Ethical teaching requires ongoing learning. GOYA encourages all teachers to pursue
              continuing education in their primary discipline as well as in adjacent areas such as
              anatomy, trauma-informed practice, cultural history, and accessible teaching methodologies.
            </p>
            <p className="text-slate-700 leading-relaxed">
              GOYA&rsquo;s CE Hours system exists to recognise and encourage this commitment. Submitting
              fabricated or unearned CE credits is a violation of this Code and may result in
              suspension of your GOYA designation and membership.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Accountability</h2>
            <p className="text-slate-700 leading-relaxed">
              We all make mistakes. Ethical practitioners acknowledge errors, apologise genuinely,
              make amends where possible, and take concrete steps to prevent recurrence. Defensiveness,
              deflection, or minimisation when facing a valid concern from a student is contrary
              to the values of this community.
            </p>
            <p className="text-slate-700 leading-relaxed">
              GOYA provides a confidential channel for reporting ethical concerns about teachers
              or practitioners. Reports can be submitted to{' '}
              <a href="mailto:ethics@globalonlineyogaassociation.org" className="text-primary-light hover:underline">ethics@globalonlineyogaassociation.org</a>.
              All reports are reviewed by our Ethics Committee and responded to within 14 business days.
            </p>
          </section>

        </div>
        </div>
      </PageContainer>
    </div>
  );
}
