import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { apiRequest } from "./lib/queryClient";

// Set initial online status on load
const setInitialStatus = async () => {
  try {
    await apiRequest("POST", "/api/ping", null);
  } catch (error) {
    // Ignore errors here, user might not be logged in yet
  }
};

setInitialStatus();

// Set offline status when window is closed or navigated away from
window.addEventListener("beforeunload", async () => {
  try {
    await apiRequest("POST", "/api/logout", null);
  } catch (error) {
    // Ignore errors on unload
  }
});

createRoot(document.getElementById("root")!).render(<App />);
