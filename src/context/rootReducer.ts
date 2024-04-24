import { combineReducers, Reducer } from "@reduxjs/toolkit";
import { persistReducer, PersistConfig } from "redux-persist";
import storage from "redux-persist/lib/storage";
import tabReducer, { TabState } from "./service/tabSlice";

const tabPersistConfig: PersistConfig<TabState> = {
  key: "tab",
  storage,
};

const persistedTabReducer = persistReducer(tabPersistConfig, tabReducer);

const rootReducer: Reducer = combineReducers({
  tabs: persistedTabReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
