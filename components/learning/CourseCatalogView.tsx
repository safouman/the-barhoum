import { Container } from "@/components/Container";
import type { CourseCommerce } from "@/components/commerce/checkout";
import type { CourseSummary } from "@/lib/learning/contracts";
import { CourseCard } from "./CourseCard";

export function CourseCatalogView({ entries }: {
  entries: Array<{ course: CourseSummary; commerce?: CourseCommerce }>;
}) {
  return (
    <div dir="rtl" lang="ar" className="bg-[#fcfdfc] text-text">
      <section className="border-b border-border bg-[#f2f8f6] py-10 sm:py-14">
        <Container className="space-y-3">
          <p className="text-sm font-semibold text-[#12685f]">تعلّم مع برهوم</p>
          <h1 className="text-display leading-tight">الدورات</h1>
          <p className="text-lead max-w-[56ch]">تصفّح الدورات، تعرّف على محاورها وابدأ بدرس مجاني.</p>
        </Container>
      </section>
      <Container className="py-8 sm:py-10">
        {entries.length ? (
          <ul role="list" aria-label="الدورات المتاحة" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(({ course, commerce }) => (
              <li key={course.slug} className="min-w-0">
                <CourseCard course={course} commerce={commerce} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-subtle">لا توجد دورات متاحة الآن. تفقّد هذه الصفحة لاحقًا.</p>
        )}
      </Container>
    </div>
  );
}
