import TrekArt from "@/components/TrekArt";
import Logo from "@/components/Logo";

/** Split layout: pastel art panel on the left, form card on the right. */
export default function AuthShell({
  title,
  subtitle,
  tagline,
  seed,
  children,
}: {
  title: string;
  subtitle: string;
  tagline: string;
  seed: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page py-6 sm:py-10">
      <div className="grid overflow-hidden rounded-3xl border border-line bg-paper shadow-sm lg:grid-cols-2">
        <div className="relative hidden min-h-[560px] lg:block">
          <TrekArt seed={seed} snow className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-sage-900/70 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="text-3xl font-extrabold leading-tight">{tagline}</p>
            <p className="mt-2 text-sm text-white/85">Discover treks. Join a batch. Or host your own.</p>
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
