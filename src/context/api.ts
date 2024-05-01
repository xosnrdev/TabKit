/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	PayloadAction,
	combineReducers,
	configureStore,
	createEntityAdapter,
	createSlice,
} from "@reduxjs/toolkit";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	PersistConfig,
	createTransform,
	persistReducer,
	persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

/**
 * Custom error class for tab-related errors.
 * Extends the built-in Error class to provide a custom error type.
 */
export class TabError extends Error {
	/**
	 * Constructor for TabError.
	 * @param message The error message.
	 */
	constructor(message: string) {
		super(message);
		this.name = "TabError";
	}
}

/**
 * Configuration options for a tab.
 * Represents the full set of configuration options available for a tab.
 */
type TabConfigOptions = Readonly<{
	/**
	 * Indicates whether the tab can be closed.
	 */
	closable: boolean;

	/**
	 * Indicates whether the tab should be persisted across app sessions.
	 */
	persist: boolean;

	/**
	 * Specifies the maximum number of tabs allowed.
	 */
	maxTabs: number;

	/**
	 * Specifies the maximum size of the tab content.
	 */
	maxContentSize: number;
}>;

/**
 * Partial configuration options for a tab.
 * Allows for partial configuration of a tab, making all properties optional.
 */
type TabConfig = Partial<TabConfigOptions>;

/**
 * Represents a tab object.
 * Defines the structure and properties of a tab.
 */
export type Tab = Readonly<{
	/**
	 * The unique identifier of the tab.
	 */
	id: string;

	/**
	 * The title of the tab.
	 */
	title: string;

	/**
	 * The content of the tab.
	 */
	content: string;

	/**
	 * Indicates whether the tab content has been modified.
	 */
	isDirty: boolean;

	/**
	 * Optional metadata associated with the tab.
	 */
	meta?: string;

	/**
	 * The configuration options for the tab.
	 */
	config: TabConfig;
}>;

/**
 * Type alias representing the type of the tab ID.
 */
type TabId = Tab["id"];

/**
 * Payload type for adding a new tab, excluding the ID and isDirty properties.
 */
type AddTabPayload = Omit<Tab, "id" | "isDirty">;

/**
 * Payload type for updating an existing tab, allowing partial updates and requiring the tab ID.
 */
type UpdateTabPayload = Partial<Tab> & { id: TabId };

/**
 * Default configuration options for a tab.
 * Provides sensible defaults for tab configuration options.
 */
const defaultConfig: TabConfig = {
	closable: true,
	persist: false,
	maxTabs: 10,
	maxContentSize: 1000,
};

/**
 * Entity adapter for managing tab entities.
 * Provides efficient CRUD operations and entity management for tabs.
 */
const tabsAdapter = createEntityAdapter<Tab>({
	sortComparer: (a, b) => a.title.localeCompare(b.title), // Sort tabs based on their title.
});

/**
 * Initial state for the tabs slice of the Redux store.
 * Uses the initial state from the tabs adapter and sets the active tab ID to null.
 */
const initialState = tabsAdapter.getInitialState({
	/**
	 * Set the active tab ID to null initially.
	 */
	activeTabId: null as TabId | null,
});

/**
 * Generates a unique ID for a new tab.
 * Uses the Web Crypto API to generate a secure random ID.
 * @returns A unique tab ID.
 */
function generateTabId(): string {
	const randomBytes = new Uint8Array(8);
	crypto.getRandomValues(randomBytes);

	const randomBinary = Array.from(randomBytes, (byte) => {
		const binary = byte.toString(2).padStart(8, "0");
		return binary;
	}).join("");

	const tabId = `tab-${parseInt(randomBinary, 2).toString(36).padStart(11, "0")}`;

	return tabId;
}

/**
 * Validates the payload for adding a new tab.
 * Checks for constraints like maximum number of tabs and content size.
 * Throws a TabError if any validation fails.
 * @param payload The payload for adding a new tab.
 * @param config The configuration options for the tab.
 * @param state The current state of the tabs slice.
 */
