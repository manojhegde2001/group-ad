import { LogoLoader } from "@/components/ui/logo-loader";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center animate-in fade-in duration-700">
        <LogoLoader size={80} className="mb-4" />
        <p className="text-secondary-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
          Vrutta
        </p>
      </div>
    </div>
  );
}
