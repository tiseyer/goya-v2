export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-primary-dark pt-24 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-primary-200 text-lg">Last updated: March 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24">
        <div className="prose-custom space-y-10">

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Introduction</h2>
            <p className="text-slate-700 leading-relaxed">
              The Global Online Yoga Association (&ldquo;GOYA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to protecting your personal
              information. This Privacy Policy explains what data we collect, why we collect it, how it
              is used, and the choices you have regarding your information. By using the GOYA platform,
              you agree to the practices described in this policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Information We Collect</h2>
            <p className="text-slate-700 leading-relaxed">
              We collect information you provide directly when you register an account, complete your
              profile, or contact us. This includes your name, email address, professional role, location,
              biography, social media handles, and any other details you choose to add to your profile.
            </p>
            <p className="text-slate-700 leading-relaxed">
              We also collect usage data automatically — such as pages visited, features used, and
              interaction timestamps — to help us understand how the platform is being used and to
              improve the experience for all members. We use cookies and similar technologies for
              authentication and analytics.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">How We Use Your Information</h2>
            <p className="text-slate-700 leading-relaxed">
              Your information is used to operate and improve the GOYA platform, to personalise your
              experience, to send service-related communications (such as account notifications and
              policy updates), and to enable community features like the member directory and connection
              requests. We may also use anonymised, aggregated data for internal reporting and research.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Sharing of Information</h2>
            <p className="text-slate-700 leading-relaxed">
              We do not sell your personal information to third parties. We may share limited data with
              trusted service providers (such as hosting, payment processing, and analytics partners)
              only to the extent necessary to provide the platform. These providers are contractually
              obligated to handle your data securely and in accordance with applicable law.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Profile information you make public (such as your name, photo, bio, and professional
              designation) is visible to other GOYA members and, where applicable, to the general public.
              You control your visibility settings from your profile settings page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Data Retention</h2>
            <p className="text-slate-700 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide the
              service. If you close your account, we will delete or anonymise your personal data within
              a reasonable period, except where retention is required by law or legitimate business
              purposes (for example, transaction records).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Your Rights</h2>
            <p className="text-slate-700 leading-relaxed">
              Depending on your jurisdiction, you may have the right to access, correct, or delete your
              personal information, to object to or restrict certain processing, and to receive a copy
              of your data in a portable format. To exercise these rights, please contact us at
              privacy@globalonlineyogaassociation.org. We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Changes to This Policy</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or
              applicable law. When we make material changes, we will notify you by email or by posting
              a notice on the platform. Continued use of GOYA after changes are posted constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Contact Us</h2>
            <p className="text-slate-700 leading-relaxed">
              If you have questions about this Privacy Policy or your personal data, please contact us
              at <a href="mailto:privacy@globalonlineyogaassociation.org" className="text-primary-light hover:underline">privacy@globalonlineyogaassociation.org</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
