export { default as TabProvider } from "./TabProvider";

export {
	TabError, addTab, closeAllTabs, persistor, removeTab, selectAllTabs,
	selectTabById, setActiveTab, store, switchTab, updateTab, useAppSelector, useTabContext
} from './context/api';
export type { AddTabPayload, AppDispatch, Tab, UpdateTabPayload, RootState } from "./context/api";