function validatePayload(payload: AddTabPayload, config: TabConfig, state: RootState["tabs"]) {
	const maxTabs = config.maxTabs ?? defaultConfig.maxTabs;
	const maxContentSize = config.maxContentSize ?? defaultConfig.maxContentSize;
	const { title, content, meta } = payload;

	const errors = [];

	if (maxTabs && state.ids.length >= maxTabs) {
		errors.push(`Maximum number of tabs (${maxTabs}) reached!`);
	}

	if (!title || typeof title !== "string") {
		errors.push("Title payload is required and must of type string.");
	}

	if (typeof content !== "string") {
		errors.push("Content payload must be of type string.");
	}

	if (typeof meta !== "string") {
		errors.push("Meta payload must be of type string.");
	}

	if (maxContentSize && content.length > maxContentSize) {
		errors.push(`Content length exceeds the limit of ${maxContentSize} characters.`);
	}

	if (errors.length > 0) {
		throw new TabError(errors.join("\n"));
	}
}

/**
 * Redux slice for managing the tabs state.
 * Defines reducers for adding, updating, removing tabs, and managing the active tab.
 */
const tabsSlice = createSlice({
	name: "tabs",
	initialState,
	reducers: {
		/**
		 * Reducer for adding a new tab.
		 * @param state The current state of the tabs slice.
		 * @param action The action object containing the payload for adding a new tab.
		 */
		addTab: (state, { payload }: PayloadAction<AddTabPayload>) => {
			const { config } = payload;
			validatePayload(payload, config, state)

			const newTab: Tab = {
				id: generateTabId(),
				title: payload.title,
				content: payload.content.slice(0, config.maxContentSize ?? defaultConfig.maxContentSize),
				isDirty: !!payload.content,
				meta: payload.meta,
				config: { ...defaultConfig, ...config },
			};

			tabsAdapter.addOne(state, newTab);
			state.activeTabId = newTab.id;
		},

		/**
		 * Reducer for setting the active tab.
		 * @param state The current state of the tabs slice.
		 * @param action The action object containing the tab ID to set as active.
		 */
		setActiveTab: (state, { payload: tabId }: PayloadAction<TabId>) => {
			if (state.entities[tabId]) {
				state.activeTabId = tabId;
			}
		},

		/**
		 * Reducer for removing a tab.
		 * @param state The current state of the tabs slice.
		 * @param action The action object containing the tab ID to remove.
		 */
		removeTab: (state, { payload: tabId }: PayloadAction<TabId>) => {
			if (state.entities[tabId].config.closable) {
				const { ids } = state;
				const removedTabIndex = ids.indexOf(tabId);
				tabsAdapter.removeOne(state, tabId);

				if (state.activeTabId === tabId) {
					state.activeTabId = null;

					const idsLength = ids.length;
					let nextIndex: number | null = null;

					for (let i = removedTabIndex + 1; i < idsLength; i++) {
						const id = ids[i];
						if (state.entities[id]) {
							nextIndex = i;
							break;
						}
					}

					if (nextIndex === null) {
						for (let i = removedTabIndex - 1; i >= 0; i--) {
							const id = ids[i];
							if (state.entities[id]) {
								nextIndex = i;
								break;
							}
						}
					}

					state.activeTabId = nextIndex !== null ? ids[nextIndex] : null;
				}
			}
		},

		/**
		 * Reducer for switching to the next or previous tab.
		 * @param state The current state of the tabs slice.
		 * @param action The action object containing the direction to switch the tab.
		 */
		switchTab: (state, { payload: direction }: PayloadAction<"next" | "previous">) => {
      const { activeTabId, ids } = state;
      const currentIndex = ids.indexOf(activeTabId || "");

      if (currentIndex !== -1) {
        const length = ids.length;
        const increment = direction === "next" ? 1 : -1;
        const newIndex = currentIndex + increment;

        // Check if the new index is valid
        if (newIndex >= 0 && newIndex < length && state.entities[ids[newIndex]]) {
          // Update the activeTabId if a valid tab was found
          state.activeTabId = ids[newIndex];
        } else if (direction === "next" && currentIndex === length - 1) {
          // If switching next and already at the last tab, do nothing
          return;
        } else if (direction === "previous" && currentIndex === 0) {
          // If switching previous and already at the first tab, do nothing
          return;
        }
      }
    },

		/**
		 * Reducer for closing all tabs.
		 * @param state The current state of the tabs slice.
		 */
		closeAllTabs: (state) => {
			tabsAdapter.removeAll(state);
			state.activeTabId = null;
		},

		/**
		 * Reducer for updating a tab.
		 * @param state The current state of the tabs slice.
		 * @param action The action object containing the payload for updating a tab.
		 */
		updateTab: (state, { payload }: PayloadAction<UpdateTabPayload>) => {
			const { id, content, config } = payload;
			const tab = state.entities[id];

			if (tab) {
				const maxContentSize =
					config?.maxContentSize ?? tab.config.maxContentSize ?? defaultConfig.maxContentSize;
				const updatedContent = content ?? tab.content;
				const isDirty =
					content !== undefined
						? content.length <= maxContentSize!
							? content !== tab.content
							: tab.content.slice(0, maxContentSize) !== content.slice(0, maxContentSize)
						: tab.isDirty;

				tabsAdapter.updateOne(state, {
					id,
					changes: {
						content: updatedContent.slice(0, maxContentSize),
						isDirty,
					},
				});
			}
		},
	},
});

