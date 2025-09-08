import { useAuth } from './AuthContext'
import {
//   Route, 
  Navigate
} from "react-router-dom";

export function Public ({ children }) {
	const { user } = useAuth();
	if(user) {
		return <Navigate to="/dashboard" />;
	}
	return children;
}



export function Private ({ children }) {
	const { user } = useAuth();
	if(!user) {
		return <Navigate to="/" />;
	}
	return children;
}
