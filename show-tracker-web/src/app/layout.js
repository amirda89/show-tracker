import "./globals.css";
import { ClerkProvider, Show, SignIn, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

export const metadata = {
  title: "Show Tracker",
  description: "Personal show and episode tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#f4f4f8] text-[#14141c] dark:bg-[#0c0c12] dark:text-[#f2f2f7]">
        <ClerkProvider afterSignOutUrl="/">
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
              </div>
            }
          >
            <Show when="signed-out">
              <div className="flex min-h-screen w-full items-center justify-center p-4">
                <SignIn routing="hash" />
              </div>
            </Show>

            <Show when="signed-in">
              <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-[#f4f4f8]/80 backdrop-blur-md dark:border-gray-800/70 dark:bg-[#0c0c12]/80">
                <div className="mx-auto flex h-14 w-full max-w-[680px] items-center justify-between px-4">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Show Tracker
                  </span>
                  <UserButton />
                </div>
              </header>

              <div className="flex-1">{children}</div>
            </Show>
          </Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}
