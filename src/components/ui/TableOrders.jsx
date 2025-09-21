import React, { useState, useMemo } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine, RiFlag2Line, RiSearchLine, RiCalendarLine, RiFilter3Line } from '@remixicon/react';
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Badge, Select, SelectItem, TextInput, Card, Flex, Text, Button } from '@tremor/react';
import MoneyTip from './MoneyTip';
import { useAuth } from '../../AuthContext';
import AddItemOrder from './AddItemOrder';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ButtonPagination = ({ onClick, disabled, children }) => {
  return (
    <button
      type="button"
      className="group px-2.5 py-2 text-tremor-default disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const createOrdersColumns = (user, actions) => [
  {
    header: "ID",
    accessorKey: "id_order",
    meta: {
      align: 'text-right',
    },
  },
  {
    header: "Fecha",
    accessorKey: "date",
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => {
      const date = row.original.date;
      if (!date) return '';
      return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    },
  },
  {
    header: "Estado",
    accessorKey: "status_name",
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => {
      const status = row.original.status_name;
      return (
        <Badge
          color={
            status === "Facturada"
              ? "emerald"
              : status === "Anulado"
              ? "red"
              : "orange"
          }
          icon={RiFlag2Line}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    header: "Mesa",
    accessorKey: "id_table",
    meta: {
      align: 'text-right',
    },
  },
  {
    header: "Artículos",
    accessorKey: "items_count",
    meta: {
      align: 'text-right',
    },
  },
  {
    header: "Total",
    accessorKey: "total",
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => {
      const total = row.original.total;
      return (
        <MoneyTip exchangeRates={[
          { amount: total },
          row.original.total_conversions
        ]}/>
      );
    },
  },
  {
    header: "Acciones",
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => {
      const isAdmin = user && (user.role === 1);
      const isWaiter = user && (user.role === 2);
      
      // Fallback para pruebas - mostrar botones si no hay usuario o rol no reconocido
      const showForTesting = !user || (!isAdmin && !isWaiter);
      
      // Deshabilitar acciones si la orden está facturada
      const NotTouch = row.original.status_name === "Facturada" || row.original.status_name === "Anulado";
      
      const handleAddItem = () => {
        const orderId = row.original.id_order;
        console.log('Agregar item a orden:', orderId);
        if (actions && typeof actions.onAddItem === 'function') {
          actions.onAddItem(orderId);
        }
      };
      
      const handleEditOrder = () => {
        console.log('Editar orden:', row.original.id_order);
        // Implementar lógica para editar orden
      };
      
      const handleDeleteOrder = () => {
        console.log('Eliminar orden:', row.original.id_order);
        // Implementar lógica para eliminar orden
      };
      
      return (
        <Select
          value=""
          onValueChange={(value) => {
            if (value === 'add') handleAddItem();
            if (value === 'edit') handleEditOrder();
            if (value === 'delete') handleDeleteOrder();
          }}
          className="w-24 text-xs border border-gray-500 rounded-lg"
          placeholder="Acciones"
          disabled={NotTouch}
        >
          <SelectItem value="">Acciones</SelectItem>
          {(isAdmin || isWaiter || showForTesting) && !NotTouch && (
            <SelectItem value="add">Agregar Item</SelectItem>
          )}
          {(isAdmin || showForTesting) && !NotTouch && (
            <SelectItem value="edit">Modificar Orden</SelectItem>
          )}
          {(isAdmin || showForTesting) && !NotTouch && (
            <SelectItem value="delete" className="text-red-600">Eliminar Orden</SelectItem>
          )}
        </Select>
      );
    },
  },
];

export default function TableOrders({ data = [] }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const pageSize = window.innerWidth < 768 ? 5 : 8;
  
  // Estados para filtros
  const [searchId, setSearchId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar datos basado en los filtros aplicados
  const filteredData = useMemo(() => {
    return data.filter(order => {
      // Filtro por ID
      if (searchId && !order.id_order.toString().includes(searchId)) {
        return false;
      }
      
      // Filtro por estado
      if (filterStatus && order.status_name !== filterStatus) {
        return false;
      }
      
      // Filtro por mesa
      if (filterTable && !order.id_table.toString().includes(filterTable)) {
        return false;
      }
      
      // Filtro por rango de fechas
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && orderDate < fromDate) {
          return false;
        }
        
        if (toDate) {
          // Añadir un día al toDate para incluir todo el día seleccionado
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (orderDate > endOfDay) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [data, searchId, filterStatus, filterTable, dateFrom, dateTo]);

  // Obtener estados únicos para el filtro
  const uniqueStatuses = useMemo(() => {
    return [...new Set(data.map(order => order.status_name).filter(Boolean))];
  }, [data]);
  
  // Obtener mesas únicas para el filtro
  const uniqueTables = useMemo(() => {
    return [...new Set(data.map(order => order.id_table).filter(Boolean))].sort((a, b) => a - b);
  }, [data]);

  const ordersColumns = createOrdersColumns(user, {
    onAddItem: (orderId) => {
      setSelectedOrderId(orderId);
      setIsOpen(true);
    },
  });

  const table = useReactTable({
    data: filteredData,
    columns: ordersColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: pageSize,
      },
    },
  });

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchId('');
    setFilterStatus('');
    setFilterTable('');
    setDateFrom('');
    setDateTo('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = searchId || filterStatus || filterTable || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Sección de filtros */}
      <Card className="p-4 border border-gray-200">
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Text className="text-lg font-semibold">Filtros de Búsqueda</Text>
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
            placeholder="Buscar por ID de orden..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full border border-gray-200 focus:ring-2 focus:ring-orange-500"
          />
        </div>
        
        {/* Filtros avanzados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Text className="text-sm font-medium mb-2">Estado</Text>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
                placeholder="Todos los estados"
              >
                <SelectItem value="">Todos los estados</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </Select>
            </div>
            
            <div>
              <Text className="text-sm font-medium mb-2">Mesa</Text>
              <Select
                value={filterTable}
                onValueChange={setFilterTable}
                placeholder="Todas las mesas"
              >
                <SelectItem value="">Todas las mesas</SelectItem>
                {uniqueTables.map(table => (
                  <SelectItem key={table} value={table.toString()}>Mesa {table}</SelectItem>
                ))}
              </Select>
            </div>
            
            <div>
              <Text className="text-sm font-medium mb-2">Fecha Desde</Text>
              <TextInput
                type="date"
                icon={RiCalendarLine}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-200 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <Text className="text-sm font-medium mb-2">Fecha Hasta</Text>
              <TextInput
                type="date"
                icon={RiCalendarLine}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-200 [&>input]:focus:ring-2 [&>input]:focus:ring-orange-500"
              />
            </div>
          </div>
        )}
        
        {/* Resultados y acciones */}
        <Flex justifyContent="between" alignItems="center" className="mt-4">
          <Text className="text-sm text-gray-600">
            Mostrando {filteredData.length} de {data.length} órdenes
            {hasActiveFilters && ' (con filtros aplicados)'}
          </Text>
          
          {hasActiveFilters && (
            <Button
              variant="light"
              size="xs"
              onClick={clearFilters}
            >
              Limpiar Filtros
            </Button>
          )}
        </Flex>
      </Card>
      
      <div className="overflow-x-auto">
      <Table className="min-w-full text-sm">
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-tremor-border dark:border-dark-tremor-border"
            >
              {headerGroup.headers.map((header) => (
                <TableHeaderCell
                  key={header.id}
                  scope="col"
                  className={classNames(
                    header.column.columnDef.meta.align,
                    'px-3 py-2 text-xs font-medium'
                  )}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHeaderCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow 
              key={row.id}
              className="hover:bg-gray-100"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={classNames(
                    cell.column.columnDef.meta.align,
                    'px-3 py-2 text-xs'
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-10 flex items-center justify-between">
        <p className="text-tremor-default tabular-nums text-tremor-content dark:text-dark-tremor-content">
          Pagina{' '}
          <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">{`${
            table.getState().pagination.pageIndex + 1
          }`}</span>{' '}
          de
          <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {' '}
            {`${table.getPageCount()}`}
          </span>
        </p>
        <div className="inline-flex items-center rounded-tremor-full shadow-tremor-input ring-1 ring-inset ring-tremor-ring dark:shadow-dark-tremor-input dark:ring-dark-tremor-ring">
          <ButtonPagination
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Previous</span>
            <RiArrowLeftSLine
              className="size-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
              aria-hidden={true}
            />
          </ButtonPagination>
          <span
            className="h-5 border-r border-tremor-border dark:border-dark-tremor-border"
            aria-hidden={true}
          />
          <ButtonPagination
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Next</span>
            <RiArrowRightSLine
              className="size-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
              aria-hidden={true}
            />
          </ButtonPagination>
        </div>
      </div>
      
      {/* Modal para agregar items a la orden */}
      <AddItemOrder 
        isOpen={isOpen} 
        orderId={selectedOrderId}
        onClose={() => {
          setIsOpen(false);
          setSelectedOrderId(null);
        }} 
      />
      </div>
    </div>
  );
}