import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AppNotificationProvider } from "./components/AppNotification";
import { ConfirmDialogProvider } from "./components/ConfirmDialog";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppNotificationProvider>
          <ConfirmDialogProvider>
            <App />
          </ConfirmDialogProvider>
        </AppNotificationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
