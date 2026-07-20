
export const Loading = () => {
  return (
    <div
      className="flex flex-col justify-center items-center min-h-[400px] gap-4"
      aria-label="読み込み中"
    >
      <div className="animate-spin h-20 w-20 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      <span className="text-gray-600 text-lg">読み込み中...</span>
    </div>
  );
};
