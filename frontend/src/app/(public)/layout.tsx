import { Navigation } from "@/components/Navigation";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <div className="relative z-10">{children}</div>
    </>
  );
}
