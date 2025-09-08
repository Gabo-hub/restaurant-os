import React, { useState, useEffect } from "react";
import ApiService from "../../api";
import { useAuth } from "../../AuthContext";
import CardTable from "../ui/CardTables";

export default function Waiters() {
    const [menu, setMenu] = useState(0);
    const [allTables, setAllTables] = useState([]); // Todas las mesas originales
    const [tables, setTables] = useState([]); // Mesas filtradas
    const { token } = useAuth(); // Obtener el token del contexto de autenticación
    const [filters, setFilters] = useState({
        status: '',
        section: '',
        capacity: ''
    }); // Estado para los filtros

    // Cargar mesas al cambiar de menú
    useEffect(() => {
        if (menu === 1) {
            const apiService = new ApiService(token);
            apiService.getTables()
                .then(data => {
                    setAllTables(data);
                    setTables(data);
                })
                .catch(error => {
                    console.error("Error fetching tables:", error);
                });
        } else if (menu === 0 || menu === 2) {
            setAllTables([]);
            setTables([]);
        }
    }, [menu, token]);

    // Filtrar mesas cuando cambian los filtros o las mesas originales
    useEffect(() => {
        let filtered = [...allTables];
        if (filters.status) {
            filtered = filtered.filter(table => table.status_name === filters.status);
        }
        if (filters.section) {
            filtered = filtered.filter(table => table.section === filters.section);
        }
        if (filters.capacity) {
            filtered = filtered.filter(table => table.capacity === parseInt(filters.capacity));
        }
        setTables(filtered);
    }, [filters, allTables]);

    // Manejar cambios en los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Limpiar filtros
    const clearFilters = () => {
        setFilters({
            status: '',
            section: '',
            capacity: ''
        });
    };

    // Obtener secciones y capacidades únicas para los selects
    const uniqueSections = [...new Set(allTables.map(t => t.section))];
    const uniqueCapacities = [...new Set(allTables.map(t => t.capacity))];

    return (
        <div className="min-h-[calc(100dvh-65px)] flex flex-col p-10 gap-7">
            <div className="flex justify-between items-center max-sm:flex-col">
                <h1 className="text-4xl font-bold text-gray-800 self-center">Waiters</h1>
                <div className="flex gap-1">
                    <button className="tabs rounded-s-lg rounded-e-none" onClick={() => setMenu(0)}>
                        <span className="">
                            Resumen
                        </span>
                    </button>
                    <button className="tabs rounded-none" onClick={() => setMenu(1)}>
                        <span className="mr-2">
                            Mesas
                        </span>
                    </button>
                    <button className="tabs rounded-e-lg rounded-s-none" onClick={() => setMenu(2)}>
                        <span className="mr-2">
                            Ordenes
                        </span>
                    </button>
                </div>
            </div>
            {menu === 0 && (
                <div className="w-full h-full bg-white rounded-lg shadow-xl p-8 border">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Resumen Gestión</h2>
                </div>
            )}
            {menu === 1 && (
                <div className="w-full h-full bg-white rounded-lg shadow-xl p-8 border">
                    <div className="flex justify-between items-center my-6 flex-col gap-5">
                        <h2 className="text-2xl font-semibold text-gray-700">Panel de Mesas</h2>
                        <div className="grid grid-flow-row w-10/12 gap-2">
                            <button
                                className={`tabs xl:rounded-none xl:rounded-s-lg col-start-1 row-start-1 col-span-1 row-span-1 ${filters.status === 'Activo' ? 'bg-[#08407f]' : ''}`}
                                onClick={() => setFilters(f => ({ ...f, status: f.status === 'Activo' ? '' : 'Activo' }))}
                            >
                                Mesas Activas
                            </button>
                            <button
                                className={`tabs xl:rounded-none col-start-1 sm:row-start-2 md:col-start-2 md:row-start-1 ${filters.status === 'Ocupado' ? 'bg-[#08407f]' : ''}`}
                                onClick={() => setFilters(f => ({ ...f, status: f.status === 'Ocupado' ? '' : 'Ocupado' }))}
                            >
                                Mesas Inactivas
                            </button>
                            <select
                                className="tabs xl:rounded-none row-start-3 md:row-start-2 xl:col-start-3 xl:row-start-1 xl:col-span-1"
                                name="section"
                                value={filters.section}
                                onChange={handleFilterChange}
                            >
                                <option value="">Todas las secciones</option>
                                {uniqueSections.map(section => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                            <select
                                className="tabs xl:rounded-s-none col-start-1 sm:row-start-4 md:row-start-2 xl:col-start-4 xl:row-start-1 xl:col-span-1"
                                name="capacity"
                                value={filters.capacity}
                                onChange={handleFilterChange}
                            >
                                <option value="">Todas las capacidades</option>
                                {uniqueCapacities.map(cap => (
                                    <option key={cap} value={cap}>{cap}</option>
                                ))}
                            </select>
                            <button className="tabs bg-gray-200 hidden" onClick={clearFilters}>
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {tables.length > 0 ? (
                            tables.map(table => (
                                <CardTable key={table.id_table} data={table} />
                            ))
                        ) : (
                            <div className="text-gray-500">
                                No hay mesas para mostrar.
                            </div>
                        )}
                    </div>
                </div>
            )}
            {menu === 2 && (
                <div className="w-full h-full bg-white rounded-lg shadow-xl p-8 border">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Panel de Ordenes</h2>
                </div>
            )}
        </div>
    )
}