// import { Routes, Route, Navigate } from "react-router-dom";
// import HomeLayout from "./pages/Home";

// import Dashboard from "./pages/Admin/Dashboard/Dashboard";
// import Users from "./pages/Admin/Users/Users";
// import Roles from "./pages/Admin/Roles/Roles";
// import Category from "./pages/Admin/Category/Category";
// import Customer from "./pages/Admin/Customer/Customer";
// import Sale from "./pages/Admin/Sales/Sale";
// import Pos from "./pages/POS/Pos";

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/home" element={<HomeLayout />}>
//         <Route index element={<Dashboard />} />

//         <Route path="sales" element={<Sale />} />

//         <Route path="customer" element={<Customer />} />
//         <Route path="users" element={<Users />} />
//         <Route path="roles" element={<Roles />} />
//         <Route path="categories" element={<Category />} />
//       </Route>

//       {/* Shared full-screen POS for Admin and Cashier */}
//       <Route path="/pos" element={<Pos />} />

//       <Route path="*" element={<Navigate to="/home" replace />} />
//     </Routes>
//   );
// }

import { Routes, Route } from "react-router-dom";

import HomeLayout from "./pages/Home";
import Login from "./pages/Login/Login";

import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import Users from "./pages/Admin/Users/Users";
import Roles from "./pages/Admin/Roles/Roles";
import Category from "./pages/Admin/Category/Category";
import Customer from "./pages/Admin/Customer/Customer";
import Sale from "./pages/Admin/Sales/Sale";
import Pos from "./pages/POS/Pos";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRedirect from "./components/RoleRedirect";
import Supplier from "./pages/Admin/Suppliers/Supplier";
import Products from "./pages/Admin/Products/Products";
import Inventory from "./pages/Admin/Inventory/Inventory";
import Purchases from "./pages/Admin/Purcheases/Purchases";
import ExchangeRate from "./pages/Admin/ExchangeRate/ExchangeRate";
import Report from "./pages/Admin/Reports/Report";
import Setting from "./pages/Admin/Settings/Setting";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<RoleRedirect />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sales" element={<Sale />} />
        <Route path="customer" element={<Customer />} />
        <Route path="users" element={<Users />} />
        <Route path="roles" element={<Roles />} />
        <Route path="categories" element={<Category />} />
        <Route path="suppliers" element={<Supplier/>}/>
        <Route path="products" element={<Products/>}/>
        <Route path="inventory" element={<Inventory/>}/>
        <Route path="purchases" element={<Purchases/>}/>
        <Route path="exchange-rate" element={<ExchangeRate/>} />
        <Route path="reports" element={<Report/>}/>
        <Route path="settings" element={<Setting/>}/>
      </Route>

      <Route
        path="/pos"
        element={
          <ProtectedRoute allowedRoles={["admin", "cashier"]}>
            <Pos />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}