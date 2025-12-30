import { AuthForm } from "@/components/AuthForm";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthForm mode="signin" />
      </Suspense>
    </main>
  );
}
