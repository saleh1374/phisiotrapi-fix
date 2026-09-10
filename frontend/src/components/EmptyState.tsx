interface Props {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "🌱", title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy/20 bg-cream px-6 py-12 text-center">
      <div className="text-6xl">{icon}</div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-7 text-navy/60">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}