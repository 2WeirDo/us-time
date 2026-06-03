import DaysCounter from './DaysCounter';
import CountdownCard from './CountdownCard';
import MoodBubble from './MoodBubble';

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Days counter - full width on mobile */}
      <div className="col-span-2">
        <DaysCounter />
      </div>
      {/* Countdown */}
      <CountdownCard />
      {/* Mood */}
      <MoodBubble />
    </div>
  );
}
