export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-primary-dark pt-24 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Terms of Use</h1>
          <p className="text-primary-200 text-lg">Last updated: March 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24">
        <div className="space-y-10">

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Acceptance of Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              By accessing or using the GOYA platform (&ldquo;the Service&rdquo;), you agree to be bound by
              these Terms of Use. If you do not agree to all of these terms, you may not access or
              use the Service. These terms apply to all visitors, members, and other users of the
              platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Use of the Platform</h2>
            <p className="text-slate-700 leading-relaxed">
              You agree to use the Service only for lawful purposes and in a manner consistent with
              all applicable laws and regulations. You must not use the platform to harass, threaten,
              or harm other users; to post spam, misleading content, or material that infringes on
              the rights of others; or to attempt to gain unauthorised access to any part of the
              Service or its underlying systems.
            </p>
            <p className="text-slate-700 leading-relaxed">
              You are solely responsible for maintaining the security of your account credentials.
              You agree to notify GOYA immediately of any unauthorised use of your account. GOYA
              is not liable for any loss or damage arising from your failure to keep your credentials
              secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">User Content</h2>
            <p className="text-slate-700 leading-relaxed">
              You retain ownership of any content you post on GOYA. By posting content, you grant
              GOYA a non-exclusive, royalty-free licence to display and distribute that content within
              the platform. You represent that you have all necessary rights to the content you post
              and that it does not violate any third-party rights or applicable law.
            </p>
            <p className="text-slate-700 leading-relaxed">
              GOYA reserves the right to remove any content that violates these Terms or our
              Community Guidelines without prior notice. Repeated violations may result in account
              suspension or termination.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Intellectual Property</h2>
            <p className="text-slate-700 leading-relaxed">
              All platform design, code, branding, and original content created by GOYA is protected
              by copyright and other intellectual property laws. You may not reproduce, distribute,
              or create derivative works from GOYA&rsquo;s proprietary content without prior written
              permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Disclaimers and Limitation of Liability</h2>
            <p className="text-slate-700 leading-relaxed">
              The Service is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis without warranties of
              any kind, express or implied. GOYA does not warrant that the Service will be
              uninterrupted, error-free, or free of harmful components.
            </p>
            <p className="text-slate-700 leading-relaxed">
              To the fullest extent permitted by law, GOYA shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of or inability
              to use the Service, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Changes to These Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              GOYA reserves the right to modify these Terms of Use at any time. We will provide
              notice of material changes by email or by posting a prominent notice on the platform.
              Your continued use of the Service after changes are posted constitutes your acceptance
              of the revised terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary-dark">Contact</h2>
            <p className="text-slate-700 leading-relaxed">
              For questions about these Terms of Use, please contact us at{' '}
              <a href="mailto:legal@globalonlineyogaassociation.org" className="text-primary-light hover:underline">legal@globalonlineyogaassociation.org</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
