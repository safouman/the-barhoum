import assert from "node:assert/strict";
import { test } from "node:test";
import { adjacentLessons, baseLessons, compareRevision, continuation, curriculumLessons, progressCount } from "../../lib/learning/progress/model.ts";

const free = { id: "1", title: "Free", access: "free" };
const locked = { id: "2", title: "Locked", access: "locked" };
const paid = { id: "3", title: "Paid", access: "unlocked" };
const premium = { id: "4", title: "Premium", access: "unlocked" };

test("counts distinct published placements and separates base and premium", () => {
    const curriculum = {
        type: "structured",
        parts: [{ modules: [
            { classification: "regular", lessons: [free, free, locked, paid] },
            { classification: "premium", lessons: [premium] },
        ] }],
    };
    assert.deepEqual(curriculumLessons(curriculum).map(lesson => lesson.id), ["1", "2", "3", "4"]);
    assert.deepEqual(progressCount(baseLessons(curriculum), new Set(["1", "4"])), { completed: 1, total: 3, percent: 33 });
    assert.deepEqual(progressCount([], new Set()), { completed: 0, total: 0, percent: null });
});

test("Continue skips revoked or unplaced visits, falls back safely and distinguishes Review", () => {
    const lessons = [free, locked, paid];
    const visit = (lesson_id, last_visited_at) => ({ lesson_id, last_visited_at });
    const rows = [visit(1, "2026-10-01"), visit(2, "2026-10-02"), visit(9, "2026-10-03")];
    const continueView = continuation("sample", lessons, rows, new Set(["1"]));
    assert.equal(continueView.continueState, "continue");
    assert.equal(continueView.continueTarget.lessonId, 1);
    const first = continuation("sample", lessons, [], new Set(["1"]));
    assert.equal(first.continueState, "start");
    assert.equal(first.continueTarget.lessonId, 3);
    assert.equal(continuation("sample", lessons, rows, new Set(["1", "3"])).continueState, "review");
    assert.equal(continuation("sample", [locked], rows, new Set()).continueTarget, null);
});

test("adjacent targets skip locked lessons and the next unfinished action wraps once", () => {
    const targets = adjacentLessons("sample", [free, locked, paid], "3", new Set(["3"]));
    assert.equal(targets.previousLesson.lessonId, 1);
    assert.equal(targets.nextLesson, null);
    assert.equal(targets.nextUnfinishedLesson.lessonId, 1);
    assert.equal(adjacentLessons("sample", [free, locked, paid], "3", new Set(["1", "3"])).nextUnfinishedLesson, null);
});

test("revision writes allow backward seek, acknowledge immediate replay and reject stale changes", () => {
    assert.equal(compareRevision(30, 15, 2, 2), "write");
    assert.equal(compareRevision(15, 15, 3, 2), "unchanged");
    assert.equal(compareRevision(15, 30, 3, 2), "conflict");
    assert.equal(compareRevision(15, 15, 3, 1), "conflict");
    assert.equal(compareRevision(false, false, 0, 0), "unchanged");
});
