/* eslint-disable @typescript-eslint/no-unused-vars */
import { PayloadAction, combineReducers, configureStore, createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PersistConfig, createTransform, persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

/**
 * Custom error class for tab-related errors.
 */
export class TabError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TabError";
	}
}

enum TabConfigOptions {
	Closable = "closable",
	Reorderable = "reorderable",
	Persist = "persist",
	MaxTabs = "maxTabs",
	MaxContentSize = "maxContentSize",
}

type TabConfig = {
	[key in TabConfigOptions]?: key extends TabConfigOptions.MaxTabs | TabConfigOptions.MaxContentSize ? number : boolean;
};

export interface Tab {
	readonly id: string;
	readonly title: string;
	readonly content: string;
	readonly isDirty: boolean;
	readonly config?: TabConfig;
}

type TabId = Tab["id"];

type AddTabPayload = Omit<Tab, "id" | "isDirty">;
type UpdateTabPayload = Partial<Tab> & { id: TabId };

interface TabState extends ReturnType<typeof tabsAdapter.getInitialState> {
	activeTabId: TabId | null;
}

// Default Configuration
const defaultConfig: TabConfig = {
	[TabConfigOptions.Closable]: true,
	[TabConfigOptions.Reorderable]: true,
	[TabConfigOptions.Persist]: false,
	[TabConfigOptions.MaxTabs]: 10,
	[TabConfigOptions.MaxContentSize]: 1000,
};

// Entity Adapter
const tabsAdapter = createEntityAdapter<Tab>({
	sortComparer: (a, b) => a.title.localeCompare(b.title),
});

// Initial State
const initialState: TabState = tabsAdapter.getInitialState({
	activeTabId: null,
});

/**
 * Generates a unique ID for a new tab.
 * @returns {string} A unique ID.
 */
function generateTabId(): string {
	// Generate a unique ID using crypto.getRandomValues
	const randomBytes = new Uint8Array(16);
	crypto.getRandomValues(randomBytes);
	const randomHex = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `tab-${randomHex}`;
}

// Tabs Slice
const tabsSlice = createSlice({
	name: "tabs",
	initialState,
	reducers: {
		/**
		 * Adds a new tab.
		 * @param {object} state - The current state.
		 * @param {object} action - The action object.
		 * @param {AddTabPayload} action.payload - The payload containing the tab data.
		 * @throws {TabError} If the maximum number of tabs is reached.
		 */
		addTab: (state, { payload }: PayloadAction<AddTabPayload>) => {
			const maxTabs = payload.config?.[TabConfigOptions.MaxTabs] ?? defaultConfig[TabConfigOptions.MaxTabs] ?? 10;

			if (state.ids.length >= maxTabs) {
				throw new TabError("Maximum number of tabs reached. Please close existing tabs before adding a new one.");
			}

			const maxContentSize = payload.config?.[TabConfigOptions.MaxContentSize] ?? defaultConfig[TabConfigOptions.MaxContentSize] ?? 1000;

			if (!payload.title || typeof payload.title !== "string") {
				throw new TabError("Invalid tab title. Title must be a non-empty string.");
			}

			if (typeof payload.content !== "string") {
				throw new TabError("Invalid tab content. Content must be a string.");
			}

			const newTab: Tab = {
				id: generateTabId(),
				...payload,
				content: payload.content.length <= maxContentSize ? payload.content : payload.content.substring(0, maxContentSize),
				isDirty: !!payload.content,
				config: { ...defaultConfig, ...(payload.config || {}) },
			};

			tabsAdapter.addOne(state, newTab);
			state.activeTabId = newTab.id;
		},

		/**
		 * Sets the active tab.
		 * @param {object} state - The current state.
		 * @param {object} action - The action object.
		 * @param {TabId} action.payload - The ID of the tab to set as active.
		 */
		setActiveTab: (state, { payload: tabId }: PayloadAction<TabId>) => {
			const tab = state.entities[tabId];
			if (tab && tab.config && tab.config.reorderable) {
				state.activeTabId = tabId;
			}
		},

		/**
		 * Removes a tab.
		 * @param {object} state - The current state.
		 * @param {object} action - The action object.
		 * @param {TabId} action.payload - The ID of the tab to remove.
		 */
		removeTab: (state, { payload: tabId }: PayloadAction<TabId>) => {
			if (state.entities[tabId]?.config?.closable) {
				const { ids } = state;
				const removedTabIndex = ids.indexOf(tabId);
				tabsAdapter.removeOne(state, tabId);

				if (state.activeTabId === tabId) {
					state.activeTabId = null;

					const idsLength = ids.length;
					let nextIndex: number | null = null;

					// Find the next reorderable tab on the right
					for (let i = removedTabIndex + 1; i < idsLength; i++) {
						const id = ids[i];
						if (state.entities[id]?.config?.reorderable) {
							nextIndex = i;
							break;
						}
					}

					// If no reorderable tab found on the right, find the next reorderable tab on the left
					if (nextIndex === null) {
						for (let i = removedTabIndex - 1; i >= 0; i--) {
							const id = ids[i];
							if (state.entities[id]?.config?.reorderable) {
								nextIndex = i;
								break;
							}
						}
					}

					// Set the active tab to the next reorderable tab, or null if none found
					state.activeTabId = nextIndex !== null ? ids[nextIndex] : null;
				}
			}
		},

		/**
		 * Switches to the next or previous tab.
		 * @param {object} state - The current state.
		 * @param {object} action - The action object.
		 * @param {"next" | "previous"} action.payload - The direction to switch the tab.
		 */
		switchTab: (state, { payload: direction }: PayloadAction<"next" | "previous">) => {
			const { activeTabId, entities, ids } = state;
			const currentIndex = ids.indexOf(activeTabId || "");

			if (currentIndex !== -1) {
				const length = ids.length;
				let newIndex = currentIndex;

				const increment = direction === "next" ? 1 : -1;
				// Find the next reorderable tab index
				for (let i = 1; i < length; i++) {
					newIndex = (currentIndex + increment * i + length) % length;
					if (entities[ids[newIndex]]?.config?.reorderable) {
						break;
					}
				}
				// Update activeTabId if the newIndex is different
				if (newIndex !== currentIndex) {
					state.activeTabId = ids[newIndex];
				}
			}
		},

		/**
		 * Closes all tabs.
		 * @param {object} state - The current state.
		 */
		closeAllTabs: (state) => {
			tabsAdapter.removeAll(state);
			state.activeTabId = null;
		},

		/**
		 * Updates a tab.
		 * @param {object} state - The current state.
		 * @param {object} action - The action object.
		 * @param {UpdateTabPayload} action.payload - The payload containing the updated tab data.
		 */
		updateTab: (state, { payload }: PayloadAction<UpdateTabPayload>) => {
			const { id, content, config } = payload;
			const tab = state.entities[id];

			if (tab) {
				const maxContentSize = config?.[TabConfigOptions.MaxContentSize] ?? tab.config?.[TabConfigOptions.MaxContentSize] ?? defaultConfig[TabConfigOptions.MaxContentSize] ?? 1000;
				const isDirty = content !== undefined ? (content.length <= maxContentSize ? content !== tab.content : tab.content.substring(0, maxContentSize) !== content.substring(0, maxContentSize)) : tab.isDirty;

				tabsAdapter.updateOne(state, {
					id,
					changes: {
						content: content !== undefined ? (content.length <= maxContentSize ? content : content.substring(0, maxContentSize)) : tab.content,
						isDirty,
					},
				});
			}
		},
	},
});

