import { getWeekEndDate } from "@/lib/utils/week-helpers";

export type WeekPlanGroups<T> = {
  overdue: T[];
  thisWeek: T[];
  undated: T[];
};

/**
 * Split open todos into the three buckets the weekly planning step triages:
 * overdue (needs rescheduling), due this week (already planned), and undated
 * (needs a decision). Completed todos and todos due beyond this week are not
 * part of planning the current week.
 */
export function groupTodosForWeekPlanning<
  T extends { dueDate: Date | null; completed: boolean },
>(todos: T[], now: Date = new Date()): WeekPlanGroups<T> {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekEnd = getWeekEndDate(now);

  const groups: WeekPlanGroups<T> = { overdue: [], thisWeek: [], undated: [] };

  for (const todo of todos) {
    if (todo.completed) continue;
    if (!todo.dueDate) {
      groups.undated.push(todo);
      continue;
    }
    const due = new Date(todo.dueDate);
    if (due < today) {
      groups.overdue.push(todo);
    } else if (due <= weekEnd) {
      groups.thisWeek.push(todo);
    }
  }

  return groups;
}
