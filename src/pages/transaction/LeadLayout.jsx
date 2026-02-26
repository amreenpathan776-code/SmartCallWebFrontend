import { Outlet } from "react-router-dom";

const LeadLayout = () => {
  return (
    <main className="flex-1 w-full min-h-screen p-6 bg-slate-100">
      <Outlet />
    </main>
  );
};

export default LeadLayout;
