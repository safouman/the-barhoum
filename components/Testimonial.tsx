interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
}

export function Testimonial({ quote, name, role }: TestimonialProps) {
  return (
    <figure className="grid gap-sm rounded-md border border-border bg-surface p-sm">
      <blockquote className="text-quote italic">{quote}</blockquote>
      <figcaption className="flex flex-wrap items-center gap-2 text-sm text-subtle">
        <span className="font-semibold text-text">{name}</span>
        <span>{role}</span>
      </figcaption>
    </figure>
  );
}
