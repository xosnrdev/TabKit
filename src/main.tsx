import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { TabProvider } from "./index.ts";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<TabProvider>
			<App />
		</TabProvider>
	</StrictMode>,
);
