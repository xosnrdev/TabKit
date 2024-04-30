import { ChangeEvent, FC, useState } from 'react';
import { useTabContext } from './index';
import { TabError } from './index';

const TextEditor: FC = () => {
	const { addTab, tabs, removeTab, updateTab, activeTab, activeTabId, closeAllTabs, setActiveTab, switchTab } = useTabContext()
	const [error, setError] = useState<string | null>(null);

	const handleAddTab = () => {
		try {
			addTab({
				title: `Document ${tabs.length + 1}`,
				content: `Hello World! ${tabs.length + 1}`,
				meta: `typescript ${tabs.length + 1}`,
				config: { maxTabs: 5, maxContentSize: 10, reorderable: true},
			})

		} catch (error) {
			if (error instanceof TabError) {
				setError(error.message);
			} else {
				setError('An unknown error occurred.');
			}
		}
	};

	const handleSetActiveTab = (id: string) => {
		setActiveTab(id);
	};

	const handleRemoveTab = (id: string) => {
		removeTab(id);
	};

	const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		const newText = e.target.value;
		if (activeTabId) {
			updateTab({ id: activeTabId, content: newText });
		}
	};

	const handleSwitchTab = (direction: 'next' | 'previous') => {
		switchTab(direction);
	};

	const handleCloseAllTabs = () => {
		(closeAllTabs());
	};

	return (
		<div>
			{error && (
				<div style={{ color: 'red', backgroundColor: '#ffcccc', padding: '10px', marginBottom: '10px' }}>
					<p>Error: {error}</p>
				</div>
			)}
			<div style={{ marginBottom: '10px' }}>
				<button onClick={handleAddTab}>Add Tab</button>
				<button onClick={() => handleSwitchTab('previous')}>Previous Tab</button>
				<button onClick={() => handleSwitchTab('next')}>Next Tab</button>
				<button onClick={handleCloseAllTabs}>Close All Tabs</button>
			</div>

			<div style={{ marginBottom: '10px' }}>
				{tabs.map((tab) => (
					<div key={tab.id} style={{ display: 'inline-block', marginRight: '10px' }}>
						<button onClick={() => handleSetActiveTab(tab.id)}>{tab.title}</button>
						<button onClick={() => handleRemoveTab(tab.id)}>X</button>
					</div>
				))}
			</div>

			{activeTab && (
				<div>
					<textarea id="TextEditor" value={activeTab.content} onChange={handleTextChange} style={{ width: '100%', height: '200px' }} />
				</div>
			)}
			{activeTab && (
				<p>{activeTab.meta}</p>
			)}
		</div>
	);
};

export default TextEditor;
