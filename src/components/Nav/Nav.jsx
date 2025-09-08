import { NavLink } from 'react-router-dom';
import { useAuth } from '../../AuthContext'

export default function Nav () {
	const { user, logout } = useAuth();

	const handleButton = () => {
		logout();
	}

	return (
		<nav className="px-10 h-[65px] shadow-sm align-middle flex">
			<div className='w-full flex justify-between items-center'>
				<h1 className="	text-2xl font-semibold">Restaurant Os</h1>
				<ul className="flex items-center justify-between gap-1">
					{ user && <li className="nav-item">
						<NavLink to="/dashboard"><button className="p-2 h-min tabs rounded-e-none"><span>Dashboard</span></button></NavLink>
					</li> }
					{ user && <li className="nav-item">
						<button className="p-2 h-min tabs rounded-s-none" onClick={handleButton}><span>Logout</span></button>
					</li> }
					{ !user && <li className="nav-item">
						<NavLink className="nav-link" to="/"><button className="p-2 h-min"><span>Login</span></button></NavLink>
					</li> }
				</ul>
			</div>
		</nav>
	)
}