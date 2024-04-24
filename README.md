# TabKit

TabKit is a TypeScript library for managing tab state in web applications using Redux Toolkit. It provides a set of actions, reducers, and utilities that simplify the process of adding, removing, updating, and reordering tabs in your application.

## Features

- 🆕 Add new tabs with unique IDs and custom configurations
- 🎯 Set the active tab programmatically
- ❌ Remove tabs individually or close all tabs at once
- ↔️ Switch between tabs using "next" and "previous" actions
- 💾 Update tab properties, such as title, content, and dirty state
- 🔄 Reorder tabs by moving them to new positions
- 🎛️ Customize tab behavior with configuration options
- 🏷️ Strongly-typed interfaces for tab state and actions
- 🚀 Built with Redux Toolkit for efficient state management
- 💾 Persist tab state across sessions using Redux Persist
- 🏪 Includes a built-in Redux store and provider component
- 🪝 Provides hooks for accessing tab state and dispatching actions

## Getting Started

### Installation

To install TabKit, run the following command:

```bash
  pnpm add tabkit
```

or

```bash
  yarn add tabkit
```

## Usage

### 1\. Wrap your application with the TabProvider

Use the `TabProvider` component from TabKit to wrap your application and provide the built-in Redux store and Redux Persist persistor to your components.

```tsx
import { TabProvider } from "@xosnrdev/tabkit";

const App = () => {
  return <TabProvider>{/* Your application components */}</TabProvider>;
};
```

### 2\. Dispatch Actions

Use the provided hooks to access tab state and dispatch actions:

```tsx
import {
  useTab,
  useActiveTab,
  useAppDispatch,
  addTab,
  removeTab,
  setActiveTab,
} from "@xosnrdev/tabkit";

const MyComponent = () => {
  const tabs = useTab();
  const activeTabId = useActiveTab();
  const dispatch = useAppDispatch();

  const handleAddTab = () => {
    dispatch(
      addTab({
        title: "New Tab",
        content: "This is a new tab",
        config: {
          closable: true,
          persist: false,
        },
      })
    );
  };

  const handleRemoveTab = (tabId: string) => {
    dispatch(removeTab(tabId));
  };

  const handleSetActiveTab = (tabId: string) => {
    dispatch(setActiveTab(tabId));
  };

  return (
    <div>
      {/* Render tabs */}
      {Object.values(tabs).map((tab) => (
        <div key={tab.id}>{tab.title}</div>
      ))}

      {/* Render active tab content */}
      {activeTabId && <div>{tabs[activeTabId].content}</div>}

      {/* Add, remove, and set active tab */}
      <button onClick={handleAddTab}>Add Tab</button>
      <button onClick={() => handleRemoveTab(activeTabId)}>
        Remove Active Tab
      </button>
      <button onClick={() => handleSetActiveTab("tab-id")}>
        Set Active Tab
      </button>
    </div>
  );
};
```

### 3\. Access Tab State

You can access the tab state in your components using the `useSelector` hook from React Redux:

```tsx
import { useSelector } from "react-redux";
import { TabState } from "tabkit";
const TabList = () => {
  const tabState = useSelector((state) => state.tab) as TabState;
  return (
    <div>
      {" "}
      {tabState.ids.map((tabId) => (
        <div key={tabId}>{tabState.entities[tabId].title}</div>
      ))}{" "}
    </div>
  );
};
```

### Interfaces

#### `TabConfig`

Represents the configuration options for a tab.

| Property       | Type      | Description                                               |
| -------------- | --------- | --------------------------------------------------------- |
| `closable?`    | `boolean` | Specifies whether the tab can be closed.                  |
| `reorderable?` | `boolean` | Specifies whether the tab can be reordered.               |
| `persist?`     | `boolean` | Specifies whether the tab should persist across sessions. |

#### `Tab`

Represents a single tab.

| Property   | Type        | Description                                    |
| ---------- | ----------- | ---------------------------------------------- |
| `id`       | `string`    | The unique identifier for the tab.             |
| `title`    | `string`    | The title of the tab.                          |
| `content?` | `string`    | The content of the tab.                        |
| `isDirty?` | `boolean`   | Indicates whether the tab has unsaved changes. |
| `config`   | `TabConfig` | The configuration options for the tab.         |

#### `TabState`

Represents the state of the tabs.

| Property      | Type                            | Description                                                |
| ------------- | ------------------------------- | ---------------------------------------------------------- |
| `entities`    | `Readonly<Record<string, Tab>>` | An object containing tab entities indexed by their IDs.    |
| `ids`         | `ReadonlyArray<string>`         | An array of tab IDs in the order they should be displayed. |
| `activeTabId` | `string`                        | `null`                                                     |

### Actions

- `addTab(payload: Omit<Tab, "id">)`: Adds a new tab to the state.
- `setActiveTab(tabId: string)`: Sets the active tab to the one with the given ID.
- `removeTab(tabId: string)`: Removes the tab with the given ID from the state.
- `switchTab(direction: "next" | "previous")`: Switches to the next or previous tab in the order.
- `closeAllTabs()`: Closes all tabs, removing them from the state.
- `updateTab(payload: Partial<Tab> & { id: string })`: Updates the properties of the tab with the given ID.
- `moveTab(payload: { id: string; newIndex: number })`: Moves the tab with the given ID to a new position in the order.

### Hooks

TabKit provides the following hooks for accessing tab state and dispatching actions:

- `useTab`: Returns an object containing all the tab entities indexed by their IDs.
- `useActiveTab`: Returns the ID of the currently active tab, or null if no tab is active.
- `useAppDispatch`: Returns a reference to the dispatch function from the Redux store.

### Reducer

- `tabReducer`: The reducer function for managing tab state. It should be included in your Redux store configuration.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the [GitHub repository](https://github.com/xosnrdev/tabkit).

## License

TabKit is released under the [MIT License](https://opensource.org/licenses/MIT).

## Acknowledgements

TabKit is built with [Redux Toolkit](https://redux-toolkit.js.org/) and inspired by the [Ducks](https://github.com/erikras/ducks-modular-redux) modular Redux architecture.

## Contact

For questions or feedback, please contact the TabKit team at <kenzo@geniuskingsley.dev>.
