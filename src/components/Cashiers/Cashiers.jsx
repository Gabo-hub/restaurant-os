import { useState, useEffect } from "react"
import ApiService from "../../api"
import { useAuth } from "../../AuthContext"
import { BarChart, Card, ListItem, List, ProgressBar } from "@tremor/react"

export default function Cashiers() {
    const [menu, setMenu] = useState(0)
    const { token, user } = useAuth()
    const [sales, setSales] = useState([])

    const ventasActuales = 100
    const metaDiaria = 1000
    const progress = (ventasActuales / metaDiaria) * 100

    const fetchSales = async () => {
        try {
            const apiService = new ApiService(token)
            const response = await apiService.getSalesByCashier(user.id)

            setSales(response?.slice(0, 5))
        } catch (error) {
            throw new Error('Error fetching sales data')
        }
    }


    const salesData = [
        {
            name: "Lunes",
            "Ventas del día": 15,
        },
        {
            name: "Martes",
            "Ventas del día": 22,
        },
        {
            name: "Miércoles",
            "Ventas del día": 31,
        },
        {
            name: "Jueves",
            "Ventas del día": 25,
        },
        {
            name: "Viernes",
            "Ventas del día": 40,
        },
        {
            name: "Sábado",
            "Ventas del día": 35,
        },
        {
            name: "Domingo",
            "Ventas del día": 100,
        },
    ]

    const mostSoldData = [
        { name: "Café Americano", ventas: 45 },
        { name: "Cappuccino", ventas: 38 },
        { name: "Latte", ventas: 32 },
        { name: "Espresso", ventas: 28 },
        { name: "Frappé", ventas: 25 },
    ]

    const recentSales = [
        { id: 1, producto: "Café Americano", cantidad: 2, total: 120, hora: "14:30" },
        { id: 2, producto: "Cappuccino", cantidad: 1, total: 85, hora: "14:25" },
        { id: 3, producto: "Latte", cantidad: 3, total: 240, hora: "14:20" },
        { id: 4, producto: "Espresso", cantidad: 1, total: 60, hora: "14:15" },
        { id: 5, producto: "Frappé", cantidad: 2, total: 180, hora: "14:10" },
    ]
    // Cargar órdenes al cambiar de menú
    useEffect(() => {
        if (menu === 1) {
            fetchSales()

            const intervalId = setInterval(fetchSales, 500);

            return () => clearInterval(intervalId);
        } else {
            setSales([])
        }
    }, [menu, token])

    return (
        <div className="min-h-[calc(100dvh-65px)] flex flex-col p-10 gap-7">
            <div className="flex justify-between items-center max-sm:flex-col">
                <h1 className="text-4xl font-bold text-gray-800 self-center">Cashiers</h1>
                <div className="flex gap-1">
                    <button
                        className={`tabs rounded-s-lg rounded-e-none ${menu === 0 ? "bg-[#08407f] text-white" : ""}`}
                        onClick={() => setMenu(0)}
                    >
                        <span>Resumen</span>
                    </button>
                    <button
                        className={`tabs rounded-e-lg rounded-s-none ${menu === 1 ? "bg-[#08407f] text-white" : ""}`}
                        onClick={() => setMenu(1)}
                    >
                        <span>Ventas</span>
                    </button>
                </div>
            </div>
            {menu === 0 && (
                <div className="w-full h-full">
                    {/* Progress Bar Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Meta Diaria</h3>
                            <span className="text-sm text-gray-500">
                                ${ventasActuales} / ${metaDiaria}
                            </span>
                        </div>
                        <ProgressBar
                            className="w-full"
                            color="green"
                            value={progress}
                            tooltip={`${progress.toFixed(1)}% de la meta diaria completada`}
                        />
                        <p className="text-xs text-gray-500 mt-2">Faltan ${metaDiaria - ventasActuales} para alcanzar la meta</p>
                    </div>


                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
                        <div className="lg:col-span-2">
                            <Card className="h-full">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Ventas del Día</h3>
                                <BarChart
                                    className="h-64 fill-[#1874dc]"
                                    data={salesData}
                                    index="name"
                                    categories={["Ventas del día"]}
                                    yAxisWidth={48}
                                />
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="h-full">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Más Vendidos</h3>
                                <BarChart
                                    className="h-64 fill-[#10b981]"
                                    data={mostSoldData}
                                    index="name"
                                    categories={["ventas"]}
                                    yAxisWidth={80}
                                    layout="vertical"
                                />
                            </Card>
                        </div>

                        <div className="lg:col-span-3">
                            <Card className="h-full">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Últimas Ventas</h3>
                                <div className="overflow-x-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {recentSales.map((sale) => (
                                            <div
                                                key={sale.id}
                                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-gray-800 text-sm">{sale.producto}</h4>
                                                    <span className="text-xs text-gray-500">{sale.hora}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Cant: {sale.cantidad}</span>
                                                    <span className="font-semibold text-[#08407f]">${sale.total}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
            {menu === 1 && (
                <div className="w-full h-full bg-white rounded-lg shadow-xl p-8 border">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Panel de ventas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {sales.length > 0 ?
                            <List>
                                {sales.map((sale, index) => (
                                    <ListItem key={index}>
                                        hola
                                    </ListItem>
                                ))}
                            </List>
                            : (
                                <div className="text-gray-500">No hay ventas registradas</div>
                            )}
                    </div>
                </div>
            )}
        </div>
    )
}
