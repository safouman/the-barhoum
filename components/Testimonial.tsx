import Image from "next/image";

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  image?: string;
}

export function Testimonial({ quote, name, role, image }: TestimonialProps) {
  return (
    <figure className="grid gap-sm rounded-md border border-border bg-surface p-sm">
      <blockquote className="text-quote italic whitespace-pre-line text-[1rem] leading-[1.6] md:text-[1.1rem]">
        {quote}
      </blockquote>
      <figcaption className="flex flex-wrap items-center gap-3 text-sm text-subtle">
        {image ? (
          <span className="relative block h-12 w-12 overflow-hidden rounded-full border border-border/60">
            <Image
              src={image}
              alt={`Portrait of ${name}`}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          </span>
        ) : null}
        <span className="font-semibold text-text">{name}</span>
        <span>{role}</span>
      </figcaption>
    </figure>
  );
}
