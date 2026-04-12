import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";

export type { RootState, AppDispatch };

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
