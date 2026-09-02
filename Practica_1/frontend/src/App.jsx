import { HashRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthNavbar from "./components/AuthNavbar";
import Login from "./views/Login";
import Register from "./views/Register";
import Gallery from "./views/Gallery";
import Playlist from "./views/Playlist";
import Profile from "./views/Profile";
import Home from "./views/Home";
import Support from "./views/Support";
import Footer from "./components/Footer";
import { NotificationProvider } from "./context/NotificationContext";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LayoutSelector() {
  const location = useLocation();
  const isPublicRoute = ["/", "/login", "/register", "/soporte"].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {isPublicRoute ? <Navbar /> : <AuthNavbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/soporte" element={<Support />} />
          
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/playlist" element={<ProtectedRoute><Playlist /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-transparent text-white font-sans">
          <LayoutSelector />
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
