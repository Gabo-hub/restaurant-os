import React, { useState, useEffect, useCallback, useMemo } from "react";

import ApiService from "../../api";
import { useAuth } from "../../AuthContext";

import CardTable from "../ui/CardTables";
import MoneyTip from "../ui/MoneyTip";
import CardStatistics from "../ui/CardStatistics";
import TableOrders from "../ui/TableOrders";

import { Button, Select, SelectItem, Tab, TabGroup, TabList, TextInput, Flex, Text } from "@tremor/react";
import { RiFlag2Line, RiSearchLine, RiFilter3Line, RiCalendarLine } from "@remixicon/react";
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
        searchId: "",
    }); // Estado para los filtros
    const [showFilters, setShowFilters] = useState(false); // Controlar visibilidad de filtros avanzados
    const [orders, setOrders] = useState([]);
    
    // Estados para el panel de menús
    const [menus, setMenus] = useState([]); // Todos los menús originales
    const [filteredMenus, setFilteredMenus] = useState([]); // Menús filtrados
    const [menuFilter, setMenuFilter] = useState(''); // Filtro de búsqueda para menús
    const [selectedMenu, setSelectedMenu] = useState(null); // Menú seleccionado para ver detalles
    const [showMenuDetails, setShowMenuDetails] = useState(false); // Controlar visibilidad del diálogo de detalles
    const [menusLoading, setMenusLoading] = useState(false); // Estado de carga para menús

    // Estados para las estadísticas
    const [stats, setStats] = useState({
        occupiedTables: 0,
        totalTables: 0,
        pendingOrders: 0,
        totalSales: [{amount: 0}, {USD: 0, EUR: 0}],
        completedOrders: 0,
        lastOrdersData: [],
    });

    const apiService = useMemo(() => new ApiService(), []);

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

    const fetchMenus = useCallback(async () => {
        if (!token) return;
        setMenusLoading(true);
        try {
            const data = await apiService.getMenus();
            setMenus(data);
            setFilteredMenus(data);
        } catch (error) {
            console.error("Error fetching menus:", error);
        } finally {
            setMenusLoading(false);
        }
    }, [token, apiService]);

    // Cargar datos al cambiar de menú
    useEffect(() => {
        if (menu === 1) {
            fetchTables();
        } else if (menu === 3) {
            fetchMenus();
        } else if (menu === 0 || menu === 2) {
            setAllTables([]);
            setTables([]);
            setMenus([]);
            setFilteredMenus([]);
        }
    }, [menu, fetchTables, fetchMenus]);

    // Filtrar mesas cuando cambian los filtros o las mesas originales
    useEffect(() => {
        let filtered = [...allTables];

        // Filtrar por ID de mesa
        if (filters.searchId) {
            filtered = filtered.filter((table) => 
                table.id_table.toString().includes(filters.searchId)
            );
        }

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

    // Filtrar menús cuando cambia el filtro de búsqueda o los menús originales
    useEffect(() => {
        let filtered = [...menus];

        // Filtrar por nombre de menú
        if (menuFilter) {
            filtered = filtered.filter((menu) =>
                menu.name?.toLowerCase().includes(menuFilter.toLowerCase())
            );
        }

        setFilteredMenus(filtered);
    }, [menuFilter, menus]);


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

    // Manejar cambios en la búsqueda por ID
    const handleSearchIdChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            searchId: value,
        }));
    };

    // Limpiar filtros
    const clearFilters = () => {
        setFilters({
            status: "",
            section: "",
            capacity: "",
            searchId: "",
        });
    };

    // Verificar si hay filtros activos
    const hasActiveFilters = filters.status || filters.section || filters.capacity || filters.searchId;

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
            console.log(totalOrders, completedOrders);
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

    const fetchOrders = useCallback(async () => {
        if (!token || !user) return;

        try {
            const orders = await apiService.getOrdersByWaiter(user.id);
            setOrders(orders || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    }, [token, user, apiService]);

    useEffect(() => {
        if (menu === 2) {
            fetchOrders();
        }
    }, [menu, fetchOrders]);

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
                            <Tab
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[selected]:bg-orange-500 data-[selected]:text-white`}
                                onClick={() => setMenu(3)}
                                value="4"
                            >
                                Menús
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
                <div className="w-full h-full bg-white rounded-lg shadow-xl p-6 border space-y-6">
                    {/* Sección de filtros moderna */}
                    <Card className="p-4 border border-gray-200">
                        <Flex justifyContent="between" alignItems="center" className="mb-4">
                            <Text className="text-lg font-semibold">Filtros de Mesas</Text>
                            <Button
                                variant="light"
                                size="xs"
                                icon={RiFilter3Line}
                                className="text-orange-500 hover:text-orange-700"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                            </Button>
                        </Flex>
                        
                        {/* Búsqueda rápida por ID */}
                        <div className="mb-4">
                            <TextInput
                                icon={RiSearchLine}
                                placeholder="Buscar por ID de mesa..."
                                value={filters.searchId}
                                onChange={(e) => handleSearchIdChange(e.target.value)}
                                className="w-full border border-gray-200 focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        
                        {/* Botones rápidos de estado */}
                        <div className="flex gap-2 mb-4">
                            <Button
                                className={`flex-1 ${filters.status === "Disponible" ? "bg-orange-500 text-white" : "bg-white text-gray-700"} border border-gray-200 transition-colors duration-300 hover:bg-orange-500 border-none hover:text-white focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50`}
                                onClick={() =>
                                    setFilters((f) => ({
                                        ...f,
                                        status:
                                            f.status === "Disponible"
                                                ? ""
                                                : "Disponible",
                                    }))
                                }
                            >
                                Disponibles
                            </Button>
                            <Button
                                className={`flex-1 ${filters.status === "Asignada" ? "bg-orange-500 text-white" : "bg-white text-gray-700"} border border-gray-200 transition-colors duration-200 hover:bg-orange-500 border-none hover:text-white focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50`}
                                onClick={() =>
                                    setFilters((f) => ({
                                        ...f,
                                        status:
                                            f.status === "Asignada"
                                                ? ""
                                                : "Asignada",
                                    }))
                                }
                            >
                                Ocupadas
                            </Button>
                        </div>
                        
                        {/* Filtros avanzados */}
                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Text className="text-sm font-medium mb-2">Sección</Text>
                                    <Select
                                        value={filters.section}
                                        onValueChange={handleSectionFilterChange}
                                        placeholder="Todas las secciones"
                                        className="border border-gray-200"
                                    >
                                        <SelectItem value="">Todas las secciones</SelectItem>
                                        {uniqueSections.map((section, index) => (
                                            <SelectItem
                                                key={`section-${section}-${index}`}
                                                value={section}
                                            >
                                                {section}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                                
                                <div>
                                    <Text className="text-sm font-medium mb-2">Capacidad</Text>
                                    <Select
                                        value={filters.capacity}
                                        onValueChange={handleCapacityFilterChange}
                                        placeholder="Todas las capacidades"
                                        className="border border-gray-200"
                                    >
                                        <SelectItem value="">Todas las capacidades</SelectItem>
                                        {uniqueCapacities.map((cap, index) => (
                                            <SelectItem
                                                key={`capacity-${cap}-${index}`}
                                                value={`${cap}`}
                                            >
                                                {cap} personas
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        )}
                        
                        {/* Resultados y acciones */}
                        <Flex justifyContent="between" alignItems="center" className="mt-4">
                            <Text className="text-sm text-gray-600">
                                Mostrando {tables.length} de {allTables.length} mesas
                                {hasActiveFilters && ' (con filtros aplicados)'}
                            </Text>
                            
                            {hasActiveFilters && (
                                <Button
                                    variant="light"
                                    size="xs"
                                    onClick={clearFilters}
                                    className="text-orange-500 hover:text-orange-700"
                                >
                                    Limpiar Filtros
                                </Button>
                            )}
                        </Flex>
                    </Card>
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
                    <TableOrders data={orders} user={user} />
                </div>
            )}
            {menu === 3 && (
                <div className="w-full h-full bg-white rounded-lg shadow-xl p-8 border">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                        Panel de Menús
                    </h2>
                    
                    {/* Barra de búsqueda */}
                    <div className="mb-6">
                        <TextInput
                            icon={RiSearchLine}
                            placeholder="Buscar menús por nombre..."
                            value={menuFilter}
                            onChange={(e) => setMenuFilter(e.target.value)}
                            className="w-full max-w-md"
                        />
                    </div>
                    
                    {/* Grid de menús */}
                    {menusLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Cargando menús...</p>
                            </div>
                        </div>
                    ) : filteredMenus.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredMenus.map((menu) => (
                                <Card 
                                    key={menu.id_menu} 
                                    className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                    onClick={() => {
                                        setSelectedMenu(menu);
                                        setShowMenuDetails(true);
                                    }}
                                >
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-semibold text-gray-800 truncate">
                                                {menu.name}
                                            </h3>
                                            <MoneyTip 
                                                exchangeRates={[{ amount: menu.price }, menu.price_conversions]} 
                                                className="text-sm"
                                            />
                                        </div>
                                        
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {menu.description || 'Sin descripción disponible'}
                                        </p>
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">
                                                    {menu.allegers?.length || 0} alérgenos
                                                </span>
                                            </div>
                                            <Button
                                                size="xs"
                                                variant="light"
                                                className="text-orange-600 hover:text-orange-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedMenu(menu);
                                                    setShowMenuDetails(true);
                                                }}
                                            >
                                                Ver detalles
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg">
                                {menuFilter ? 'No se encontraron menús que coincidan con tu búsqueda.' : 'No hay menús disponibles.'}
                            </p>
                            {menuFilter && (
                                <Button
                                    variant="light"
                                    className="mt-4 text-orange-600 hover:text-orange-700"
                                    onClick={() => setMenuFilter('')}
                                >
                                    Limpiar búsqueda
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {/* Diálogo de detalles del menú */}
            {showMenuDetails && selectedMenu && (
                <div className='fixed z-40 top-0 left-0 w-full h-full flex justify-center items-center'>
                    {showMenuDetails && selectedMenu && (
                        <div onClick={() => setShowMenuDetails(false)} className="fixed bg-[#00000021] z-40 inset-0 flex justify-center items-center">
                            <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedMenu.name}</h2>
                                    <MoneyTip exchangeRates={[{ amount: selectedMenu.price }, selectedMenu.price_conversions]} />
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Descripción</h3>
                                        <p className="text-gray-600">
                                            {selectedMenu.description || 'No hay descripción disponible'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Componentes alérgenos</h3>
                                        {selectedMenu.allegers && selectedMenu.allegers.length > 0 ? (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {selectedMenu.allegers.map((alleger, index) => (
                                                        <li key={index} className="text-red-700">{alleger}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <p className="text-green-700">No hay componentes alérgenos</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-4 border-t">
                                        <div className="text-sm text-gray-500">
                                            ID: {selectedMenu.id_menu}
                                        </div>
                                        <Button
                                            onClick={() => setShowMenuDetails(false)}
                                            className="border-none bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Cerrar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
