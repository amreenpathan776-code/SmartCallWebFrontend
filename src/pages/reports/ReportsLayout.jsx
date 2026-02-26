import { Outlet } from "react-router-dom";

const ReportsLayout = () => {
  return (
    <main className="flex-1 bg-slate-100 overflow-hidden">
      <Outlet />
    </main>
  );
};

export default ReportsLayout;
