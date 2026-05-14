import Image from "next/image";

export function OrderKoBrand({
  label = "OrderKo.com",
  className = "",
  imageClassName = "",
}: {
  label?: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/assets/orderko-hero-background.png"
        alt="OrderKo"
        width={72}
        height={72}
        className={`size-10 rounded-xl object-cover shadow-sm shadow-[#10201d]/10 ${imageClassName}`}
      />
      {label ? (
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          {label}
        </span>
      ) : null}
    </span>
  );
}
