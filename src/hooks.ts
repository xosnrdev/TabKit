import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./index";
import { Selector } from "@reduxjs/toolkit";

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>();
const useTab: Selector = () => useSelector((state: RootState) => state.tabs.entities);
const useActiveTab: Selector = () =>
	useSelector((state: RootState) => state.tabs.activeTabId);

export { useActiveTab, useAppDispatch, useAppSelector, useTab };
