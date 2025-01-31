import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        {/* Logo and Branding */}
        <div className="w-full max-w-md mb-8 text-center">
          <div className="mb-6 relative w-24 h-24 mx-auto">
            <Image
              src="/images/logoplenya.webp"
              alt="Plenya Beauty Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Plenya Beauty
          </h1>
          <p className="text-gray-600">
            Manage your social media analytics and insights all in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="w-full max-w-2xl mb-12 grid grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-3xl font-bold text-purple-600 mb-1">100+</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-3xl font-bold text-blue-600 mb-1">50K+</div>
            <div className="text-sm text-gray-600">Analytics Processed</div>
          </div>
        </div>

        {/* Auth Form Container */}
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
