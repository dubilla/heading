import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db/users";
import { listTokensByUserId } from "@/lib/db/tokens";
import { Navbar } from "@/components/Navbar";
import {
  ProfileForm,
  CheckInDayForm,
  PasswordForm,
} from "@/components/SettingsForms";
import { TokensManager } from "@/components/TokensManager";
import { requestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const user = await getUserById(userId);
  const tokens = await listTokensByUserId(userId);
  const origin = await requestOrigin();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={user?.name ?? session?.user?.name} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account and preferences.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <ProfileForm
            initialName={user?.name ?? ""}
            email={user?.email ?? session?.user?.email ?? ""}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Check-in Preferences
          </h2>
          <CheckInDayForm initialDay={user?.checkInDay ?? 0} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Password</h2>
          <PasswordForm hasPassword={!!user?.password} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Access Tokens
          </h2>
          <TokensManager initialTokens={tokens} origin={origin} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Actions
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Need to export your data or delete your account? Email support and
            we&apos;ll take care of it.
          </p>
          <a
            href="mailto:dan.ubilla@gmail.com?subject=Heading%20support"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
}