/**
 * Type definition for the root state of the Redux store.
 * Includes the tabs slice state.
 */
type RootState = {
	tabs: ReturnType<typeof tabsSlice.reducer>;
};

/**
 * Selectors for accessing tab-related state from the Redux store.
 * Uses the selectors generated by the tabs adapter.
 */
const { selectAll: selectAllTabs, selectById: selectTabById } = tabsAdapter.getSelectors<RootState>(
	(state) => state.tabs
);

/**
 * Action creators for dispatching tab-related actions.
 * Generated by the tabs slice.
 */
const {
	addTab,
	setActiveTab,
	removeTab,
	switchTab,
	closeAllTabs,
	updateTab,
} = tabsSlice.actions;

/**
 * Redux transform for persisting only the tabs with the `persist` configuration set to `true`.
 * Allows selective persistence of tabs in the Redux store.
 */
const persistTabsTransform = createTransform(
	(state: RootState["tabs"]) => {
		const { entities, ids } = state;
		const persistedEntities: typeof entities = {};
		const persistedIds: TabId[] = [];

		ids.forEach((id) => {
			const tab = entities[id];
			if (tab.config.persist) {
				persistedEntities[id] = tab;
				persistedIds.push(id);
			}
		});

		return { ...state, entities: persistedEntities, ids: persistedIds };
	},
	(state) => state,
	{ whitelist: ["tabs"] }
);

/**
 * Root reducer combining the tabs reducer with other reducers.
 * Allows the tabs state to be managed alongside other state slices.
 */
const rootReducer = combineReducers({
	tabs: tabsSlice.reducer,
});

/**
 * Configuration options for persisting the Redux store state.
 * Specifies the storage engine, whitelist of state slices to persist, and transforms.
 */
const persistConfig: PersistConfig<RootState> = {
	key: "root",
	storage,
	whitelist: ["tabs"],
	transforms: [persistTabsTransform],
};

/**
 * Persisted reducer created by wrapping the root reducer with persistence.
 * Allows the Redux store state to be persisted across app sessions.
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Redux store configured with the persisted reducer and middleware.
 * Enables devtools in non-production environments.
 */
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["persist/PERSIST"],
			},
		}),
	devTools: process.env.NODE_ENV !== "production"
});

/**
 * Type alias representing the dispatch function of the Redux store.
 */
type AppDispatch = typeof store.dispatch;

/**
 * Custom hook for accessing the Redux store state with type safety.
 */
const useAppSelector = <T>(selector: (state: RootState) => T) =>
	useSelector<RootState, T>(selector);

/**
 * Custom hook for accessing the tab-related state from the Redux store.
 * Provides convenient access to the tabs state and bound action creators.
 */
export const useTabContext = () => {
	const dispatch = useDispatch<AppDispatch>();
	const tabs = useAppSelector(selectAllTabs);
	const activeTabId = useAppSelector((state) => state.tabs.activeTabId);

	const activeTab = useAppSelector((state) =>
		activeTabId ? selectTabById(state, activeTabId) : null
	);

	const boundActions = useMemo(
		() => ({
			addTab: (payload: AddTabPayload) => dispatch(addTab(payload)),
			removeTab: (tabId: TabId) => dispatch(removeTab(tabId)),
			updateTab: (payload: UpdateTabPayload) => dispatch(updateTab(payload)),
			setActiveTab: (tabId: TabId) => dispatch(setActiveTab(tabId)),
			switchTab: (direction: "next" | "previous") => dispatch(switchTab(direction)),
			closeAllTabs: () => dispatch(closeAllTabs()),
		}),
		[dispatch]
	);

	return { tabs, activeTabId, activeTab, ...boundActions };
};

/**
 * Persistor for persisting the Redux store state.
 * Allows the store state to be persisted and rehydrated across app sessions.
 */
export const persistor = persistStore(store);
