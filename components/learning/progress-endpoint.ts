export function progressEndpoint(courseSlug: string, lessonId: string) {
  return `/api/learning/progress/${encodeURIComponent(courseSlug)}/${encodeURIComponent(lessonId)}`;
}
