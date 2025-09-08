import React, { useState, useEffect } from "react";
import ApiService from "../../api";
import DetailsMenu from "./DetailsMenu";

export default function DialogOrder({ isOpen, setisOpen, data }) {
    const [menus, setMenus] = useState([]); // Estado para los items del menú
    const [order, setOrder] = useState({}); // Estado para el pedido actual
    const [filter, setFilter] = useState(''); // Estado para el filtro de búsqueda
    const [menusFiltered, setMenusFiltered] = useState([]); // Estado para los items del menú filtrados
    const [detailsMenuD, setDetailsMenuD] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null); // Estado para el menú seleccionado

    // Cargar el menú al cargar el componente
    useEffect(() => {
        const apiService = new ApiService();
        apiService.getMenus() // Asegúrate de que getMenus no requiera token si no lo estás pasando
            .then(data => {
                setMenus(data);
                setMenusFiltered(data);
            })
            .catch(error => {
                console.error("Error fetching menus:", error);
            });
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

    // Abrir el diálogo de detalles del menu
    const openDetailsMenu = (item) => {
        setDetailsMenuD(true);
        console.log(item);
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

    //Guardar Orden
    const saveOrder = () => {
        // const apiService = new ApiService();
        const orderData = {
            id_table: data.id_table,
            order: Object.values(order).map(item => ({
                id_menu: item.id_menu,
                quantity: item.quantity,
                discount: item.discount
            })),
        };
        console.log(orderData);
        // apiService.createOrder(orderData)
        //     .then(response => {
        //         console.log("Orden creada exitosamente:", response);
        //         closeDialog();
        //     })
        //     .catch(error => {
        //         console.error("Error al crear la orden:", error);
        //     });
    };

    // Cerrar el diálogo
    const closeDialog = () => {
        setisOpen(false);
        setOrder({});
    };

    return(
        <div className="fixed rounded-lg flex-col px-5 py-10 overflow-hidden top-[calc(50%)] left-[calc(50%)] -translate-x-[50%] -translate-y-[50%] z-50 flex justify-center items-center bg-white w-[90%] h-[90%]">
            <h1 className="text-2xl font-bold">Crear Orden para la mesa {data.number}</h1>
            <hr className="w-full mt-5"/>
            <div className="flex max-sm:flex-col sm:flex-row w-full h-full">
                <div className="max-sm:h-1/3 sm:w-1/2 h-full flex flex-col justify-start items-start">
                    
                    <h2 className="text-xl font-bold my-5 w-full">Menú</h2>
                    
                    <div className="max-sm:hidden w-full px-2 h-[85%]">
                        
                        <input
                            value={filter}
                            onChange={e => setFilter(e.target.value.toLowerCase())}
                            type="text"
                            placeholder="Buscar"
                            className=" w-full p-1 my-2 border rounded-md"
                            id="search_menus"
                        />
                        
                        {menusFiltered.length > 0 && (
                            <div className="h-full pb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 overflow-y-auto">
                                {menusFiltered.map((item) => (
                                    <div key={item.id_menu} className="w-full h-48 grid grid-row-4 p-4 border rounded-lg justify-between shadow-md">
                                            <h3 onClick={() => openDetailsMenu(item)} className="font-semibold cursor-pointer text-blue-900 hover:underline">{item.name}</h3>
                                            <p className="text-gray-600 mt-2">${item.price}</p>
                                            <p className="text-sm text-gray-500 mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                                            {item.stock > 5 && item.availability === true ? (
                                                <button onClick={() => handleOrderChange(item)} className="clean">Agregar</button>
                                            ) : (
                                                <button className="disabled clean" disabled>Agregar</button>
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
                <div className="max-sm:w-full w-1/2 h-full flex flex-col justify-start items-start">

                    <h2 className="text-xl font-bold my-5 w-full">Resumen del Pedido</h2>

                    <div className="p-4 border rounded-lg shadow-md w-full h-full flex flex-col justify-between max-h-[85%]">

                        {Object.keys(order).length > 0 ? (
                            <div className="flex-grow overflow-y-auto flex flex-col gap-2 max-h-[55%]">
                                {Object.values(order).map((item) => (
                                    <div key={item.id_menu} className="flex flex-row justify-between items-center p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <p className="text-gray-600">${item.price}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleDecreaseItem(item.id_menu)} className="clean px-2 py-1 bg-red-500 hover:bg-red-700 text-white rounded">-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => handleOrderChange(item)} className="clean px-2 py-1 bg-green-500 hover:bg-green-700 text-white rounded">+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-grow text-gray-500">
                                No hay items para mostrar.
                            </div>
                        )}
                        <div className="flex flex-col justify-between">
                            <hr className="w-full mt-5"/>
                            <div className="mt-4">
                                <h3 className="text-xl font-semibold">Total: ${getTotal()}</h3>
                            </div>
                            <div className="flex justify-between mt-4">
                                <button onClick={saveOrder} className="clean rounded-md bg-green-500 hover:bg-green-700 text-white">Guardar Orden</button>
                                <button onClick={closeDialog} className="clean rounded-md bg-red-500 hover:bg-red-700 text-white">Cancelar</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}