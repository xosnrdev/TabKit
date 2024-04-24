/**
 * @module
 * @description
 * Entry point for the TabKit library.
 */

/**
 * Tab provider component.
 * @public
 */
export { default as TabProvider } from "./TabProvider";

/**
 * Custom hooks for interacting with the tab state.
 * @public
 */
export { useActiveTab, useAppDispatch, useAppSelector, useTab } from "./hooks";

/**
 * Root state type of the Redux store.
 * @public
 */
export type { RootState } from "./context/rootReducer";

/**
 * @internal
 */
export { default as rootReducer } from "./context/rootReducer";

/**
 * Redux store and persistor instances.
 * @internal
 */
export { persistor, store } from "./context/store";

/**
 * Dispatch type of the Redux store.
 * @public
 */
export type { AppDispatch } from "./context/store";

/**
 * Action creators for modifying the tab state.
 * @public
 */
export {
	/**
	 * @public
	 */
	addTab,
	/**
	 * @public
	 */
	closeAllTabs,
	/**
	 * @public
	 */
	moveTab,
	/**
	 * @public
	 */
	removeTab,
	/**
	 * @public
	 */
	setActiveTab,
	/**
	 * @public
	 */
	switchTab,
	/**
	 * @public
	 */
	updateTab,
	/**
	 * @internal
	 */
	tabsSlice
} from "./context/service/tabSlice";

/**
 * TabSlice types for TabKit.
 * @internal
 */
export type { Tab, TabState, TabConfig } from "./context/service/tabSlice"

/**
 * Provider props type of the TabProvider.
 * @public
 */
export type { TabProviderProps } from "./TabProvider"