// Selectors
const {
	selectAll: selectAllTabs,
	selectById: selectTabById,
	//selectIds: selectTabIds,
} = tabsAdapter.getSelectors<RootState>(state => state.tabs);

// Actions
export const {
	addTab,
	setActiveTab,
	removeTab,
	switchTab,
	closeAllTabs,
	updateTab,
} = tabsSlice.actions;

const persistTabsTransform = createTransform(
	// Transform the inbound state
	(S: TabState, _k) => {
		let n = 0;
		const { entities, ids } = S;

		// Count the number of tabs to be persisted
		for (const id of ids) {
			const tab = entities[id];
			if (tab && tab.config?.persist) {
				n++;
			}
		}

		let p = 0; // Index for persisted tabs
		const q = new Array(n); // Array to store persisted tab ids
		const r: TabState["entities"] = {}; // Object to store persisted tab entities

		// Iterate over ids and store persisted tabs
		for (const id of ids) {
			const tab = entities[id];
			if (tab && tab.config?.persist) {
				q[p] = id;
				r[id] = tab;
				p++;
			}
		}

		return { ...S, entities: r, ids: q };
	},
	// Transform the outbound state
	(S: TabState, _k) => S,
	// Define a whitelist
	{ whitelist: ["tabs"] }
);

// Root Reducer
const rootReducer = combineReducers({
	tabs: tabsSlice.reducer,
});

// Persist Config
const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
	key: "root",
	storage,
	whitelist: ["tabs"],
	transforms: [persistTabsTransform],
};

// Persisted Reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["persist/PERSIST"],
			},
		}),
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export const useTabContext = () => {
	const dispatch = useDispatch<AppDispatch>();
	const tabs = useSelector(selectAllTabs);
	const activeTabId = useSelector((state: RootState) => state.tabs.activeTabId);

	const activeTab = useSelector((state: RootState) => {
		if (activeTabId === null) return null;
		return selectTabById(state, activeTabId);
	});

	const addTab = useCallback(
		(payload: AddTabPayload) => {
			try {
				dispatch(tabsSlice.actions.addTab(payload));
			} catch (error) {
				if (error instanceof TabError) {
					throw new TabError(error.message);
				} else {
					console.error("An unexpected error occurred while adding tab:", error);
				}
			}
		},
		[dispatch]
	);

	const removeTab = useCallback(
		(tabId: TabId) => {
			dispatch(tabsSlice.actions.removeTab(tabId));
		},
		[dispatch]
	);

	const updateTab = useCallback(
		(payload: UpdateTabPayload) => {
			dispatch(tabsSlice.actions.updateTab(payload));
		},
		[dispatch]
	);

	const setActiveTab = useCallback(
		(tabId: TabId) => {
			dispatch(tabsSlice.actions.setActiveTab(tabId));
		},
		[dispatch]
	);

	const switchTab = useCallback(
		(direction: "next" | "previous") => {
			dispatch(tabsSlice.actions.switchTab(direction));
		},
		[dispatch]
	);

	const closeAllTabs = useCallback(() => {
		dispatch(tabsSlice.actions.closeAllTabs());
	}, [dispatch]);

	return useMemo(
		() => ({
			tabs,
			activeTabId,
			activeTab,
			addTab,
			removeTab,
			updateTab,
			setActiveTab,
			switchTab,
			closeAllTabs,
		}),
		[tabs, activeTabId, activeTab, addTab, removeTab, updateTab, setActiveTab, switchTab, closeAllTabs]
	);
};

export const persistor = persistStore(store);
