const AccessRestricted = () => {
  return (
    <div className="flex items-center justify-center h-[75vh] w-full">
      <div className="bg-white shadow-lg rounded-xl p-10 text-center w-[70%]">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">
          Access Restricted
        </h2>
        <p className="text-slate-600 text-lg">
          Please Contact Admin to access this Page.
        </p>
      </div>
    </div>
  );
};

export default AccessRestricted;