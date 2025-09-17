import { NavLink } from 'react-router-dom';
import { useAuth } from '../../AuthContext'
import { useEffect, useState } from 'react';
import { Button } from '@tremor/react';

export default function Nav () {
	const { user, logout } = useAuth();
	const [role, setRole] = useState('');
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		if (user?.id_role === 1) {
			setRole('Admin');
		} else if (user?.id_role === 2) {
			setRole('Mesero');
		} else if (user?.id_role === 3) {
			setRole('Cajero');
		} else if (user?.id_role === 4) {
			setRole('Cocina');
		}		
	}, [user]);

	const handleButton = () => {
		logout();
	}

	return (
		<nav className="px-10 max-sm:px-2 h-[65px] shadow-lg align-middle flex border-b-4 border-orange-400 relative">
			<div className="container mx-auto px-6 py-4 flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
						<span className="text-white font-bold text-xl">R</span>
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-800 max-sm:text-xl">Restaurant Os</h1>
						<p className="text-gray-600 max-sm:text-sm">{role}</p>
					</div>
					{ user && 
						<div className="hidden sm:flex items-center space-x-4">
							<div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
								{user && user.username}
							</div>
						</div>
					}
				</div>
				
				{/* Mobile menu button */}
				<button
					className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
				>
					<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{isMenuOpen ? (
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						) : (
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						)}
					</svg>
				</button>

				{/* Desktop navigation */}
				<ul className="hidden sm:flex items-center justify-between gap-1">
					{ user && <li className="nav-item">
						<Button variant="primary" className='bg-gray-100 hover:bg-gray-200 shadow-none text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-none'><NavLink to="/dashboard">Dashboard</NavLink></Button>
					</li> }
					{ user && <li className="nav-item">
						<Button variant="primary" className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-none' onClick={handleButton}>Logout</Button>
					</li> }
					{ !user && <li className="nav-item">
						<Button variant="primary" className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-none'><NavLink to="/">Login</NavLink></Button>
					</li> }
				</ul>
			</div>

			{/* Mobile menu */}
			{isMenuOpen && (
				<div className="sm:hidden absolute top-[65px] left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-50">
					<div className="px-6 py-4 space-y-4">
						{/* User info for mobile */}
						<div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
							<div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
								{user && user.username}
							</div>
						</div>
						
						{/* Navigation buttons for mobile */}
						<div className="space-y-3">
							{ user && (
								<div className="w-full">
									<Button variant="primary" className='w-full bg-gray-100 hover:bg-gray-200 shadow-none text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-none'><NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</NavLink></Button>
								</div>
							)}
							{ user && (
								<div className="w-full">
									<Button variant="primary" className='w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-none' onClick={() => { handleButton(); setIsMenuOpen(false); }}>Logout</Button>
								</div>
							)}
							{ !user && (
								<div className="w-full">
									<Button variant="primary" className='w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-none'><NavLink to="/" onClick={() => setIsMenuOpen(false)}>Login</NavLink></Button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</nav>
	)
}