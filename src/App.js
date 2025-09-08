import Components from './components'
import NotFound from './components/NotFound';
import { AuthProvider } from './AuthContext';
import { Routes, Route } from "react-router-dom";

import {
  Public,
  Private
} from "./routes";

function App () {
	
    return (
        <AuthProvider>
            <>
                <Components.Nav />
                <Routes>
                    <Route path="/" element={<Public><Components.Login /></Public>} />
                    <Route path="/dashboard" element={<Private><Components.Dashboard /></Private>} />
                    <Route path="/dashboard/waiters" element={<Private><Components.Waiters/></Private>} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
                <Components.Footer />
            </>
        </AuthProvider>
    )
}

export default App;