import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
