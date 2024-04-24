import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState, TabState } from "./index";
import { Selector } from "@reduxjs/toolkit";

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>();

const useTab = (): Selector<RootState, TabState["entities"]> => {
	return useAppSelector((state) => state.tabs.entities);
};

const useActiveTab: () => Selector<RootState, TabState["activeTabId"]> = () =>
	useAppSelector((state) => state.tabs.activeTabId);

export { useActiveTab, useAppDispatch, useAppSelector, useTab };
