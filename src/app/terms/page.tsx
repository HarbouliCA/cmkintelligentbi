'use client';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <div className="prose max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using PLENYA BEAUTY, you accept and agree to be bound by the terms and conditions of this agreement.
        </p>
        <h2>2. Description of Service</h2>
        <p>
          PLENYA BEAUTY provides social media analytics and insights for Facebook business pages.
        </p>
        <h2>3. Facebook Integration</h2>
        <p>
          Our service integrates with Facebook to provide analytics. By using our service, you authorize us to access your Facebook data in accordance with Facebook's terms of service.
        </p>
        <h2>4. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us at: support@example.com
        </p>
      </div>
    </div>
  );
}
