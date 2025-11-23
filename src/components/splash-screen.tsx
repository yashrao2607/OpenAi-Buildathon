import Image from "next/image";

export const SplashScreen = () => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-4 text-primary">
        <Image 
          src="/favicon.ico" 
          alt="KishanBhai Logo" 
          width={64} 
          height={64} 
          className="animate-pulse" 
        />
        <span className="text-4xl font-bold font-headline">KishanBhai</span>
      </div>
      <p className="mt-4 text-muted-foreground">Initializing your dashboard...</p>
    </div>
  );
};
