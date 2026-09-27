import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PublicMenu from "./pages/PublicMenu";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FFFBF5] px-6 text-center">
      <h1 className="font-display text-2xl font-bold text-neutral-800">
        Carta digital
      </h1>
      <p className="text-sm text-neutral-500">
        Escanea el código QR de tu mesa para ver la carta de un restaurante.
      </p>
      <div className="mt-4 flex gap-3 text-sm">
        <Link to="/panel" className="underline">
          Panel del restaurante
        </Link>
        <Link to="/admin" className="underline">
          Panel de vendedor
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/panel" element={<OwnerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/:slug" element={<PublicMenu />} />
      </Routes>
    </BrowserRouter>
  );
}
