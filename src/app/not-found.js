import Link from "next/link";

export const metadata = { title: "Off the map — RayMindset" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[1440px] flex-col justify-center px-4 md:px-8">
      <h1 className="font-display text-[clamp(56px,9vw,150px)] font-extrabold uppercase leading-[0.86] tracking-[-0.02em]">
        Off the map.
      </h1>
      <p className="mt-8 max-w-[40ch] text-[20px] leading-[1.5]">
        There&apos;s no station at this address. The line may not be built yet.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex min-h-14 w-fit items-center bg-paper px-8 text-[17px] font-semibold text-ground transition-transform duration-200 hover:-translate-y-0.5"
      >
        Back to the map
      </Link>
    </main>
  );
}
