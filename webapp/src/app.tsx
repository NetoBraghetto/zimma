import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
// import { DndProvider } from "react-dnd";
// import { HTML5Backend } from "react-dnd-html5-backend";
import { AppLoading } from "@/components/app-loading";
import { type AuthContext, useAuth } from "./hooks/use-auth";
import { routeTree } from "./routeTree.gen";
import Config from "./services/config-service";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export type AppContext = { queryClient: QueryClient; auth: AuthContext };

const router = createRouter({
  routeTree,
  context: {
    appConfig: Config,
    queryClient,
    auth: {
      user: false,
      isRequesting: false,
      isAuthenticated: false,
    },
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  stringifySearch: (s) => {
    const params = new URLSearchParams(s).toString();
    return params.length ? `?${decodeURIComponent(params.toString())}` : "";
    // return `?${params.toString()}`;
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const auth = useAuth();

  if (auth.isRequesting) {
    return <AppLoading />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* <DndProvider backend={HTML5Backend}> */}
      <RouterProvider router={router} context={{ queryClient, auth }} />
      {/* </DndProvider> */}
    </QueryClientProvider>
  );
}

export default App;
