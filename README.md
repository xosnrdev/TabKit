# TabKit

TabKit is a React library for managing tab state in web applications. It provides a set of actions, reducers, and utilities that simplify adding, removing, updating, and reordering tabs. TabKit is built on Redux Toolkit and TypeScript.

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
- 🪝 Provides a context hook for accessing tab state and dispatching actions

## Getting Started

### Installation

To install TabKit, run the following command:

```bash
  pnpm add @xosnrdev/tabkit
```

or

```bash
  yarn add @xosnrdev/tabkit
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

Use the `useTabContext` hook to access tab state and dispatch actions:

```tsx
import {FC} from "react"
import {
	useTabContext,
	TabError
} from "@xosnrdev/tabkit";

const TextEditor: FC = () => {
	const {
		addTab,
		tabs,
		removeTab,
		activeTab,
		activeTabId,
		setActiveTab,
		{/* and more... */}

	} = useTabContext();

	const [error, setError] = useState<string | null>(null);

	const handleAddTab = () => {
		try {
			addTab({
				title: `Document ${tabs.length + 1}`,
				content: `Hello World! ${tabs.length + 1}`,
				config: { persist: false, maxTabs: 5 },
			});
		} catch (error) {
			// Using error boundary is recommended
			if (error instanceof TabError) {
				setError(error.message);
			} else {
				setError("An unknown error occurred.");
			}
		}
	};

	const handleSetActiveTab = (id: string) => {
		setActiveTab(id);
	};

	const handleRemoveTab = (id: string) => {
		removeTab(id);
	};

	return (
		<div>
			<div>
			{/* Render tabs */}
			{tabs.map((tab) => (
					<div key={tab.id} style={{ display: 'inline-block', marginRight: '10px' }}>
						<button onClick={() => handleSetActiveTab(tab.id)}>{tab.title}</button>
						<button onClick={() => handleRemoveTab(tab.id)}>X</button>
					</div>
				)))
			}
			<div>

		<div>
			{/* Render active tab content */}
			{activeTab && (
				<div>
					<textarea id="TextEditor" value={activeTab.content} onChange={handleTextChange} style={{ width: '100%', height: '200px' }} />
				</div>
			)}
		</div>

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

| Property   | Type        | Description                                        |
| ---------- | ----------- | -------------------------------------------------- |
| `id`       | `string`    | The unique identifier for the tab.                 |
| `title`    | `string`    | The title of the tab.                              |
| `content?` | `string`    | The content of the tab.                            |
| `isDirty?` | `boolean`   | Indicates whether the tab has empty string or not. |
| `config?`  | `TabConfig` | The configuration options for the tab.             |

#### `TabState`

Represents the state of the tabs.

| Property      | Type                            | Description                                                |
| ------------- | ------------------------------- | ---------------------------------------------------------- |
| `entities`    | `Readonly<Record<string, Tab>>` | An object containing tab entities indexed by their IDs.    |
| `ids`         | `ReadonlyArray<string>`         | An array of tab IDs in the order they should be displayed. |
| `activeTabId` | `string`                        | ID of an active tab which is type of string or null        |

### Actions

- `addTab(payload: Omit<Tab, "id" | "isDirty">)`: Adds a new tab to the state.
- `setActiveTab(tabId: string)`: Sets the active tab to the one with the given ID.
- `removeTab(tabId: string)`: Removes the tab with the given ID from the state.
- `switchTab(direction: "next" | "previous")`: Switches to the next or previous tab in the order.
- `closeAllTabs()`: Closes all tabs, removing them from the state.
- `updateTab(payload: Partial<Tab> & { id: string })`: Updates the properties of the tab with the given ID.

### Hook

TabKit provides the following hook for accessing tab state and dispatching actions:

- `useTabContext`
  is a custom React hook that provides a convenient way to interact with the tab management system in your application. It abstracts away the complexity of working with the Redux store directly and offers a simple and intuitive API for managing tabs.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the [GitHub repository](https://github.com/xosnrdev/tabkit).

## License

TabKit is released under the [MIT License](https://opensource.org/licenses/MIT).

## Acknowledgements

TabKit is built with [Redux Toolkit](https://redux-toolkit.js.org/) and inspired by the [Ducks](https://github.com/erikras/ducks-modular-redux) modular Redux architecture.

## Contact

For questions or feedback, please contact the TabKit maintainer at <successxodev@gmail.com>.
