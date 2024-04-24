import { configureStore, EnhancedStore } from "@reduxjs/toolkit";
import { persistStore } from "redux-persist";
import rootReducer, { RootState } from "./rootReducer";

const store: EnhancedStore<RootState> = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["persist/PERSIST"],
			},
		}),
	devTools: false,
});

const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export { persistor, store };
