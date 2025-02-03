'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <div className="prose max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy describes how PLENYA BEAUTY ("we," "our," or "us") collects, uses, and shares your information when you use our service.
        </p>
        <h2>2. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us, including:
        </p>
        <ul>
          <li>Name and email address</li>
          <li>Facebook profile information when you connect your account</li>
        </ul>
        <h2>3. How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process and analyze your Facebook analytics data</li>
          <li>Communicate with you about our services</li>
        </ul>
        <h2>4. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at: support@example.com
        </p>
      </div>
    </div>
  );
}
