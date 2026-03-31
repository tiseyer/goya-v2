export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-primary-dark pt-24 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Code of Conduct</h1>
          <p className="text-primary-200 text-lg">Our shared commitment to a respectful and inclusive yoga community.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24">
        <div className="space-y-10">

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Introduction</h2>
            <p className="text-slate-700 leading-relaxed">
              GOYA brings together yoga teachers, students, schools, and wellness practitioners from
              around the world. To maintain a community that is welcoming, safe, and beneficial to
              everyone, all members are expected to uphold the values described in this Code of
              Conduct. This code applies to all interactions on the platform — including posts,
              comments, direct messages, events, and public profiles.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Membership in GOYA is a privilege, not a right. We reserve the right to remove any
              member who consistently fails to meet the standards set out here, regardless of their
              designation or standing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Respectful Communication</h2>
            <p className="text-slate-700 leading-relaxed">
              All members are expected to communicate with courtesy and respect, even when disagreeing.
              Personal attacks, derogatory language, trolling, or any form of harassment — whether
              public or private — will not be tolerated. This includes comments that demean a person
              based on their background, skill level, physical appearance, or personal beliefs.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Constructive critique is welcome. Cruelty is not. When offering feedback — on someone&rsquo;s
              teaching approach, a community post, or an event — please do so with the same care
              you would want for yourself.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Inclusivity and Non-Discrimination</h2>
            <p className="text-slate-700 leading-relaxed">
              GOYA is an inclusive community. Discrimination or exclusion based on race, ethnicity,
              national origin, religion, gender identity, sexual orientation, age, disability,
              socioeconomic status, or any other characteristic is strictly prohibited.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Yoga has roots across many cultures and traditions. Members are encouraged to approach
              diverse lineages and practices with humility and curiosity rather than judgment. Cultural
              appropriation, misrepresentation of traditions, or dismissal of other valid approaches
              to yoga are contrary to the spirit of this community.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Professional Standards for Teachers</h2>
            <p className="text-slate-700 leading-relaxed">
              Teachers listed on GOYA are expected to maintain the highest professional standards
              in their interactions with students. This includes maintaining appropriate physical
              and emotional boundaries, never exploiting a position of trust or authority, and
              ensuring that all teaching environments — physical or virtual — are safe and supportive.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Teachers must accurately represent their qualifications, training hours, and areas
              of expertise. Misrepresentation of credentials or designations is a serious violation
              and may result in immediate removal from the directory.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Reporting Violations</h2>
            <p className="text-slate-700 leading-relaxed">
              If you witness or experience behaviour that violates this Code of Conduct, we encourage
              you to report it. You can use the &ldquo;Report&rdquo; feature on any member profile or post, or
              contact our team directly at{' '}
              <a href="mailto:conduct@globalonlineyogaassociation.org" className="text-primary-light hover:underline">conduct@globalonlineyogaassociation.org</a>.
            </p>
            <p className="text-slate-700 leading-relaxed">
              All reports are treated with confidentiality. We will review every report and take
              appropriate action. Retaliation against anyone who submits a good-faith report is
              itself a violation of this Code.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Consequences</h2>
            <p className="text-slate-700 leading-relaxed">
              Violations of this Code of Conduct may result in a range of consequences depending
              on the severity and context of the behaviour. These range from a formal warning and
              removal of specific content, to temporary suspension or permanent removal from the
              GOYA platform and directory. In cases involving potential illegal activity, we may
              refer the matter to the appropriate authorities.
            </p>
            <p className="text-slate-700 leading-relaxed">
              GOYA&rsquo;s moderation team makes all final decisions regarding conduct violations.
              We are committed to applying these standards fairly and consistently across all
              members regardless of their role or designation level.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
