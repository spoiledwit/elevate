import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Elevate.Social',
  description: 'Terms and Conditions for using Elevate.Social platform',
}

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600 mb-8">Effective Date: January 1, 2025</p>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Welcome to Elevate.Social ("we," "our," "us"). By accessing or using our platform, you agree to the following Terms & Conditions. Please read carefully before using our services.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Use of Services</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You must be at least 18 years old to use Elevate.Social.</li>
                <li>You agree to use the platform for lawful purposes only.</li>
                <li>We reserve the right to suspend or terminate accounts for misuse, violation of these terms, or fraudulent activity.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Accounts & Access</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>You are responsible for all activity that occurs under your account.</li>
                <li>Sharing or reselling access to Elevate.Social without authorization is strictly prohibited.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payments & Subscriptions</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Subscriptions are billed on a recurring basis (monthly or annually, depending on your selection).</li>
                <li>By subscribing, you authorize Elevate.Social to automatically charge your payment method.</li>
                <li>Failed payments may result in suspension of services.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Content & Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>All content, features, and technology on Elevate.Social are owned by us or our licensors.</li>
                <li>You may not copy, reproduce, or distribute our materials without permission.</li>
                <li>You retain ownership of content you upload but grant us a license to display and store it as part of providing our services.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Elevate.Social is provided "as is" without warranties of any kind.</li>
                <li>We are not responsible for any business losses, missed opportunities, or damages arising from use of our platform.</li>
                <li>Results vary depending on your effort, strategy, and implementation. No guarantees of income are made.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Changes to Terms</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We may update these Terms at any time. Changes will be posted on this page and become effective immediately.</li>
                <li>Continued use of Elevate.Social after updates means you accept the new Terms.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
              <p className="text-gray-700">
                Questions about these Terms can be sent to:{' '}
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
