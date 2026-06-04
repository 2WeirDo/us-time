import PhotoWall from '../components/photos/PhotoWall';

export default function PhotoWallPage() {
  return (
    <div className="pb-24 animate-fade-in">
      <h2 className="font-display text-lg font-bold text-text-primary mb-4">
        🖼️ 照片墙
      </h2>
      <PhotoWall />
    </div>
  );
}
