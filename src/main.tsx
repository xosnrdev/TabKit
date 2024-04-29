import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { TabProvider } from "./index.ts";
import "./index.css";
import React from "react";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<TabProvider>
			<App />
		</TabProvider>
	</StrictMode>,
);
