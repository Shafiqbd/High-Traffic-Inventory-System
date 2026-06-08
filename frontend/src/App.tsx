import { useSelector } from "react-redux";
import Home from "./pages/Home";
import { LoginPage } from "./pages/LoginPage";
function App() {
const auth = useSelector((state: any) => state.auth);
  const { user } = auth;

  return user ? <Home /> : <LoginPage />;
}

export default App;
