import React, { useState, useEffect } from "react";
import Loading from "../Loading/Loading";
import ApiService from "../../api";
import DetailsMenu from "./DetailsMenu";
import { useAuth } from "../../AuthContext";
import { Button } from "@tremor/react";
import MoneyTip from "./MoneyTip";

export default function DialogOrder({ isOpen, setisOpen, data }) {
    const [loading, setLoading] = useState(false);
    const [menus, setMenus] = useState([]); // Estado para los items del menú
    const { user } = useAuth();
    const [order, setOrder] = useState({}); // Estado para el pedido actual
    const [filter, setFilter] = useState(''); // Estado para el filtro de búsqueda
    const [menusFiltered, setMenusFiltered] = useState([]); // Estado para los items del menú filtrados
    const [detailsMenuD, setDetailsMenuD] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null); // Estado para el menú seleccionado
    const [mobileMode, setMobileMode] = useState(false); // Estado para el modo de pantalla

    const [ShowDetailItem, setShowDetailItem] = useState(false);
    const [itemDetail, setItemDetail] = useState("");
    const [selectedDetailItem, setSelectedDetailItem] = useState(null);

    // const [typeSelected, setTypeSelected] = useState(3);
    // const [typesOrders, setTypeOrders] = useState([])

    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ message: null, type: '' });

    // Cargar el menú al cargar el componente
    useEffect(() => {
        setLoading(true);
        const apiService = new ApiService();
        apiService.getMenus()
            .then(data => {
                setMenus(data);
                setMenusFiltered(data);
            })
            .catch(error => {
                console.error("Error fetching menus:", error);
            })
            .finally(() => setLoading(false));
        // apiService.getTypeOrders()
        //     .then(data => {
        //         setTypeOrders(data);
        //     })
        //     .catch(error => {
        //         console.error("Error fetching type orders:", error);
        //     });
            
    }, []);

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

    //Manejar el tipo de orden
    // const handleTypeOrder = (e) => {
    //     console.log(e.target.value);
    //     setTypeSelected(e.target.value);
    // }

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
                return {
                    ...prev,
                    [data.id_menu]: {
                        ...existingItem,
                        quantity: existingItem.quantity + 1,
                        discount: 0
                    }
                };
            } else {
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

    // Calcular el total del pedido
    const getTotal = () => {
        return Object.values(order).reduce((total, item) => total + item.price * item.quantity, 0);
    };

    // Guardar detalle para un menu de la orden
    const showItemDetails = (item) => {
        setShowDetailItem(true);
        setSelectedDetailItem(item);
        setItemDetail(item.detail || "");
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
        setisOpen(false);
        setOrder({});
    };

    return(
        loading ? <Loading /> : 
        <div className="fixed grid rounded-lg flex-col p-5 justify-center items-center overflow-y-auto top-[calc(50%)] left-[calc(50%)] -translate-x-[50%] -translate-y-[50%] z-50 bg-white w-[90%] h-[90%]">
            {notification.message && (
                <div className={`fixed top-5 right-5 z-[60] p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
            <h1 className="text-2xl font-bold text-center">Crear Orden para la mesa {data.number}</h1>
            <hr className="w-full mt-5"/>
            <div className="flex max-sm:flex-col sm:flex-row w-full h-[621px]">
                <div className="sm:w-1/2 h-full flex flex-col justify-start items-start">
                    
                    <h2 className="text-xl font-bold my-5 w-full">Menú</h2>
                    
                    <Button onClick={() => setMobileMode(!mobileMode)} className="hidden max-sm:block">Ver Menu</Button>

                    <div onClick={() => setMobileMode(false)} className={`${mobileMode ? 'fixed w-full h-full top-0 left-0 bg-black/70': 'flex w-full h-full max-h-[88%]'}`}>
                        <div onClick={(e) => e.stopPropagation()} className={` w-full px-2 h-full max-h-[88%] ${mobileMode ? 'fixed rounded-lg bg-white w-[80%] h-[85%] top-[calc(50%)] left-[calc(50%)] -translate-x-[50%] -translate-y-[50%] overflow-hidden' : 'max-sm:hidden'}`}>
                            
                            <div className="flex items-center gap-2">
                            <input value={filter} onChange={e => setFilter(e.target.value.toLowerCase())} type="text" placeholder="Buscar" className=" w-full p-1 my-2 border rounded-md" id="search_menus"/>
                            <Button onClick={() => setMobileMode(false)} className={`clean p-1 w-40 h-[34px] rounded-md bg-red-500 hover:bg-red-700 text-white ${mobileMode ? 'block' : 'hidden'}`}>Cerrar</Button>
                            </div>
                            
                            {menusFiltered.length > 0 && (
                                <div className="h-full pb-12 grid grid-cols-1 lg:sm:grid-cols-2 gap-6 overflow-y-auto">
                                    {menusFiltered.map((item) => (
                                        <div key={item.id_menu} className="w-full h-48 grid grid-row-4 p-4 border rounded-lg justify-between shadow-md">
                                                <h3 onClick={() => openDetailsMenu(item)} className="font-semibold cursor-pointer text-blue-900 hover:underline">{item.name}</h3>
                                                <MoneyTip exchangeRates={[item.price, item.price_conversions]} />
                                                <p className="text-sm max-h-[22px] text-gray-500 mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                                                {item.stock > 5 && item.availability === true ? (
                                                    <Button onClick={() => handleOrderChange(item)} className="clean w-full">Agregar</Button>
                                                ) : (
                                                    <Button className="disabled clean" disabled>Agregar</Button>
                                                )}                      
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {detailsMenuD && selectedMenuItem && (
                                <DetailsMenu isDmOpen={detailsMenuD} setisDmOpen={setDetailsMenuD} data={selectedMenuItem}/>
                            )}
                        </div>
                    </div>
                </div>
                <div className="sm:w-2/3 h-full flex flex-col justify-start items-start">

                    <h2 className="text-xl font-bold my-5 w-full">Resumen del Pedido</h2>
                    <div className="p-4 pb-0 border rounded-lg shadow-md w-full h-[88%] flex flex-col">
                        {Object.keys(order).length > 0 ? (
                            <div className="flex-grow overflow-y-auto flex flex-col gap-2">
                                {Object.values(order).map((item) => {
                                    return(
                                    <div key={item.id_menu} className="flex flex-row justify-between items-center p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <MoneyTip exchangeRates={[item.price, item.price_conversions]}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div onClick={() => showItemDetails(item)} className="clean px-1 py-1 bg-slate-600 text-white rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                                </svg>
                                            </div>
                                            <Button onClick={() => handleDecreaseItem(item.id_menu)} className="border-none px-2 py-1 bg-red-500 hover:bg-red-700 text-white rounded">-</Button>
                                            <span>{item.quantity}</span>
                                            <Button onClick={() => handleOrderChange(item)} className="border-none px-2 py-1 bg-green-500 hover:bg-green-700 text-white rounded">+</Button>
                                        </div>
                                    </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex-grow text-gray-500">
                                No hay items para mostrar.
                            </div>
                        )}

                        <div className="flex flex-col justify-between h-min w-full mb-5">
                            <hr className="w-full mt-5"/>
                            <h3 className="text-xl font-semibold">Total: ${getTotal()}</h3>
                            {/* <div className="grid auto-rows-auto grid-cols-2 lg:flex w-full lg:space-x-3 h-full items-center lg:overflow-x-auto">
                                {typesOrders.map(type => (
                                    <div key={type.id_type}>
                                        <input
                                            type="radio"
                                            id={`order_type_${type.id_type}`}
                                            name="orderType"
                                            value={type.id_type}
                                            onChange={handleTypeOrder}
                                            className="hidden peer"
                                            checked={typeSelected === type.id_type}
                                        />
                                        <label htmlFor={`order_type_${type.id_type}`} className="flex justify-center items-center text-center w-full px-3 py-2 border lg:whitespace-nowrap rounded-lg bg-[#2da0e2] hover:bg-[#1874dc] text-white cursor-pointer peer-checked:bg-blue-600">
                                            {type.name}
                                        </label>
                                    </div>
                                ))}
                            </div> */}
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
            {ShowDetailItem && (
                <div className="fixed inset-0 h-[111%] bg-black/70 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-2/3">
                        <h2 className="text-xl font-bold mb-4">Agregar Detalle a {selectedDetailItem.name}</h2>
                        <textarea
                            className="w-full p-2 border rounded-md"
                            placeholder="El cliente es alerfico a..."
                            value={itemDetail}
                            onChange={(e) => setItemDetail(e.target.value)}
                            rows="3"
                        />
                        <div className="flex justify-end gap-4 mt-4">
                            <Button
                                onClick={() => setShowDetailItem(false)}
                                className="border-none rounded-md bg-gray-500 hover:bg-gray-700 text-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => saveDetail(itemDetail)}
                                className="border-none rounded-md bg-green-500 hover:bg-green-700 text-white"
                            >
                                Guardar Detalle
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}