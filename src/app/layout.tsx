import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { TutorDock } from "@/components/tutor/TutorDock";
import { RunnerWarmup } from "@/components/mission/RunnerWarmup";

const chakra = Chakra_Petch({ variable: "--font-chakra", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600"] });
const jet = JetBrains_Mono({ variable: "--font-jet", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Pyterra",
  description: "Build worlds. Learn Python. Create what's next.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${chakra.variable} ${plex.variable} ${jet.variable} h-full`}>
      <body className="min-h-full">
        <div className="atmosphere" aria-hidden />
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1 px-6 pb-16 pt-4 md:px-8">{children}</main>
          </div>
        </div>
        <TutorDock />
        <RunnerWarmup />
      </body>
    </html>
  );
}
