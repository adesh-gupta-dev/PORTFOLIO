import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import { PortfolioProvider } from "./lib/portfolio-context";
const Admin = lazy(() => import("./pages/Admin"));

const App = () => {
  const isAdmin =
    typeof window !== "undefined" &&
    /^\/admin\/?$/.test(window.location.pathname);
  return isAdmin ? (
    <Suspense fallback={<main className="admin-loading">Loading editor…</main>}>
      <Admin />
    </Suspense>
  ) : (
    <PortfolioProvider>
      <Index />
    </PortfolioProvider>
  );
};

export default App;
