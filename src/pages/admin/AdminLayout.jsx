import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <main className="flex-1 p-6 bg-slate-100">
      <Outlet />
    </main>
  );
};

export default AdminLayout;
