export const Spinner = ({ size = 10 }) => (
  <div className="flex justify-center items-center">
    <div
      className={`spinner w-${size} h-${size} dark:border-white dark:border-t-4 dark:border-t-zinc-300`}
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`
      }}
    ></div>
  </div>
);