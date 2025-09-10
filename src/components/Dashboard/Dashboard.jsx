import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import './dashboard.css'

//Icons categories
import waiterIcon from "../../assets/waiters-category.jpg"
import kitchenIcon from "../../assets/kitchen-category.jpg"
import cashierIcon from "../../assets/cashier-category.jpg"
import adminIcon from "../../assets/admin-category.jpg"


export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="min-h-[calc(100dvh-65px)] flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4 text-center my-10">
                <h1 className="text-4xl font-bold text-gray-800">Panel de Control</h1>
                <p className="text-2xl text-gray-600">Bienvenido, {user.username}!</p>
            </div>
            <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                {(user.role === 2 || user.role === 1) &&
                    <Link to="/dashboard/waiters">
                        <div className="card-categories">
                            <img className="card-image" src={waiterIcon} alt="Icono de la categoría de meseros"></img>
                            Meseros
                        </div>
                    </Link>
                }
                {(user.role === 3 || user.role === 1) &&
                    <Link to="/dashboard/kitchen">
                        <div className="card-categories">
                            <img className="card-image" src={kitchenIcon} alt="Icono de la categoría de cocina"></img>
                            Cocina
                        </div>
                    </Link>
                }
                {(user.role === 4 || user.role === 1) &&
                    <Link to="/dashboard/cashiers">
                        <div className="card-categories">
                            <img className="card-image cashiers" src={cashierIcon} alt="Icono de la categoría de cajero"></img>
                            Cajero
                        </div>
                    </Link>
                }
                {user.role === 1 &&
                    <Link to="/dashboard/admin">
                        <div className="card-categories">
                            <img className="card-image" src={adminIcon} alt="Icono de la categoría de administración"></img>
                            Panel<br />Administracion
                        </div>
                    </Link>
                }
            </div>
        </div>
    )
}