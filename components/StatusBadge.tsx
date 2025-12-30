type GoalStatus =
  | "not_started"
  | "in_progress"
  | "on_track"
  | "off_track"
  | "completed";
type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "off_track";

interface StatusBadgeProps {
  status: GoalStatus | MilestoneStatus;
}

const statusConfig: Record<
  GoalStatus | MilestoneStatus,
  { label: string; className: string }
> = {
  not_started: {
    label: "Not Started",
    className: "bg-gray-100 text-gray-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700",
  },
  on_track: {
    label: "On Track",
    className: "bg-green-100 text-green-700",
  },
  off_track: {
    label: "Off Track",
    className: "bg-red-100 text-red-700",
  },
  completed: {
    label: "Completed",
    className: "bg-purple-100 text-purple-700",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
