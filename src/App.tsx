import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Guessing from "./pages/Guessing";
import Writing from "./pages/Writing";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> | <Link to="/guessing">Guessing</Link> | <Link to="/writing">Writing</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guessing" element={<Guessing />} />
        <Route path="/writing" element={<Writing />} />
      </Routes>
    </Router>
  );
}

export default App;
