import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, MapPin } from 'lucide-react';
import BucketListView from '../components/bucket-list/BucketListView';
import FootprintList from '../components/footprints/FootprintList';

type ExploreTab = 'bucket-list' | 'footprint';

const TABS: { key: ExploreTab; label: string; icon: typeof ListTodo }[] = [
  { key: 'bucket-list', label: '情侣清单', icon: ListTodo },
  { key: 'footprint', label: '足迹地图', icon: MapPin },
];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<ExploreTab>('bucket-list');

  return (
    <motion.div
      className="pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="font-display text-lg font-bold text-text-primary mb-4">
        🗺️ 发现
      </h2>

      {/* Tab switcher */}
      <div className="flex bg-warm-cream rounded-2xl p-1 mb-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white shadow-sm text-pink'
                : 'text-text-muted/60 hover:text-text-muted'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'bucket-list' && <BucketListView />}
          {activeTab === 'footprint' && <FootprintList />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
