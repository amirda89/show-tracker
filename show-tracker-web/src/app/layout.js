import "./globals.css";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  SignIn,
} from "@clerk/nextjs";
import { Suspense } from "react";

export const metadata = {
  title: "Show Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <Suspense>
            <Show when="signed-out">
              <div className="w-full h-screen flex justify-center items-center">
                <SignIn />
              </div>
            </Show>
            <Show when="signed-in">
              <header className="flex justify-end items-center p-4 gap-4 h-16">
                <UserButton />
              </header>
              {children}
            </Show>
          </Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}
