import React, { useEffect, useState } from "react";
import DialogOrder from "./DialogOrders";
import { useAuth } from "../../AuthContext";
import ApiService from "../../api";

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
        if (data.username === user.username || user.role === 1) {
            setShowDetails(true);
            return;
        }

        // Si la mesa está libre, abrir el diálogo para reclamar.
        if (data.status_name === 'Activo') {
            setShowClaimDialog(true);
        } else if (data.status_name === 'Ocupado' && data.waiter_username === user.username) {
            setShowDetails(true);
        } 
        else if (data.status_name === 'Ocupado' && data.waiter_username !== user.username) {
            alert(`Esta mesa está siendo atendida por ${data.waiter_name}.`);
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
            <div key={data.id_table} onClick={handleCardClick} className={`group cursor-pointer relative p-6 rounded-xl shadow-md flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${data.status_name === 'Activo' ? 'bg-green-500 text-white' : 'bg-red-700 text-white'}`}>
                {isClaiming && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <p className="text-white animate-pulse">Reclamando...</p>
                    </div>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="size-10 m-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <h3 className="text-lg font-bold">Mesa {data.number}</h3>
                <p>Seccion: {data.section}</p>
                <p>Capacidad: {data.capacity}</p>
                {data.waiter_name && (
                    <p>Mesero: {data.waiter_name}</p>
                )}
                {data.guests && (
                    <p>Invitados: {data.guests}</p>
                )}
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
                            <button
                                onClick={closeClaimDialog}
                                className="clean rounded-md bg-gray-500 hover:bg-gray-700 text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmClaim}
                                className="clean rounded-md bg-green-500 hover:bg-green-700 text-white"
                            >
                                Reclamar
                            </button>
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