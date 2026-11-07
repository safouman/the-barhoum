import Link from "next/link";
import type { Payload, TypedUser } from "payload";

export default function StudentProgressNav({ payload, user }: { payload: Payload; user?: TypedUser }) {
    if (user?.collection !== "admins") return null;

    return (
        <Link className="nav__link" href={`${payload.config.routes.admin}/student-progress`} prefetch={false}>
            <span className="nav__link-label">Student progress</span>
        </Link>
    );
}
