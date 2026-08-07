type CheckCircleProps = {
  size?: number;
  className?: string;
};

export const CheckCircle = ({ size = 18, className = "" }: CheckCircleProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm4.44 9.77a.92.92 0 1 0-1.5-1.07l-3.98 5.58-2.46-2.46a.92.92 0 0 0-1.31 1.31l3.2 3.2a.92.92 0 0 0 1.4-.12l4.65-6.44Z"
      />
    </svg>
  );
};
