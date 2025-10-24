import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Elevate.Social',
  description: 'Privacy Policy for Elevate.Social platform',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-[#bea456] hover:text-[#af9442ff] transition-colors">
            Elevate.Social
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Effective Date: January 1, 2025</p>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              At Elevate.Social ("we," "our," "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-3">We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Name, email address, username, and password when you create an account.</li>
                <li><strong>Payment Information:</strong> Billing details and payment method information processed securely through our payment processors.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited, features used, and time spent on the platform.</li>
                <li><strong>Content You Upload:</strong> Any media, text, or other content you create or upload to Elevate.Social.</li>
                <li><strong>Communication Data:</strong> Messages you send through our platform or to our support team.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide and maintain our services</li>
                <li>Process your payments and manage subscriptions</li>
                <li>Send you important updates, notifications, and promotional content (you can opt-out anytime)</li>
                <li>Improve our platform based on usage patterns and feedback</li>
                <li>Provide customer support</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Share Your Information</h2>
              <p className="text-gray-700 mb-3">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (e.g., payment processors, hosting services, email providers).</li>
                <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We use industry-standard security measures to protect your information.</li>
                <li>All payment information is encrypted and processed securely through trusted payment processors.</li>
                <li>While we take reasonable precautions, no method of transmission over the internet is 100% secure.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies & Tracking</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We use cookies and similar technologies to improve user experience and analyze platform usage.</li>
                <li>You can manage cookie preferences through your browser settings.</li>
                <li>Disabling cookies may affect your ability to use certain features.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-gray-700 mt-3">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:support@elevate.social" className="text-[#bea456] hover:text-[#af9442ff] underline">
                  support@elevate.social
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We retain your information for as long as your account is active or as needed to provide services.</li>
                <li>After account deletion, we may retain certain information for legal, tax, or regulatory purposes.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Links</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Our platform may contain links to third-party websites.</li>
                <li>We are not responsible for the privacy practices of external sites.</li>
                <li>We encourage you to review their privacy policies before sharing information.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Elevate.Social is not intended for users under the age of 18.</li>
                <li>We do not knowingly collect information from minors.</li>
                <li>If we discover that a minor has provided information, we will delete it promptly.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We may update this Privacy Policy from time to time.</li>
                <li>Changes will be posted on this page with an updated effective date.</li>
                <li>Continued use of Elevate.Social after changes means you accept the updated policy.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at:{' '}
                <a href="mailto:support@elevate.social" className="text-[#bea456] hover:text-[#af9442ff] underline">
                  support@elevate.social
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Elevate.Social. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
