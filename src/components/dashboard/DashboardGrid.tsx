import DaysCounter from './DaysCounter';
import CountdownCard from './CountdownCard';
import MoodBubble from './MoodBubble';
import PetCard from '../pet/PetCard';

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Days counter - full width on mobile */}
      <div className="col-span-2">
        <DaysCounter />
      </div>
      {/* Pet */}
      <div className="col-span-2">
        <PetCard />
      </div>
      {/* Countdown */}
      <CountdownCard />
      {/* Mood */}
      <MoodBubble />
    </div>
  );
}
