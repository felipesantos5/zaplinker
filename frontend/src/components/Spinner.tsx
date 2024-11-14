export const Spinner = ({ size = 10 }) => (
  <div className="flex justify-center items-center">
    <div
      className={`spinner w-${size} h-${size}`}
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`
      }}
    ></div>
  </div>
);