import Mascot from './Mascot';

// Temporary screen for tabs that are built in a later step.
export default function Placeholder({ title, text }) {
  return (
    <div className="main flex flex-col gap-4">
      <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
      <div className="rounded-[28px] bg-surface p-6 text-center">
        <div className="flex justify-center"><Mascot mood="neutral" size={96} /></div>
        <p className="mt-3 text-[15px] font-medium text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
