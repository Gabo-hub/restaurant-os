import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogPanel, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, TextInput, Badge } from "@tremor/react";
import ApiService from "../../api";
import MoneyTip from "./MoneyTip";

const AddItemOrder = ({ isOpen, orderId, onClose }) => {
    const [isOpenControlled, setIsOpen] = useState(isOpen);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [loadingMenus, setLoadingMenus] = useState(false);
    const [, setOrder] = useState(null); 
    const [menus, setMenus] = useState([]);  
    const [filter, setFilter] = useState("");
    const [saving, setSaving] = useState(false);
    const [stagedItems, setStagedItems] = useState({});
    const [baselineQty, setBaselineQty] = useState({});
    
    // Estados para el diálogo de detalles
    const [showDetailItem, setShowDetailItem] = useState(false);
    const [itemDetail, setItemDetail] = useState("");
    const [selectedDetailItem, setSelectedDetailItem] = useState(null);
    
    // Estados para el modo móvil y notificaciones
    const [mobileMode, setMobileMode] = useState(false);
    const [notification, setNotification] = useState({ message: null, type: '' });
    
    // Bandera para controlar la recarga de la orden
    const [shouldReloadOrder, setShouldReloadOrder] = useState(true);

    useEffect(() => {
        setIsOpen(isOpen);
    }, [isOpen]);
    
    useEffect(() => {
        if (!isOpenControlled) return;
        setLoadingMenus(true);
        const api = new ApiService();
        api.getMenus()
            .then(data => setMenus(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error fetching menus:", err))
            .finally(() => setLoadingMenus(false));
    }, [isOpenControlled]);

    const loadOrder = useCallback(() => {
        if (!orderId) return;
        setLoadingOrder(true);
        const api = new ApiService();
        api.getOrder(orderId)
            .then(data => {
                setOrder(data);
                const details = data?.items || data?.details || data?.order_items || [];
                const list = Array.isArray(details) ? details : (details && typeof details === 'object' ? Object.values(details) : []);
                const initial = {};
                const base = {};    

                list.forEach((it) => {
                    const idMenu = it.id_menu || it.menu?.id_menu;
                    if (!idMenu) return;
                    initial[idMenu] = {
                        id_menu: idMenu,
                        name: it.name || it.menu_name || it.menu?.name,
                        price: it.price ?? it.menu_price ?? it.menu?.price ?? 0,
                        price_conversions: it.total_conversions ?? it.menu_price_conversions ?? it.menu?.price_conversions ?? null,
                        quantity: it.quantity ?? it.qty ?? 1,
                        discount: it.discount ?? 0,
                        description: it.detail || it.description || "",
                    };
                    base[idMenu] = initial[idMenu].quantity;
                });
                setStagedItems(initial);
                setBaselineQty(base);
            })
            .catch(err => console.error("Error fetching order:", err))
            .finally(() => setLoadingOrder(false));
    }, [orderId, setOrder, setLoadingOrder]);

    useEffect(() => {
        if (isOpenControlled && orderId && shouldReloadOrder) {
            loadOrder();
            setShouldReloadOrder(false); 
        }
    }, [isOpenControlled, orderId, loadOrder, shouldReloadOrder]);

    const handleClose = () => {
        if (showDetailItem) {
            return;
        }
        setIsOpen(false);
        setNotification({ message: null, type: '' });
        setShouldReloadOrder(true);
        onClose();
    };

    const menusFiltered = useMemo(() => {
        const f = filter.trim().toLowerCase();
        if (!f) return menus;
        return menus.filter(m => m.name?.toLowerCase().includes(f));
    }, [menus, filter]);

    const handleAddMenuToOrder = (menuItem) => {
        const id = menuItem.id_menu;
        setStagedItems((prev) => {
            const current = { ...prev };
            if (!current[id]) {
                setNotification({ 
                    message: `"${menuItem.name}" agregado al pedido`, 
                    type: 'success' 
                });
                setTimeout(() => {
                    setNotification({ message: null, type: '' });
                }, 2000);
                
                current[id] = {
                    id_menu: id,
                    name: menuItem.name,
                    price: menuItem.price,
                    price_conversions: menuItem.total_conversions ?? menuItem.price_conversions ?? null,
                    quantity: 1,
                    discount: 0,
                    description: "",
                };
            } else {
                setNotification({ 
                    message: `"${menuItem.name}" actualizado en el pedido`, 
                    type: 'success' 
                });
                setTimeout(() => {
                    setNotification({ message: null, type: '' });
                }, 2000);
                
                current[id] = { ...current[id], quantity: (current[id].quantity || 0) + 1 };
            }
            return current;
        });
    };

    const increaseQty = (id_menu) => {
        setStagedItems((prev) => ({
            ...prev,
            [id_menu]: { ...prev[id_menu], quantity: (prev[id_menu].quantity || 0) + 1 },
        }));
    };

    const decreaseQty = (id_menu) => {
        setStagedItems((prev) => {
            const current = { ...prev };
            const item = current[id_menu];
            if (!item) return prev;
            const minQty = baselineQty[id_menu] ?? 0;
            const newQty = (item.quantity || 0) - 1;
            if (newQty < minQty) {
                current[id_menu] = { ...item, quantity: minQty };
            } else if (newQty <= 0 && minQty === 0) {
                delete current[id_menu];
            } else {
                current[id_menu] = { ...item, quantity: newQty };
            }
            return current;
        });
    };

    const showItemDetails = (item) => {
        setIsOpen(false);
        setTimeout(() => {
            setShowDetailItem(true);
            setSelectedDetailItem(item);
            console.log(item);
            setItemDetail(item.description || "");
        }, 100);
    };

    const saveDetail = (detail) => {
        const item = selectedDetailItem;
        const isOriginalItem = baselineQty[item.id_menu] > 0;
        if (isOriginalItem) {
            return;
        }

        const updatedStagedItems = { ...stagedItems };
        updatedStagedItems[item.id_menu] = {
            ...item,
            description: detail
        };
        setStagedItems(updatedStagedItems);
        setShowDetailItem(false);
        setItemDetail('');
        setTimeout(() => {
            setIsOpen(true);
        }, 100);
    };

    const confirmSave = async () => {
        if (!orderId) return;
        setSaving(true);
        const api = new ApiService();
        
        try {
            const currentOrder = await api.getOrder(orderId);
            const currentItems = currentOrder?.items || currentOrder?.details || currentOrder?.order_items || [];
            
            const stagedItemsArray = Object.values(stagedItems);
            
            for (const item of stagedItemsArray) {
                const existingItem = currentItems.find(currentItem => 
                    currentItem.id_menu === item.id_menu
                );
                
                if (existingItem) {
                    await api.updateOrderItem(orderId, existingItem.id_detail_order, {
                        id_menu: item.id_menu,
                        quantity: item.quantity,
                        discount: item.discount || 0,
                        description: item.description || ""
                    });
                } else {
                    await api.addItemToOrder(orderId, {
                        id_menu: item.id_menu,
                        quantity: item.quantity,
                        discount: item.discount || 0,
                        description: item.description || ""
                    });
                }
            }
            setNotification({ message: "Items agregados exitosamente", type: 'success' });
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            console.error("Error updating order:", err);
            setSaving(false);
            setNotification({ message: "Error al agregar items a la orden. Intente de nuevo.", type: 'error' });
            setTimeout(() => {
                handleClose();
            }, 1500);
        }
    };

    const getItemName = (item) => item?.name || item?.menu_name || item?.menu?.name || "—";
    const getItemPrice = (item) => item?.price ?? item?.menu_price ?? item?.menu?.price;
    const getItemConversions = (item) => item.price_conversions ?? item?.total_conversions ?? item?.menu_price_conversions ?? item?.menu?.price_conversions;
    
    const getItemQty = (item) => item?.quantity ?? item?.qty ?? 1;
    
    const getSubtotalConversions = (item) => {
        const qty = getItemQty(item);
        const conversions = getItemConversions(item);

        if (!conversions) {
            return null;
        }
        
        const subtotalConversions = {};
        Object.entries(conversions).forEach(([currency, convertedValue]) => {
            subtotalConversions[currency] = (Number(convertedValue) || 0) * (Number(qty) || 0);
        });  
        return subtotalConversions;
    };
    
    const currentItems = useMemo(() => {
        return Object.values(stagedItems);
    }, [stagedItems]);

    const computedTotal = useMemo(() => {
        return currentItems.reduce((sum, it) => {
            const price = Number(getItemPrice(it)) || 0;
            const qty = Number(getItemQty(it)) || 0;
            return sum + price * qty;
        }, 0);
    }, [currentItems]);
    
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

    return (
        <>
            <Dialog
                open={isOpenControlled}
                onClose={handleClose}
                static={true}
                className="z-[100]"
            >
            <DialogPanel className={`grid rounded-lg flex-col p-5 w-full max-w-5xl bg-white max-h-[92svh] overflow-y-auto overscroll-contain touch-pan-y`} style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Agregar items a la orden #{orderId}</h2>
                </div>

                <div className="flex max-sm:flex-col sm:flex-row w-full sm:h-[63vh] h-[auto] min-h-0 gap-6 overflow-hidden">
                    {/* Lista de Menús */}
                    <div className="sm:w-1/2 w-full sm:h-full h-auto flex flex-col justify-start items-start min-h-0 flex-grow">
                        <h2 className="text-xl font-bold w-full">Menú</h2>
                        <Button onClick={() => {
                            setShouldReloadOrder(false);
                            setIsOpen(false);
                            setTimeout(() => {
                                setMobileMode(true);
                            }, 100);
                        }} className="sm:hidden mb-3">Ver Menú</Button>
                        {/* Panel de menú para pantallas medianas/grandes */}
                        <div className="hidden sm:flex sm:flex-col border rounded-lg p-3 w-full h-full min-h-0">
                        <div className="flex items-center gap-2 mb-3">
                            <TextInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar en el menú..." className="w-full" />
                            {loadingMenus && <Badge color="gray">Cargando...</Badge>}
                        </div>
                        <div className="max-h-[380px] overflow-y-auto space-y-2">
                            {menusFiltered.map((m) => (
                                <div key={m.id_menu} className="flex items-center justify-between border rounded p-2">
                                    <div>
                                        <div className="font-medium leading-tight">{m.name}</div>
                                        <MoneyTip exchangeRates={[m.price, m.price_conversions]} />
                                        <p className="text-sm max-h-[22px] text-gray-500 mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.description}</p>
                                    </div>
                                    <Button size="xs" onClick={() => handleAddMenuToOrder(m)} disabled={m.availability === false || (m.stock !== undefined && m.stock <= 0)}>
                                        Agregar
                                    </Button>
                                </div>
                            ))}
                            {menusFiltered.length === 0 && !loadingMenus && (
                                <div className="text-xs text-gray-500">No hay menús para mostrar.</div>
                            )}
                        </div>
                        </div>
                    </div>

                    {/* Items actuales de la Orden */}
                    <div className="sm:w-2/3 w-full sm:h-full h-auto flex flex-col justify-start items-start min-h-0 flex-grow">
                        <h2 className="text-xl font-bold w-full">Items actuales</h2>
                        <div className="flex flex-col border rounded-lg p-3 w-full h-full min-h-0 shadow-md">
                        <div className="flex items-center justify-between mb-2">
                            {loadingOrder && <Badge color="gray">Actualizando...</Badge>}
                        </div>
                        <div className="overflow-x-auto max-h-[380px]">
                            <Table className="min-w-full text-xs">
                                <TableHead>
                                    <TableRow>
                                        <TableHeaderCell>Item</TableHeaderCell>
                                        <TableHeaderCell className="text-right">Precio</TableHeaderCell>
                                        <TableHeaderCell className="text-right">Cant.</TableHeaderCell>
                                        <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
                                        <TableHeaderCell className="text-right">Subtotal</TableHeaderCell>
                                        <TableHeaderCell className="text-right">Detalle</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentItems.map((it, idx) => {
                                        const price = getItemPrice(it);
                                        const qty = getItemQty(it);
                                        const subtotal = (Number(price) || 0) * (Number(qty) || 0);
                                        
                                        return (
                                            <TableRow key={it.id_detail || it.id_menu || idx}>
                                                <TableCell>{getItemName(it)}</TableCell>
                                                <TableCell className="text-right">
                                                    {price != null ? (
                                                        (() => {
                                                            try {
                                                                const conversions = getItemConversions(it);
                                                                if (!conversions) {
                                                                    return <span>${price}</span>;
                                                                }
                                                                
                                                                return <MoneyTip exchangeRates={[{ amount: price }, conversions]} />;
                                                            } catch (error) {
                                                                return <span>${price}</span>;
                                                            }
                                                        })()
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span>{qty}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="inline-flex items-center gap-5">
                                                        <Button
                                                            size="xs"
                                                            variant="light"
                                                            onClick={() => decreaseQty(it.id_menu)}
                                                            disabled={qty <= (baselineQty[it.id_menu] ?? 0)}
                                                        >
                                                            <span className="text-2xl font-bold">-</span>
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="light"
                                                            className="text-lg font-bold"
                                                            onClick={() => increaseQty(it.id_menu)}
                                                        >
                                                            <span className="text-2xl font-bold">+</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <MoneyTip exchangeRates={[{ amount: subtotal }, getSubtotalConversions(it)]} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        onClick={() => showItemDetails(it)}
                                                        title={it.description ? "Ver detalles: " + it.description : "Agregar detalles"}
                                                        className={it.description ? "text-orange-600 hover:text-orange-700" : "text-blue-600 hover:text-blue-700"}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={it.description ? "#F59E0B" : "currentColor"} className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                                        </svg>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {currentItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-500">
                                                No hay items en la orden.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-3 flex justify-end text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Total:</span>
                                {totalConversions ? (
                                    <MoneyTip exchangeRates={[{ amount: computedTotal }, totalConversions]} />
                                ) : (
                                    <span>${computedTotal.toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="flex my-4 items-center justify-end gap-5">
                        <Button variant="light" onClick={handleClose}>Cerrar</Button>
                        <Button onClick={confirmSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Confirmar cambios'}
                        </Button>
                </div>
            </DialogPanel>
        </Dialog>
        
        {showDetailItem && (
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
                    <h2 className="text-xl font-bold mb-4">
                        {baselineQty[selectedDetailItem?.id_menu] > 0 
                            ? `Detalle de ${selectedDetailItem?.name}` 
                            : `Agregar Detalle a ${selectedDetailItem?.name}`}
                    </h2>
                    <textarea
                        className="w-full p-3 border rounded-md text-base resize-none"
                        placeholder={baselineQty[selectedDetailItem?.id_menu] > 0 ? "No hay detalles agregados" : "El cliente es alérgico a..."}
                        value={itemDetail}
                        onChange={(e) => setItemDetail(e.target.value)}
                        rows="3"
                        style={{ fontSize: '16px' }}
                        autoFocus
                        readOnly={baselineQty[selectedDetailItem?.id_menu] > 0}
                        disabled={baselineQty[selectedDetailItem?.id_menu] > 0}
                    />
                    <div className="flex justify-end gap-4 mt-4">
                        {baselineQty[selectedDetailItem?.id_menu] > 0 ? (
                            // Para items originales: solo botón de cerrar
                            <Button
                                type="button"
                                onClick={() => {
                                    setShowDetailItem(false);
                                    // Reabrir el diálogo principal
                                    setTimeout(() => {
                                        setIsOpen(true);
                                    }, 100);
                                }}
                                onTouchStart={() => {}}
                                className="border-none rounded-md bg-blue-500 hover:bg-blue-700 text-white text-base font-medium cursor-pointer select-none"
                                style={{ minWidth: '120px', WebkitTapHighlightColor: 'transparent' }}
                            >
                                Cerrar
                            </Button>
                        ) : (
                            // Para items nuevos: botones de cancelar y guardar
                            <>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowDetailItem(false);
                                        // Reabrir el diálogo principal
                                        setTimeout(() => {
                                            setIsOpen(true);
                                        }, 100);
                                    }}
                                    onTouchStart={() => {}}
                                    className="border-none rounded-md bg-gray-500 hover:bg-gray-700 text-white text-base font-medium cursor-pointer select-none"
                                    style={{ minWidth: '120px', WebkitTapHighlightColor: 'transparent' }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => saveDetail(itemDetail)}
                                    onTouchStart={() => {}}
                                    className="border-none rounded-md bg-green-500 hover:bg-green-700 text-white text-base font-medium cursor-pointer select-none"
                                    style={{ minWidth: '120px', WebkitTapHighlightColor: 'transparent' }}
                                >
                                    Guardar Detalle
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        {/* Notificaciones globales - disponibles para diálogo principal y modo móvil */}
        {notification.message && (
            <div className={`fixed top-5 right-5 z-[99999] p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {notification.message}
            </div>
        )}
        
        {/* Overlay de menú para móviles */}
        {mobileMode && (
            <div className="fixed inset-0 z-[300] bg-black/70 flex justify-center items-center sm:hidden" onClick={() => {
                setMobileMode(false);
                // Reabrir el diálogo principal sin recargar la orden
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
                            // Reabrir el diálogo principal sin recargar la orden
                            setTimeout(() => {
                                setIsOpen(true);
                            }, 100);
                        }} className="clean p-1 w-32 h-[34px] rounded-md border-none bg-red-500 hover:bg-red-700 text-white">Cerrar</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {menusFiltered.map((item) => (
                            <div key={item.id_menu} className="flex items-center justify-between border rounded p-2">
                                <div>
                                    <div className="font-semibold cursor-pointer text-blue-900 hover:underline">{item.name}</div>
                                    <MoneyTip exchangeRates={[item.price, item.price_conversions]} />
                                    <p className="text-sm max-h-[22px] text-gray-500 mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                                </div>
                                <Button size="xs" onClick={() => handleAddMenuToOrder(item)} disabled={item.availability === false || (item.stock !== undefined && item.stock <= 0)}>
                                    Agregar
                                </Button>
                            </div>
                        ))}
                        {menusFiltered.length === 0 && !loadingMenus && (
                            <div className="text-xs text-gray-500">No hay menús para mostrar.</div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default AddItemOrder;
