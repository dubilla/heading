import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account and preferences.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Name
              </label>
              <p className="mt-1 text-gray-900">
                {session?.user?.name || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Email
              </label>
              <p className="mt-1 text-gray-900">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Check-in Preferences
          </h2>
          <p className="text-gray-600 text-sm">
            Weekly check-in reminders are sent every Sunday. More customization
            options coming soon.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Actions
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Need to export your data or delete your account? Contact support.
          </p>
          <a
            href="mailto:support@example.com"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
}
