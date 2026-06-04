import { User } from 'lucide-react';

interface AuthorToggleProps {
  value: 'me' | 'partner';
  onChange: (value: 'me' | 'partner') => void;
  myName: string;
  partnerName: string;
}

/** Shared toggle for selecting whether the current user is "me" or "partner". */
export default function AuthorToggle({ value, onChange, myName, partnerName }: AuthorToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-warm-cream rounded-xl">
      <button
        onClick={() => onChange('me')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
          value === 'me'
            ? 'bg-white shadow-sm text-pink'
            : 'text-text-muted'
        }`}
        aria-label={`以 ${myName} 的身份发布`}
      >
        <User size={14} />
        {myName}
      </button>
      <button
        onClick={() => onChange('partner')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
          value === 'partner'
            ? 'bg-white shadow-sm text-pink'
            : 'text-text-muted'
        }`}
        aria-label={`以 ${partnerName} 的身份发布`}
      >
        <User size={14} />
        {partnerName}
      </button>
    </div>
  );
}
