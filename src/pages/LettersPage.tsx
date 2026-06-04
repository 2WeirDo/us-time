import LetterInbox from '../components/letters/LetterInbox';

export default function LettersPage() {
  return (
    <div className="pb-24 animate-fade-in">
      <h2 className="font-display text-lg font-bold text-text-primary mb-1">
        ✉️ 书信
      </h2>
      <p className="text-xs text-text-muted/50 mb-4">
        用手写的方式，传递最真挚的情感
      </p>
      <LetterInbox />
    </div>
  );
}
