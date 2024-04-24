import { configureStore, EnhancedStore } from "@reduxjs/toolkit";
import { persistStore } from "redux-persist";
import rootReducer, { RootState } from "./rootReducer";

const store: EnhancedStore<RootState> = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
  devTools: process.env["NODE_ENV"] !== "production",
});

const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export { persistor, store };
