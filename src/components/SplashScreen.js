


const SplashScreen = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4">
          {/* Logo del camión */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9.75V8a2 2 0 012-2h8a2 2 0 012 2v1.75M5.5 17.25h13a2 2 0 002-2V10H3v5.25a2 2 0 002 2zM7.5 17.25h3m5 0h2m-10.5-4h4m4 0h1m1 0h2"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-light text-gray-700">Bisonte</h1>
        {/* Sutil animación */}
        <div className="mt-4 flex justify-center">
          <div className="h-2 w-2 rounded-full bg-gray-700 animate-bounce"></div>
          <div className="ml-2 h-2 w-2 rounded-full bg-gray-700 animate-bounce delay-100"></div>
          <div className="ml-2 h-2 w-2 rounded-full bg-gray-700 animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
