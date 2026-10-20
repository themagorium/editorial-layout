import { describe, it, expect } from "vitest";
import { previousDayBackup, lastPublishedPerDay, dayInTimeZone } from "../../api/content";

const b = (id: string, createdAt: string, kind: "published" | "safety" = "published") =>
  ({ id, createdAt, reason: id, kind, editions: [], stories: 1 });

describe("Restore Backup -> last published version of the previous day", () => {
  const backups = [
    b("today-late", "2026-10-20T20:00:00Z"),
    b("today-early", "2026-10-20T09:00:00Z"),
    b("yday-safety", "2026-10-19T23:30:00Z", "safety"),
    b("yday-last", "2026-10-19T22:00:00Z"),
    b("yday-first", "2026-10-19T08:00:00Z"),
    b("older", "2026-10-17T12:00:00Z"),
  ];

  it("picks yesterday's LAST published version, never today's or a safety copy", () => {
    expect(previousDayBackup(backups, "UTC", new Date("2026-10-20T21:00:00Z"))?.id).toBe("yday-last");
  });

  it("uses the editor's time zone for the day boundary", () => {
    // 2026-10-20T03:00Z is still Oct 19 in Los Angeles, so "today" there is the 19th.
    const now = new Date("2026-10-20T03:00:00Z");
    expect(dayInTimeZone(now, "America/Los_Angeles")).toBe("2026-10-19");
    expect(previousDayBackup(backups, "America/Los_Angeles", now)?.id).toBe("older");
  });

  it("falls back to the most recent earlier day when yesterday had no publish", () => {
    expect(previousDayBackup(backups, "UTC", new Date("2026-10-19T10:00:00Z"))?.id).toBe("older");
  });

  it("returns null when nothing was published before today", () => {
    expect(previousDayBackup([b("t", "2026-10-20T01:00:00Z")], "UTC", new Date("2026-10-20T05:00:00Z"))).toBeNull();
  });

  it("keeps one last-published entry per day", () => {
    expect(lastPublishedPerDay(backups, "UTC").map((x) => x.id)).toEqual(["today-late", "yday-last", "older"]);
  });
});
