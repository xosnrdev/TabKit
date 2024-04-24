import {
	PayloadAction,
	Reducer,
	createEntityAdapter,
	createSlice,
} from "@reduxjs/toolkit";
import { produce } from "immer";
import { memoize } from "lodash";
import { nanoid } from "nanoid";

/**
 * Represents the configuration options for a tab.
 * @public
 */
export interface TabConfig {
	/**
	 * Indicates whether the tab is closable.
	 * @defaultValue `true`
	 */
	readonly closable?: boolean;
	/**
	 * Indicates whether the tab is reorderable.
	 * @defaultValue `true`
	 */
	readonly reorderable?: boolean;
	/**
	 * Indicates whether the tab state should persist.
	 * @defaultValue `false`
	 */
	readonly persist?: boolean;
}

/**
 * Represents a tab in the TabKit library.
 * @public
 */
export interface Tab {
	/**
	 * The unique identifier of the tab.
	 */
	readonly id: string;
	/**
	 * The title of the tab.
	 */
	readonly title: string;
	/**
	 * The content of the tab.
	 */
	readonly content?: string;
	/**
	 * Indicates whether the tab has unsaved changes.
	 */
	readonly isDirty?: boolean;
	/**
	 * The configuration options for the tab.
	 */
	readonly config?: TabConfig;
}

/**
 * Represents the state of the tabs in the TabKit library.
 * @public
 */
export interface TabState {
	/**
	 * The dictionary of tab entities.
	 */
	readonly entities: Readonly<Record<string, Tab>>;
	/**
	 * The ordered list of tab IDs.
	 */
	readonly ids: ReadonlyArray<string>;
	/**
	 * The ID of the currently active tab.
	 */
	readonly activeTabId: string | null;
}

/**
 * Error class for tab-related errors.
 * @internal
 */
class TabError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TabError";
	}
}

/**
 * Validates the existence and accessibility of a tab entity.
 * @param state - The tab state.
 * @param tabId - The ID of the tab to validate.
 * @throws {TabError} If the tab is not found or not accessible.
 * @internal
 */
function validateTabEntity(
	state: TabState,
	tabId: string
): asserts tabId is keyof TabState["entities"] {
	const tab = state.entities[tabId];
	if (!tab) {
		throw new TabError(`Tab with ID ${tabId} not found`);
	}
	if (tab.config?.closable === false || tab.config?.reorderable === false) {
		throw new TabError(`Tab with ID ${tabId} is not accessible`);
	}
}

const tabsAdapter = createEntityAdapter<Tab>({
	sortComparer: (a, b) => a.title.localeCompare(b.title),
});

const initialState: TabState = tabsAdapter.getInitialState({
	activeTabId: null,
});

const memoizedMoveTab = memoize(
	(tabs: Tab[], id: string, newIndex: number): Tab[] => {
		const oldIndex = tabs.findIndex((tab) => tab.id === id);
		if (oldIndex === -1) return tabs;

		const updatedTabs = [...tabs];
		updatedTabs.splice(newIndex, 0, ...updatedTabs.splice(oldIndex, 1));
		return updatedTabs;
	},
	(tabs: Tab[], id: string, newIndex: number) =>
		`${tabs.map((tab) => tab.id).join("-")}-${id}-${newIndex}`
);

/**
 * Slice for managing the state of tabs in the TabKit library.
 * @public
 */
export const tabsSlice = createSlice({
	name: "tabs",
	initialState,
	reducers: {
		/**
		 * Adds a new tab to the state.
		 * @param state - The current state.
		 * @param action - The action payload containing the tab properties.
		 * @public
		 */
		addTab: (state, action: PayloadAction<Omit<Tab, "id">>) => {
			const id = nanoid();
			const tabWithDefaultConfig = {
				id,
				...action.payload,
				config: {
					persist: action.payload.config?.persist ?? false,
					closable: action.payload.config?.closable ?? true,
					reorderable: action.payload.config?.reorderable ?? true,
				},
			};

			tabsAdapter.addOne(state, tabWithDefaultConfig);

			state.activeTabId = id;
		},

		/**
		 * Sets the active tab.
		 * @param state - The current state.
		 * @param action - The action payload containing the tab ID.
		 * @public
		 */
		setActiveTab: (state, action: PayloadAction<string>) => {
			validateTabEntity(state, action.payload);
			state.activeTabId = action.payload;
		},

		/**
		 * Removes a tab from the state.
		 * @param state - The current state.
		 * @param action - The action payload containing the tab ID.
		 * @public
		 */
		removeTab: (state, action: PayloadAction<string>) => {
			validateTabEntity(state, action.payload);
			tabsAdapter.removeOne(state, action.payload);
			const { ids } = state;
			state.activeTabId = ids.length > 0 ? ids[0] : null;
		},

		/**
		 * Switches to the next or previous tab.
		 * @param state - The current state.
		 * @param action - The action payload indicating the direction.
		 * @public
		 */
		switchTab: (state, action: PayloadAction<"next" | "previous">) => {
			const { ids, activeTabId } = state;
			const currentIndex = ids.indexOf(activeTabId || "");
			if (currentIndex !== -1) {
				let newIndex: number;
				const direction = action.payload === "next" ? 1 : -1;
				const length = ids.length;
				newIndex = (currentIndex + direction + length) % length;
				while (state.entities[ids[newIndex]].config?.reorderable === false) {
					newIndex = (newIndex + direction + length) % length;
				}
				state.activeTabId = ids[newIndex];
			}
		},

		/**
		 * Closes all tabs.
		 * @param state - The current state.
		 * @public
		 */
		closeAllTabs: (state) => {
			tabsAdapter.removeAll(state);
			state.activeTabId = null;
		},

		/**
		 * Updates the properties of a tab.
		 * @param state - The current state.
		 * @param action - The action payload containing the tab ID and updated properties.
		 * @public
		 */
		updateTab: (
			state,
			action: PayloadAction<Partial<Tab> & { id: string }>
		) => {
			const { id, ...changes } = action.payload;
			return produce(state, (draftState) => {
				validateTabEntity(draftState, id);
				const tab = draftState.entities[id];
				if (tab) {
					Object.assign(tab, changes);
				}
			});
		},

		/**
		 * Moves a tab to a new index.
		 * @param state - The current state.
		 * @param action - The action payload containing the tab ID and new index.
		 * @public
		 */
		moveTab: (
			state,
			action: PayloadAction<{ id: string; newIndex: number }>
		) => {
			const { id, newIndex } = action.payload;
			validateTabEntity(state, id);
			const { entities } = state;
			const movedTabs = memoizedMoveTab(Object.values(entities), id, newIndex);
			tabsAdapter.setAll(state, movedTabs);
		},
	},
});

/**
 * Action creators for the tabs slice.
 * @public
 */
export const {
	addTab,
	setActiveTab,
	removeTab,
	switchTab,
	closeAllTabs,
	updateTab,
	moveTab,
} = tabsSlice.actions;

/**
 * Reducer for the tabs slice.
 * @public
 */
export default tabsSlice.reducer as Reducer<TabState>;
