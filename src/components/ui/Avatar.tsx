type AvatarProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
};

export const Avatar = ({ src, alt, size = 24, className = "" }: AvatarProps) => {
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white text-sm font-medium ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full rounded-full border border-gray-300 bg-white"
      />
    </div>
  );
};
