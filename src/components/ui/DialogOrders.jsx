import React, { useState, useEffect, useCallback, useMemo } from "react";
import Loading from "../Loading/Loading";
import ApiService from "../../api";
import DetailsMenu from "./DetailsMenu";
import { useAuth } from "../../AuthContext";
import { Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Dialog, DialogPanel } from "@tremor/react";
import MoneyTip from "./MoneyTip";

export default function DialogOrder({ isOpen, setisOpen, data }) {
    const [isOpenControlled, setIsOpen] = useState(isOpen);
    const [loading, setLoading] = useState(false);
    const [menus, setMenus] = useState([]); // Estado para los items del menú
    const { user } = useAuth();
    const [filter, setFilter] = useState(''); // Estado para el filtro de búsqueda
    const [menusFiltered, setMenusFiltered] = useState([]); // Estado para los items del menú filtrados
    const [order, setOrder] = useState({}); // Estado para el pedido actual
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ message: null, type: '' });
    const [detailsMenuD, setDetailsMenuD] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null); // Estado para el menú seleccionado
    const [ShowDetailItem, setShowDetailItem] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState(null);
    const [itemDetail, setItemDetail] = useState("");
    const [mobileMode, setMobileMode] = useState(false); // Estado para el modo de pantalla
    const [hasLoaded, setHasLoaded] = useState(false);

    // Sincronizar el estado local con el prop isOpen
    useEffect(() => {
        setIsOpen(isOpen);
        if (isOpen && !hasLoaded) {
            setLoading(true);
        }
    }, [isOpen, hasLoaded]);

    // Filtrar los items del menú según el filtro
    useEffect(() => {
        if (filter !== '') {
            const filtered = menus.filter(item =>
                item.name.toLowerCase().includes(filter)
            );
            setMenusFiltered(filtered);
        } else {
            setMenusFiltered(menus);
        }
    }, [filter, menus]);

    const loadMenus = useCallback(() => {
        const apiService = new ApiService();
        apiService.getMenus()
            .then(data => {
                setMenus(data);
                setMenusFiltered(data);
                setHasLoaded(true);
            })
            .catch(error => {
                console.error("Error fetching menus:", error);
            })
            .finally(() => {
                setLoading(false);               
        });
    }, []);

    // Abrir el diálogo de detalles del menu
    const openDetailsMenu = (item) => {
        setDetailsMenuD(true);
        setSelectedMenuItem(item);
    };

    // Agregar item al pedido
    const handleOrderChange = (data) => {
        setOrder(prev => {
            const existingItem = prev[data.id_menu];
            if (existingItem) {
                // Mostrar notificación de item actualizado
                setNotification({ 
                    message: `"${data.name}" actualizado en el pedido`, 
                    type: 'success' 
                });
                // Limpiar la notificación después de 2 segundos
                setTimeout(() => {
                    setNotification({ message: null, type: '' });
                }, 2000);
                
                return {
                    ...prev,
                    [data.id_menu]: {
                        ...existingItem,
                        quantity: existingItem.quantity + 1,
                        discount: 0
                    }
                };
            } else {
                // Mostrar notificación de item agregado
                setNotification({ 
                    message: `"${data.name}" agregado al pedido`, 
                    type: 'success' 
                });
                // Limpiar la notificación después de 2 segundos
                setTimeout(() => {
                    setNotification({ message: null, type: '' });
                }, 2000);
                
                return {
                    ...prev,
                    [data.id_menu]: {
                        id_menu: data.id_menu,
                        name: data.name,
                        price: data.price,
                        price_conversions: data.price_conversions,
                        quantity: 1,
                        discount: 0
                    }
                };
            }
        });
    };

    // Quitar item del pedido
    const handleDecreaseItem = (itemId) => {
        setOrder(prev => {
            const existingItem = prev[itemId];
            if (existingItem.quantity > 1) {
                return {
                    ...prev,
                    [itemId]: {
                        ...existingItem,
                        quantity: existingItem.quantity - 1
                    }
                };
            } else {
                const newOrder = { ...prev };
                delete newOrder[itemId];
                return newOrder;
            }
        });
    };

    // Utilidades de item y conversiones (alineado con AddItemOrder)
    const getItemPrice = (item) => item?.price ?? item?.menu_price ?? item?.menu?.price;
    const getItemConversions = (item) => item.price_conversions ?? item?.total_conversions ?? item?.menu_price_conversions ?? item?.menu?.price_conversions;
    const getItemQty = (item) => item?.quantity ?? item?.qty ?? 1;

    const getSubtotalConversions = (item) => {
        const qty = getItemQty(item);
        const conversions = getItemConversions(item);
        if (!conversions) return null;
        const subtotalConversions = {};
        Object.entries(conversions).forEach(([currency, convertedValue]) => {
            subtotalConversions[currency] = (Number(convertedValue) || 0) * (Number(qty) || 0);
        });
        return subtotalConversions;
    };

    // Totales computados y conversiones del total
    const computedTotal = useMemo(() => {
        return Object.values(order).reduce((sum, it) => {
            const price = Number(getItemPrice(it)) || 0;
            const qty = Number(getItemQty(it)) || 0;
            return sum + price * qty;
        }, 0);
    }, [order]);

    const [totalConversions, setTotalConversions] = useState(null);

    useEffect(() => {
        const fetchTotalConversions = async () => {
            if (computedTotal === 0) {
                setTotalConversions(null);
                return;
            }
            try {
                const api = new ApiService();
                const conversions = await api.getConvertCurrency(computedTotal);
                setTotalConversions(conversions.conversions);
            } catch (err) {
                console.error("Error getting conversions:", err);
                setTotalConversions(null);
            }
        };
        fetchTotalConversions();
    }, [computedTotal]);

    // Guardar detalle para un menu de la orden
    const showItemDetails = (item) => {
        // Cerrar temporalmente el diálogo principal para evitar conflictos de eventos
        setIsOpen(false);
        setTimeout(() => {
            setShowDetailItem(true);
            setSelectedDetailItem(item);
            setItemDetail(item.detail || "");
        }, 100);
    };

    // Guardar el detalle
    const saveDetail = (detail) => {
        const updatedOrder = { ...order };
        updatedOrder[selectedDetailItem.id_menu] = {
            ...selectedDetailItem,
            detail: detail
        };
        setOrder(updatedOrder);
        setShowDetailItem(false);
        setItemDetail('');
        // Reabrir el diálogo principal
        setTimeout(() => {
            setIsOpen(true);
        }, 100);
    };

    // Confirma y guarda la orden
    const confirmAndSaveOrder = () => {
        setIsLoading(true);
        setNotification({ message: null, type: '' }); // Reset notification
        const apiService = new ApiService();

        const orderData = {
            id_table: data.id_table,
            id_waiter: user.id,
            items: Object.values(order).map(item => ({
                id_menu: item.id_menu,
                quantity: item.quantity,
                discount: item.discount,
                description: item.detail || "",
            })),
            id_type: Number(3),
        };

        apiService.createOrder(orderData)
            .then(response => {
                setNotification({ message: "Orden creada exitosamente", type: 'success' });
                setTimeout(() => {
                    closeDialog();
                    console.log(ShowDetailItem, detailsMenuD)
                }, 1500); // Close after 1.5s
            }).catch(error => {
                console.error("Error al crear la orden:", error);
                const errorMessage = error.response?.data?.detail || "Error al crear la orden. Intente de nuevo.";
                setNotification({ message: errorMessage, type: 'error' });
                setIsLoading(false); // Stop loading on error
            });
    };

    // Cerrar el diálogo
    const closeDialog = () => {
        if (ShowDetailItem || detailsMenuD) {
            return
        }
        setisOpen(false);
        setOrder({});
        setNotification({ message: null, type: '' });
    };

    useEffect(() => {
        if (isOpenControlled && data && !hasLoaded) {
            loadMenus();
        }
    }, [isOpenControlled, data, hasLoaded, loadMenus]);

    return(
        loading ? <div className="fixed bg-black/70 z-40  inset-0 flex justify-center items-center"><Loading /></div>: 
        <>
        {/* Notificaciones globales - disponibles para diálogo principal y modo móvil */}
        {notification.message && (
            <div className={`fixed top-5 right-5 z-[99999] p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {notification.message}
            </div>
        )}
        
        <Dialog open={isOpenControlled} onClose={closeDialog} static={true}>
            <DialogPanel className={`grid rounded-lg flex-col p-5 w-full max-w-5xl bg-white max-h-[92svh] overflow-y-auto overscroll-contain touch-pan-y`} style={{ WebkitOverflowScrolling: 'touch' }}>
                <h1 className="text-2xl font-bold text-center">Crear Orden para la mesa {data.number}</h1>
                <hr className="w-full mt-5"/>
                <div className="flex max-sm:flex-col sm:flex-row w-full sm:h-[70vh] h-[auto] min-h-0 gap-6 overflow-hidden">
                    <div className="sm:w-1/2 w-full sm:h-full h-auto flex flex-col justify-start items-start min-h-0 flex-grow">
                        <h2 className="text-xl font-bold my-5 w-full">Menú</h2>
                        {/* Botón para móviles para abrir el menú en overlay */}
                        <Button onClick={() => {
                            // Cerrar temporalmente el diálogo principal para evitar conflictos de eventos
                            setIsOpen(false);
                            setTimeout(() => {
                                setMobileMode(true);
                            }, 100);
                        }} className="sm:hidden mb-3">Ver Menú</Button>
                        {/* Panel de menú para pantallas medianas/grandes */}
                        <div className="hidden sm:flex sm:flex-col border rounded-lg p-3 w-full h-full min-h-0">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    value={filter}
                                    onChange={e => setFilter(e.target.value.toLowerCase())}
                                    type="text"
                                    placeholder="Buscar en el menú..."
                                    className="w-full p-1 border rounded-md"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {menusFiltered.map((item) => (
                                    <div key={item.id_menu} className="flex items-center justify-between border rounded p-2">
                                        <div>
                                            <div onClick={() => openDetailsMenu(item)} className="font-semibold cursor-pointer text-blue-900 hover:underline">{item.name}</div>
                                            <MoneyTip exchangeRates={[item.price, item.price_conversions]} />
                                            <p className="text-sm max-h-[22px] text-gray-500 mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                                        </div>
                                        <Button size="xs" onClick={() => handleOrderChange(item)} disabled={item.availability === false || (item.stock !== undefined && item.stock <= 0)}>
                                            Agregar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {detailsMenuD && selectedMenuItem && (
                                <DetailsMenu isDmOpen={detailsMenuD} setisDmOpen={setDetailsMenuD} data={selectedMenuItem} />
                            )}
                        </div>
                    </div>
                    <div className="sm:w-2/3 w-full sm:h-full h-auto flex flex-col justify-start items-start min-h-0 flex-grow">

                        <h2 className="text-xl font-bold my-5 w-full">Resumen del Pedido</h2>
                        <div className="p-4 pb-0 border rounded-lg shadow-md w-full sm:h-[80%] h-auto flex flex-col overflow-hidden">
                            {Object.keys(order).length > 0 ? (
                                <div className="tablepruv flex-grow overflow-x-auto w-full overflow-y-auto max-h-[50vh] sm:max-h-[380px] -mx-4 px-4">
                                    <Table className="min-w-[700px] w-full text-xs [&_td]:py-1 [&_th]:py-1 [&_td]:px-2 [&_th]:px-2 table-fixed">
                                        <TableHead>
                                            <TableRow>
                                                <TableHeaderCell className="w-[200px]">Item</TableHeaderCell>
                                                <TableHeaderCell className="text-right w-[80px]">Precio</TableHeaderCell>
                                                <TableHeaderCell className="text-right w-[60px]">Cant.</TableHeaderCell>
                                                <TableHeaderCell className="text-right w-[120px]">Acciones</TableHeaderCell>
                                                <TableHeaderCell className="text-right w-[100px]">Subtotal</TableHeaderCell>
                                                <TableHeaderCell className="text-right w-[80px]">Detalle</TableHeaderCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.values(order).map((item) => {
                                                const subtotal = (item.price || 0) * (item.quantity || 0);
                                                console.log(item)
                                                return (
                                                    <TableRow key={item.id_menu}>
                                                        <TableCell>{item.name}</TableCell>
                                                        <TableCell className="text-right">
                                                            <MoneyTip exchangeRates={[{ amount: item.price }, item.price_conversions]} />
                                                        </TableCell>
                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="inline-flex items-center gap-5">
                                                                <Button
                                                                    size="xs"
                                                                    variant="light"
                                                                    onClick={() => handleDecreaseItem(item.id_menu)}
                                                                >
                                                                    <span className="text-2xl font-bold">-</span>
                                                                </Button>
                                                                <Button
                                                                    size="xs"
                                                                    variant="light"
                                                                    className="text-lg font-bold"
                                                                    onClick={() => handleOrderChange(item)}
                                                                >
                                                                    <span className="text-2xl font-bold">+</span>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <MoneyTip exchangeRates={[{ amount: subtotal }, getSubtotalConversions(item)]} />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                        size="xs"
                                                                        variant="light"
                                                                        onClick={() => showItemDetails(item)}
                                                                        title={item.detail ? "Ver detalles: " + item.detail : "Agregar detalles"}
                                                                        className={item.detail ? "text-orange-600 hover:text-orange-700" : "text-blue-600 hover:text-blue-700"}
                                                                    >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={item.detail ? "#F59E0B" : "currentColor"} className="w-6 h-6">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                                                </svg>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex-grow text-gray-500">
                                    No hay items para mostrar.
                                </div>
                            )}

                            <div className="flex flex-col justify-between h-min w-full mb-5">
                                <hr className="w-full mt-5"/>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold">Platos Totales:</span>
                                        <span className={`${totalConversions ? '' : 'text-lg'}`}>
                                            {Object.values(order).reduce((acc, item) => acc + (item.quantity || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold">Total:</span>
                                        {totalConversions ? (
                                            <MoneyTip exchangeRates={[{ amount: computedTotal }, totalConversions]} />
                                        ) : (
                                            <span className="text-lg">${computedTotal.toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button 
                                        onClick={confirmAndSaveOrder} 
                                        className="border-none rounded-md bg-green-500 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Guardando...' : 'Guardar Orden'}
                                    </Button>
                                    <Button onClick={closeDialog} className="border-none rounded-md bg-red-500 hover:bg-red-700 text-white">Cancelar</Button>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </DialogPanel>
        </Dialog>
        
        {/* Overlay de menú para móviles */}
        {mobileMode && (
            <div className="fixed inset-0 z-[300] bg-black/70 flex justify-center items-center sm:hidden" onClick={() => {
                setMobileMode(false);
                // Reabrir el diálogo principal
                setTimeout(() => {
                    setIsOpen(true);
                }, 100);
            }}>
                <div className="bg-white rounded-lg shadow-lg w-11/12 h-[85%] p-3 flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            value={filter}
                            onChange={e => setFilter(e.target.value.toLowerCase())}
                            type="text"
                            placeholder="Buscar en el menú..."
                            className="w-full p-1 border rounded-md"
                        />
                        <Button onClick={() => {
                            setMobileMode(false);
                            // Reabrir el diálogo principal
                            setTimeout(() => {
                                setIsOpen(true);
                            }, 100);
                        }} className="clean p-1 w-32 h-[34px] rounded-md border-none bg-red-500 hover:bg-red-700 text-white">Cerrar</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {menusFiltered.map((item) => (
                            <div key={item.id_menu} className="flex items-center justify-between border rounded p-2">
                                <div>
                                    <div onClick={() => openDetailsMenu(item)} className="font-semibold cursor-pointer text-blue-900 hover:underline">{item.name}</div>
                                    <MoneyTip exchangeRates={[item.price, item.price_conversions]} />
                                    <p className="text-sm max-h-[22px] text-gray-500 mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                                </div>
                                <Button size="xs" onClick={() => handleOrderChange(item)} disabled={item.availability === false || (item.stock !== undefined && item.stock <= 0)}>
                                    Agregar
                                </Button>
                            </div>
                        ))}
                    </div>
                    {detailsMenuD && selectedMenuItem && (
                        <DetailsMenu isDmOpen={detailsMenuD} setisDmOpen={setDetailsMenuD} data={selectedMenuItem} />
                    )}
                </div>
            </div>
        )}
        {ShowDetailItem && (
            <div 
                className="fixed inset-0 bg-black/70 z-[99999] flex justify-center items-center p-4"
                onClick={() => {
                    setShowDetailItem(false);
                    // Reabrir el diálogo principal
                    setTimeout(() => {
                        setIsOpen(true);
                    }, 100);
                }}
            >
                <div 
                    className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-xl font-bold mb-4">Agregar Detalle a {selectedDetailItem.name}</h2>
                    <textarea
                        className="w-full p-3 border rounded-md text-base resize-none"
                        placeholder="El cliente es alerfico a..."
                        value={itemDetail}
                        onChange={(e) => setItemDetail(e.target.value)}
                        rows="3"
                        style={{ fontSize: '16px' }}
                        autoFocus
                    />
                    <div className="flex justify-end gap-4 mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowDetailItem(false);
                                // Reabrir el diálogo principal
                                setTimeout(() => {
                                    setIsOpen(true);
                                }, 100);
                            }}
                            onTouchStart={() => {}}
                            className="px-6 py-3 border-none rounded-md bg-gray-500 active:bg-gray-600 text-white text-base font-medium cursor-pointer select-none"
                            style={{ minWidth: '120px', WebkitTapHighlightColor: 'transparent' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => saveDetail(itemDetail)}
                            onTouchStart={() => {}}
                            className="px-6 py-3 border-none rounded-md bg-green-500 active:bg-green-600 text-white text-base font-medium cursor-pointer select-none"
                            style={{ minWidth: '120px', WebkitTapHighlightColor: 'transparent' }}
                        >
                            Guardar Detalle
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}