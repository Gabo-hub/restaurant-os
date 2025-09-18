import React, { useState, useEffect, useCallback, useMemo } from "react";
import ApiService from "../../api";
import { useAuth } from "../../AuthContext";
import CardTable from "../ui/CardTables";
import MoneyTip from "../ui/MoneyTip";
import CardStatistics from "../ui/CardStatistics";
import { Button, Select, SelectItem, Tab, TabGroup, TabList } from "@tremor/react";
import { RiFlag2Line } from "@remixicon/react";
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@tremor/react";

export default function Waiters() {
    const [menu, setMenu] = useState(0);
    const [allTables, setAllTables] = useState([]); // Todas las mesas originales
    const [tables, setTables] = useState([]); // Mesas filtradas
    const { token, user } = useAuth(); // Obtener el token y el usuario actual
    const [filters, setFilters] = useState({
        status: "",
        section: "",
        capacity: "",
    }); // Estado para los filtros

    // Estados para las estadísticas
    const [stats, setStats] = useState({
        occupiedTables: 0,
        totalTables: 0,
        pendingOrders: 0,
        totalSales: [{amount: 0}, {USD: 0, EUR: 0}],
        completedOrders: 0,
        lastOrdersData: [],
    });

    const apiService = useMemo(() => new ApiService(), [token]);

    const fetchTables = useCallback(async () => {
        if (!token) return;
        try {
            const data = await apiService.getTables();
            // Procesar los datos de mesas para asegurar consistencia en los estados
            const processedTables = data.map((table) => ({
                ...table,
                // Asegurar que el estado sea consistente
                status_name: table.status_name || table.status || "Desconocido",
                // Asegurar que tengamos los campos necesarios para el filtrado
                section: table.section || "Sin sección",
                capacity: table.capacity || 0,
            }));
            setAllTables(processedTables);
        } catch (error) {
            console.error("Error fetching tables:", error);
        }
    }, [token, apiService]);

    // Cargar mesas al cambiar de menú
    useEffect(() => {
        if (menu === 1) {
            fetchTables();
        } else if (menu === 0 || menu === 2) {
            setAllTables([]);
            setTables([]);
        }
    }, [menu, fetchTables]);

    // Filtrar mesas cuando cambian los filtros o las mesas originales
    useEffect(() => {
        let filtered = [...allTables];

        // Filtrar por estado (manejar diferentes variaciones de nombres de estados)
        if (filters.status) {
            filtered = filtered.filter((table) => {
                const tableStatus =
                    table.status_name?.toLowerCase() ||
                    table.status?.toLowerCase() ||
                    "";
                const filterStatus = filters.status.toLowerCase();
                return (
                    tableStatus === filterStatus ||
                    tableStatus.includes(filterStatus) ||
                    filterStatus.includes(tableStatus)
                );
            });
        }

        // Filtrar por sección
        if (filters.section) {
            filtered = filtered.filter((table) => {
                const tableSection = table.section?.toLowerCase() || "";
                const filterSection = filters.section.toLowerCase();
                return (
                    tableSection === filterSection ||
                    tableSection.includes(filterSection) ||
                    filterSection.includes(tableSection)
                );
            });
        }

        // Filtrar por capacidad
        if (filters.capacity) {
            const capacityFilter = parseInt(filters.capacity);
            if (!isNaN(capacityFilter)) {
                filtered = filtered.filter(
                    (table) => table.capacity === capacityFilter
                );
            }
        }

        setTables(filtered);
    }, [filters, allTables]);

    // Manejar cambios en los filtros para selects nativos
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Manejar cambios en los filtros para Select
    const handleSectionFilterChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            section: value,
        }));
    };

    // Manejar cambios en los filtros para select de capacidad
    const handleCapacityFilterChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            capacity: value,
        }));
    };

    // Limpiar filtros
    const clearFilters = () => {
        setFilters({
            status: "",
            section: "",
            capacity: "",
        });
    };

    // Obtener secciones y capacidades únicas para los selects (memoizados)
    const uniqueSections = useMemo(() => {
        return [...new Set(allTables.map((t) => t.section))].sort((a, b) => String(a).localeCompare(String(b)));
    }, [allTables]);
    const uniqueCapacities = useMemo(() => {
        return [...new Set(allTables.map((t) => t.capacity))].sort((a, b) => Number(a) - Number(b));
    }, [allTables]);

    // Función para cargar todas las estadísticas específicas del mesero actual
    const fetchStatistics = useCallback(async () => {
        if (!token || !user) return;

        // Obtener fecha de hoy para filtrar estadísticas del día actual
        const today = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD

        try {
            const [waiterOrdersStats, waiterTablesStats, lastOrders, tableCount] = await Promise.all([
                apiService.getWaiterOrdersStatistics(user.id, { start_date: today, end_date: today }),
                apiService.getWaiterTablesStatistics(user.id),
                apiService.getOrdersByWaiter(user.id, 5),
                apiService.getTablesCount(),
            ]);

            const ordersStats = waiterOrdersStats?.data?.statistics || {};
            const tablesStats = waiterTablesStats?.data?.statistics || {};
            const totalTables = tableCount?.data?.count || 0;

            const completedOrders = ordersStats.completed_orders || 0;
            const totalOrders = ordersStats.total_orders || 0;
            const pendingOrders = Math.max(0, totalOrders - completedOrders);
            const occupiedTables = tablesStats.active_sessions || 0;
            const totalSales = [
                { amount: ordersStats.completed_amount || 0 },
                (ordersStats.currency_conversions?.completed_amount_conversions) || { USD: 0, EUR: 0 },
            ];

            setStats({
                occupiedTables,
                totalTables,
                pendingOrders,
                totalSales,
                completedOrders,
                lastOrdersData: lastOrders || [],
            });
        } catch (error) {
            console.error("Error fetching waiter-specific statistics:", error);
        }
    }, [token, user, apiService]);

    // Cargar estadísticas cuando el componente se monta o cuando cambia al menú de resumen
    useEffect(() => {
        if (menu === 0) {
            fetchStatistics();
        }
    }, [menu, fetchStatistics]);

    return (
        <div className="min-h-[calc(100dvh-65px)] container mx-auto px-6 py-4 flex flex-col gap-7">
            <div className="flex justify-between items-center max-sm:flex-col">
                <h1 className="text-4xl font-bold text-gray-800 self-center max-md:mb-4">
                    Waiters
                </h1>
                <div className="flex gap-1">
                    <TabGroup>
                        <TabList variant="solid" className="bg-white shadow-lg">
                            <Tab
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[selected]:bg-orange-500 data-[selected]:text-white`}
                                onClick={() => setMenu(0)}
                                value="1"
                            >
                                Resumen
                            </Tab>
                            <Tab
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[selected]:bg-orange-500 data-[selected]:text-white`}
                                onClick={() => setMenu(1)}
                                value="2"
                            >
                                Mesas
                            </Tab>
                            <Tab
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[selected]:bg-orange-500 data-[selected]:text-white`}
                                onClick={() => setMenu(2)}
                                value="3"
                            >
                                Ordenes
                            </Tab>
                        </TabList>
                    </TabGroup>
                </div>
            </div>
            {menu === 0 && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <CardStatistics
                            title="Mesas<br/>Ocupadas"
                            value={stats.occupiedTables}
                            description={`de ${stats.totalTables} mesas`}
                        />
                        <CardStatistics
                            title="Pedidos<br/>Pendientes"
                            value={stats.pendingOrders}
                            description="por procesar"
                        />            
                        <Card className="mx-auto max-w-xs flex flex-col justify-around items-center text-center" decoration="top" decorationColor="#dbeafe">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 12a6 6 0 100-12 6 6 0 000 12z"></path>
                                </svg>
                            </div>
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Ventas<br/>Totales</p>
                            <div className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold"><MoneyTip exchangeRates={stats.totalSales} /></div>
                            <p className="text-[12px] mt-2 text-tremor-content">hoy</p>
                        </Card>            
                        <CardStatistics
                            title="Pedidos<br/>Completados"
                            value={stats.completedOrders}
                            description="hoy"
                        />
                    </div>
                    <div className="w-full h-full bg-white rounded-lg shadow-xl p-8 border">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                            Resumen Gestión
                        </h2>
                        <Card>
                            <h3 className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                Ultimos Pedidos
                            </h3>
                            <Table className="mt-5">
                                <TableHead>
                                    <TableRow>
                                        <TableHeaderCell>Orden</TableHeaderCell>
                                        <TableHeaderCell>Fecha</TableHeaderCell>
                                        <TableHeaderCell>
                                            Estado
                                        </TableHeaderCell>
                                        <TableHeaderCell>
                                            Importe
                                        </TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody className="relative">
                                    {stats.lastOrdersData.map((item, index) => (
                                        <TableRow
                                            key={`order-${
                                                item.id ||
                                                item.id_order ||
                                                index
                                            }`}
                                            className="relative"
                                        >
                                            <TableCell>
                                                {item.id_order}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    item.date
                                                ).toLocaleDateString() +
                                                    " " +
                                                    new Date(
                                                        item.date
                                                    ).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    color={
                                                        item.status_name ===
                                                        "Facturada"
                                                            ? "emerald"
                                                            : "orange"
                                                    }
                                                    icon={RiFlag2Line}
                                                >
                                                    {item.status_name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="relative"><MoneyTip exchangeRates={[
                                                { amount: item.total },
                                                item.total_conversions
                                            ]}/></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>
            )}
            {menu === 1 && (
                <div className="w-full h-full bg-white rounded-lg shadow-xl p-8 border">
                    <div className="flex justify-between items-center my-6 flex-col gap-5">
                        <h2 className="text-2xl font-semibold text-gray-700">
                            Panel de Mesas
                        </h2>
                        <div className="grid grid-flow-row w-10/12 gap-2">
                            <Button
                                className={`bg-inherit hover:bg-inherit border-black/5 hover:border hover:border-orange-300 text-gray-500  ${
                                    filters.status === "Activo"
                                        ? "border-orange-600"
                                        : ""
                                }`}
                                onClick={() =>
                                    setFilters((f) => ({
                                        ...f,
                                        status:
                                            f.status === "Activo"
                                                ? ""
                                                : "Activo",
                                    }))
                                }
                            >
                                Mesas Activas
                            </Button>
                            <Button
                                className={`bg-inherit hover:bg-inherit border-black/5 hover:border hover:border-orange-300 text-gray-500 ${
                                    filters.status === "Ocupado"
                                        ? "border-orange-600"
                                        : ""
                                }`}
                                onClick={() =>
                                    setFilters((f) => ({
                                        ...f,
                                        status:
                                            f.status === "Ocupado"
                                                ? ""
                                                : "Ocupado",
                                    }))
                                }
                            >
                                Mesas Inactivas
                            </Button>
                            <Select
                                className=""
                                value={filters.section}
                                onValueChange={handleSectionFilterChange}
                            >
                                <SelectItem value="">
                                    Todas las secciones
                                </SelectItem>
                                {uniqueSections.map((section, index) => (
                                    <SelectItem
                                        key={`section-${section}-${index}`}
                                        value={section}
                                    >
                                        {section}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                className="tabs xl:rounded-s-none col-start-1 sm:row-start-4 md:row-start-2 xl:col-start-4 xl:row-start-1 xl:col-span-1"
                                name="capacity"
                                value={filters.capacity}
                                onValueChange={handleCapacityFilterChange}
                            >
                                <SelectItem value="">
                                    Todas las capacidades
                                </SelectItem>
                                {uniqueCapacities.map((cap, index) => (
                                    <SelectItem
                                        key={`capacity-${cap}-${index}`}
                                        value={`${cap}`}
                                    >
                                        {cap}
                                    </SelectItem>
                                ))}
                            </Select>
                            <button
                                className="tabs bg-gray-200 hidden"
                                onClick={clearFilters}
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {tables.length > 0 ? (
                            tables.map((table) => (
                                <CardTable
                                    key={table.id_table}
                                    data={table}
                                    onTableUpdate={fetchTables}
                                />
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
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                        Panel de Ordenes
                    </h2>
                </div>
            )}
        </div>
    );
}
