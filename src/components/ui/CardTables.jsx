import React, { useEffect, useState } from "react";
import DialogOrder from "./DialogOrders";
import { useAuth } from "../../AuthContext";
import ApiService from "../../api";
import { Button } from "@tremor/react";

export default function CardTable({ data, onTableUpdate }) {
    const { user } = useAuth();
    const [showDetails, setShowDetails] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [showClaimDialog, setShowClaimDialog] = useState(false);
    const [guests, setGuests] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleCardClick = async () => {
        if (isClaiming) return;

        // Si la mesa ya está asignada al mesero actual o el usuario es admin, abrir directamente.
        if (data.waiter_username === user.username || user.role === 1) {
            setShowDetails(true);
            return;
        }

        // Si la mesa está libre, abrir el diálogo para reclamar.
        if (data.status_name === 'Disponible') {
            setShowClaimDialog(true);
        } else if (data.status_name === 'Ocupado' && data.waiter_username === user.username) {
            setShowDetails(true);
        } 
        else if (data.status_name === 'Ocupado' && data.waiter_username !== user.username) {
            alert(`Esta mesa está siendo atendida por ${data.waiter_name}.`);
        } else {
        }
    };

    const handleConfirmClaim = async () => {
        const numGuests = parseInt(guests, 10);
        if (isNaN(numGuests) || numGuests <= 0) {
            setValidationError('Por favor, ingrese un número válido de invitados.');
            return;
        }
        if (numGuests > data.capacity) {
            setValidationError(`El número de invitados no puede exceder la capacidad de la mesa (${data.capacity}).`);
            return;
        }

        setValidationError('');
        setIsClaiming(true);
        try {
            const apiService = new ApiService(user.token);
            await apiService.claimTable(data.id_table, user.username, numGuests);
            setShowClaimDialog(false);
            // Notificamos al componente padre para que actualice la lista de mesas
            if (onTableUpdate) {
                onTableUpdate();
            }
        } catch (error) {
            console.error("Error al reclamar la mesa:", error);
            alert("No se pudo reclamar la mesa. Puede que ya haya sido ocupada.");
        } finally {
            setIsClaiming(false);
            setGuests('');
        }
    };

    const closeClaimDialog = () => {
        setShowClaimDialog(false);
        setGuests('');
        setValidationError('');
    };

    useEffect(() => {
        if (showDetails || showClaimDialog) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDetails, showClaimDialog]);
    return(
        <>
            <div key={data.id_table} onClick={handleCardClick} className={`relative cursor-pointer rounded-xl p-4 text-center transition-all duration-300 transform hover:scale-105 ${showClaimDialog ? 'ring-4 ring-orange-400 shadow-xl' : 'shadow-md'}`}>
                {isClaiming && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <p className="text-white animate-pulse">Reclamando...</p>
                    </div>
                )}
                <div className={`w-full h-16 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-lg ${(data.status_name === 'Disponible') ? 'bg-green-500' : 'bg-red-500'}`}>
                    Mesa {data.number}
                </div>
                <ul className="list-none p-0">
                    <li className="mb-2 flex items-center justify-between">
                        <span className="w-16 font-semibold text-gray-700">Sección:</span>
                        <span className="text-gray-900">{data.section}</span>
                    </li>
                    <li className="mb-2 flex items-center justify-between">
                        <span className="w-16 font-semibold text-gray-700">Capacidad:</span>
                        <span className="text-gray-900">{data.capacity}</span>
                    </li>
                    {data.waiter_name && (
                        <li className="mb-2 flex items-center justify-between">
                            <span className="w-16 font-semibold text-gray-700">Mesero:</span>
                            <span className="text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: '100px' }} title={data.waiter_name}>{data.waiter_name}</span>
                        </li>
                    )}
                    {data.guests && (
                        <li className="mb-2 flex items-center justify-between">
                            <span className="w-16 font-semibold text-gray-700">Invitados:</span>
                            <span className="text-gray-900">{data.guests}</span>
                        </li>
                    )}
                </ul>
            </div>
            {showClaimDialog && (
                <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/3">
                        <h2 className="text-xl font-bold mb-4">Reclamar Mesa {data.number}</h2>
                        <p className="mb-4">Capacidad máxima: {data.capacity}</p>
                        <div>
                            <label htmlFor="guests" className="block text-sm font-medium text-gray-700">Número de Invitados</label>
                            <input
                                type="number"
                                id="guests"
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ej: 2"
                                min="1"
                                max={data.capacity}
                            />
                            {validationError && <p className="text-red-500 text-sm mt-1">{validationError}</p>}
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <Button
                                onClick={closeClaimDialog}
                                className="border-none rounded-md bg-gray-500 hover:bg-gray-700 text-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmClaim}
                                className="border-none rounded-md bg-green-500 hover:bg-green-700 text-white"
                            >
                                Reclamar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showDetails && (
                <div onClick={() => setShowDetails(false)} className="fixed bg-black/70 z-40  inset-0 flex justify-center items-center">
                    <div onClick={(e) => e.stopPropagation()}>
                        <DialogOrder isOpen={showDetails} setisOpen={setShowDetails} data={data} />
                    </div>
                </div>
            )}
        </>
    )
}